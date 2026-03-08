import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID");
    const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
      throw new Error("Twitter API credentials not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "auth-url") {
      // No auth required - this is the login entry point
      const { redirect_uri, code_verifier } = await req.json();

      // Generate code challenge from code verifier (S256)
      const encoder = new TextEncoder();
      const data = encoder.encode(code_verifier);
      const digest = await crypto.subtle.digest("SHA-256", data);
      const code_challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const state = crypto.randomUUID();

      const params = new URLSearchParams({
        response_type: "code",
        client_id: TWITTER_CLIENT_ID,
        redirect_uri,
        scope: "tweet.read users.read bookmark.read offline.access",
        state,
        code_challenge,
        code_challenge_method: "S256",
      });

      const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

      return new Response(JSON.stringify({ auth_url: authUrl, state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "callback") {
      // Exchange authorization code for Twitter tokens
      const { code, redirect_uri, code_verifier } = await req.json();

      const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          redirect_uri,
          code_verifier,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Token exchange failed:", tokenData);
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      // Get Twitter user info
      const meRes = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url,verified", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const meData = await meRes.json();
      if (!meRes.ok) {
        console.error("Failed to get user info:", meData);
        throw new Error(`Failed to get user info: ${JSON.stringify(meData)}`);
      }

      const twitterUser = meData.data;
      const email = `${twitterUser.id}@x-user.local`;

      // Find or create Supabase user by twitter_user_id
      // First check if profile with this twitter_user_id exists
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("twitter_user_id", twitterUser.id)
        .single();

      let userId: string;

      if (existingProfile) {
        userId = existingProfile.user_id;
      } else {
        // Create new Supabase user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { twitter_username: twitterUser.username },
        });

        if (createError) {
          // User might already exist with this email
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const found = listData?.users?.find((u) => u.email === email);
          if (!found) throw new Error(`Failed to create user: ${createError.message}`);
          userId = found.id;
        } else {
          userId = newUser.user.id;
        }
      }

      // Update profile with Twitter data
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            twitter_user_id: twitterUser.id,
            twitter_username: twitterUser.username,
            twitter_display_name: twitterUser.name,
            twitter_avatar_url: twitterUser.profile_image_url,
            twitter_access_token: tokenData.access_token,
            twitter_refresh_token: tokenData.refresh_token,
            twitter_token_expires_at: expiresAt.toISOString(),
          },
          { onConflict: "user_id" }
        );

      // Generate a session for this user
      // We use a custom token approach: generate a magic link token
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

      if (sessionError || !sessionData) {
        console.error("Session generation error:", sessionError);
        throw new Error("Failed to generate session");
      }

      // Extract the token hash from the link
      const linkUrl = new URL(sessionData.properties?.action_link || "");
      const token_hash = linkUrl.searchParams.get("token") ||
        linkUrl.hash?.replace("#", "") ||
        "";

      // We need to extract hashed_token from the action_link
      // The action_link format: {SITE_URL}/auth/confirm?token_hash=xxx&type=magiclink
      const hashed_token = linkUrl.searchParams.get("token_hash") || token_hash;

      return new Response(
        JSON.stringify({
          token_hash: hashed_token,
          email,
          twitter_user: {
            id: twitterUser.id,
            username: twitterUser.username,
            name: twitterUser.name,
            avatar: twitterUser.profile_image_url,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refresh-token") {
      // This action requires auth
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No authorization header");

      const supabaseClient = createClient(
        SUPABASE_URL,
        Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || ""
      );
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (userError || !user) throw new Error("Unauthorized");

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("twitter_refresh_token")
        .eq("user_id", user.id)
        .single();

      if (!profile?.twitter_refresh_token) {
        throw new Error("No refresh token found");
      }

      const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: profile.twitter_refresh_token,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(`Token refresh failed: ${JSON.stringify(tokenData)}`);
      }

      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      await supabaseAdmin
        .from("profiles")
        .update({
          twitter_access_token: tokenData.access_token,
          twitter_refresh_token: tokenData.refresh_token,
          twitter_token_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error("twitter-auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
