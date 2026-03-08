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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fetch twitter profile
          const { data } = await supabase
            .from("profiles")
            .select("twitter_user_id, twitter_username, twitter_display_name, twitter_avatar_url")
            .eq("user_id", session.user.id)
            .single();
          setTwitterProfile(data);
        } else {
          setTwitterProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("twitter_user_id, twitter_username, twitter_display_name, twitter_avatar_url")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => setTwitterProfile(data));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTwitterProfile(null);
  }, []);

  const isTwitterConnected = !!twitterProfile?.twitter_user_id;

  return { user, twitterProfile, loading, signUp, signIn, signOut, isTwitterConnected };
}
