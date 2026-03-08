import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getValidToken(supabaseAdmin: any, userId: string, clientId: string, clientSecret: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("twitter_access_token, twitter_refresh_token, twitter_token_expires_at, twitter_user_id")
    .eq("user_id", userId)
    .single();

  if (!profile?.twitter_access_token) {
    throw new Error("Twitter not connected");
  }

  // Check if token is expired
  const expiresAt = new Date(profile.twitter_token_expires_at);
  if (expiresAt <= new Date()) {
    // Refresh token
    const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
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

    const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await supabaseAdmin
      .from("profiles")
      .update({
        twitter_access_token: tokenData.access_token,
        twitter_refresh_token: tokenData.refresh_token,
        twitter_token_expires_at: newExpiresAt.toISOString(),
      })
      .eq("user_id", userId);

    return { token: tokenData.access_token, twitterUserId: profile.twitter_user_id };
  }

  return { token: profile.twitter_access_token, twitterUserId: profile.twitter_user_id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TWITTER_CLIENT_ID = Deno.env.get("TWITTER_CLIENT_ID")!;
    const TWITTER_CLIENT_SECRET = Deno.env.get("TWITTER_CLIENT_SECRET")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    );
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) throw new Error("Unauthorized");

    const { token, twitterUserId } = await getValidToken(
      supabaseAdmin,
      user.id,
      TWITTER_CLIENT_ID,
      TWITTER_CLIENT_SECRET
    );

    // Fetch bookmarks from Twitter API
    const url = new URL(req.url);
    const paginationToken = url.searchParams.get("pagination_token");

    let apiUrl = `https://api.x.com/2/users/${twitterUserId}/bookmarks?max_results=20&tweet.fields=created_at,public_metrics,attachments&expansions=author_id,attachments.media_keys&user.fields=name,username,profile_image_url,verified&media.fields=url,preview_image_url,type`;

    if (paginationToken) {
      apiUrl += `&pagination_token=${paginationToken}`;
    }

    const bookmarksRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const bookmarksData = await bookmarksRes.json();

    if (!bookmarksRes.ok) {
      console.error("Bookmarks fetch failed:", bookmarksData);
      throw new Error(`Failed to fetch bookmarks [${bookmarksRes.status}]: ${JSON.stringify(bookmarksData)}`);
    }

    // Process and store bookmarks
    const tweets = bookmarksData.data || [];
    const users = bookmarksData.includes?.users || [];
    const media = bookmarksData.includes?.media || [];
    const nextToken = bookmarksData.meta?.next_token;

    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const mediaMap = new Map(media.map((m: any) => [m.media_key, m]));

    const bookmarksToUpsert = tweets.map((tweet: any) => {
      const author = userMap.get(tweet.author_id) as any;
      const tweetMedia = (tweet.attachments?.media_keys || [])
        .map((key: string) => mediaMap.get(key))
        .filter(Boolean)
        .map((m: any) => m.url || m.preview_image_url)
        .filter(Boolean);

      return {
        user_id: user.id,
        tweet_id: tweet.id,
        author_name: author?.name || "Unknown",
        author_handle: `@${author?.username || "unknown"}`,
        author_avatar: author?.profile_image_url || "",
        author_verified: author?.verified || false,
        content: tweet.text || "",
        tweet_timestamp: tweet.created_at,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        views: tweet.public_metrics?.impression_count || 0,
        images: tweetMedia,
        synced_at: new Date().toISOString(),
      };
    });

    if (bookmarksToUpsert.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("bookmarks")
        .upsert(bookmarksToUpsert, {
          onConflict: "user_id,tweet_id",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error("Bookmarks upsert error:", upsertError);
        throw new Error(`Failed to save bookmarks: ${upsertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        synced: bookmarksToUpsert.length,
        next_token: nextToken || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sync-bookmarks error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
