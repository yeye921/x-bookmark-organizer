import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function useTwitterAuth() {
  const [connecting, setConnecting] = useState(false);

  const connectTwitter = useCallback(async () => {
    setConnecting(true);
    try {
      const codeVerifier = generateCodeVerifier();
      const redirectUri = `${window.location.origin}/twitter-callback`;

      // Store code verifier for the callback
      sessionStorage.setItem("twitter_code_verifier", codeVerifier);
      sessionStorage.setItem("twitter_redirect_uri", redirectUri);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await supabase.functions.invoke("twitter-auth", {
        body: { redirect_uri: redirectUri, code_verifier: codeVerifier },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
      });

      // Handle the response - supabase.functions.invoke returns { data, error }
      if (response.error) {
        throw new Error(response.error.message || "Failed to get auth URL");
      }

      const result = typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;

      // Need to pass action as query param
      const authUrlResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitter-auth?action=auth-url`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ redirect_uri: redirectUri, code_verifier: codeVerifier }),
        }
      );

      const authData = await authUrlResponse.json();
      if (!authUrlResponse.ok) {
        throw new Error(authData.error || "Failed to get auth URL");
      }

      sessionStorage.setItem("twitter_state", authData.state);

      // Redirect to Twitter
      window.location.href = authData.auth_url;
    } catch (error) {
      console.error("Twitter connect error:", error);
      setConnecting(false);
      throw error;
    }
  }, []);

  const handleCallback = useCallback(async (code: string, state: string) => {
    const savedState = sessionStorage.getItem("twitter_state");
    const codeVerifier = sessionStorage.getItem("twitter_code_verifier");
    const redirectUri = sessionStorage.getItem("twitter_redirect_uri");

    if (state !== savedState) {
      throw new Error("State mismatch - possible CSRF attack");
    }

    if (!codeVerifier || !redirectUri) {
      throw new Error("Missing PKCE data");
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitter-auth?action=callback`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ code, redirect_uri: redirectUri, code_verifier: codeVerifier }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Callback failed");
    }

    // Clean up
    sessionStorage.removeItem("twitter_code_verifier");
    sessionStorage.removeItem("twitter_redirect_uri");
    sessionStorage.removeItem("twitter_state");

    return result;
  }, []);

  return { connectTwitter, handleCallback, connecting };
}
