import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbBookmark {
  id: string;
  tweet_id: string;
  author_name: string | null;
  author_handle: string | null;
  author_avatar: string | null;
  author_verified: boolean | null;
  content: string | null;
  tweet_timestamp: string | null;
  likes: number | null;
  retweets: number | null;
  replies: number | null;
  views: number | null;
  images: string[] | null;
  folder_id: string | null;
  synced_at: string;
}

export interface DbFolder {
  id: string;
  name: string;
  icon: string;
  position: number;
}

export function useBookmarks(userId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<DbBookmark[]>([]);
  const [folders, setFolders] = useState<DbFolder[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [bookmarksRes, foldersRes] = await Promise.all([
      supabase.from("bookmarks").select("*").eq("user_id", userId).order("synced_at", { ascending: false }),
      supabase.from("folders").select("*").eq("user_id", userId).order("position"),
    ]);

    if (bookmarksRes.data) setBookmarks(bookmarksRes.data as DbBookmark[]);
    if (foldersRes.data) setFolders(foldersRes.data as DbFolder[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const syncBookmarks = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      let nextToken: string | null = null;
      let totalSynced = 0;

      do {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-bookmarks${nextToken ? `?pagination_token=${nextToken}` : ""}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        totalSynced += result.synced;
        nextToken = result.next_token;
      } while (nextToken);

      await fetchData();
      return totalSynced;
    } finally {
      setSyncing(false);
    }
  }, [userId, fetchData]);

  const addFolder = useCallback(
    async (name: string, icon: string = "folder") => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("folders")
        .insert({ user_id: userId, name, icon, position: folders.length })
        .select()
        .single();
      if (data) setFolders((prev) => [...prev, data as DbFolder]);
      return { data, error };
    },
    [userId, folders.length]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      await supabase.from("bookmarks").update({ folder_id: null }).eq("folder_id", folderId);
      await supabase.from("folders").delete().eq("id", folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setBookmarks((prev) =>
        prev.map((b) => (b.folder_id === folderId ? { ...b, folder_id: null } : b))
      );
    },
    []
  );

  const moveBookmarkToFolder = useCallback(
    async (bookmarkId: string, folderId: string | null) => {
      await supabase.from("bookmarks").update({ folder_id: folderId }).eq("id", bookmarkId);
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmarkId ? { ...b, folder_id: folderId } : b))
      );
    },
    []
  );

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    await supabase.from("bookmarks").delete().eq("id", bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  }, []);

  return {
    bookmarks,
    folders,
    syncing,
    loading,
    syncBookmarks,
    addFolder,
    deleteFolder,
    moveBookmarkToFolder,
    deleteBookmark,
    refetch: fetchData,
  };
}
