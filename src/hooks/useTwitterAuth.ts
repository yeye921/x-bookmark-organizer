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

      localStorage.setItem("twitter_code_verifier", codeVerifier);
      localStorage.setItem("twitter_redirect_uri", redirectUri);

      // No auth needed - this is the login entry point
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitter-auth?action=auth-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ redirect_uri: redirectUri, code_verifier: codeVerifier }),
        }
      );

      const authData = await response.json();
      if (!response.ok) {
        throw new Error(authData.error || "Failed to get auth URL");
      }

      localStorage.setItem("twitter_state", authData.state);

      // In preview iframe, accessing window.top can throw "The operation is insecure"
      // so try top-navigation first and gracefully fall back to popup.
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = authData.auth_url;
          return;
        }
      } catch {
        // ignore and fallback to popup
      }

      const popup = window.open(authData.auth_url, "_blank", "noopener,noreferrer");
      if (!popup) {
        setConnecting(false);
        throw new Error("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
      }
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

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitter-auth?action=callback`,
      {
        method: "POST",
        headers: {
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

    // Clean up session storage
    sessionStorage.removeItem("twitter_code_verifier");
    sessionStorage.removeItem("twitter_redirect_uri");
    sessionStorage.removeItem("twitter_state");

    // Use the token_hash to verify OTP and sign in
    if (result.token_hash && result.email) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: result.token_hash,
        type: "magiclink",
      });
      if (error) {
        console.error("OTP verify error:", error);
        throw new Error("로그인 세션 생성에 실패했습니다");
      }
    }

    return result;
  }, []);

  return { connectTwitter, handleCallback, connecting };
}
