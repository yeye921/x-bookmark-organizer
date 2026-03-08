import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface TwitterProfile {
  twitter_user_id: string | null;
  twitter_username: string | null;
  twitter_display_name: string | null;
  twitter_avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [twitterProfile, setTwitterProfile] = useState<TwitterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("twitter_user_id, twitter_username, twitter_display_name, twitter_avatar_url")
      .eq("user_id", userId)
      .single();
    setTwitterProfile(data);
  }, []);

  useEffect(() => {
    // 1. Restore session from storage first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for subsequent auth changes (sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setTwitterProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTwitterProfile(null);
  }, []);

  const isTwitterConnected = !!twitterProfile?.twitter_user_id;

  return { user, twitterProfile, loading, signOut, isTwitterConnected };
}
