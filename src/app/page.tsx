"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Me = { data: { id: string; name?: string; username: string } };

type Folder = { id: number; name: string };
type Bookmark = {
  id: number;
  tweet_id: string;
  text: string;
  author_username: string | null;
  created_at: string | null;
  url: string | null;
  domain: string | null;
  media_json: string | null;
  folder_id: number | null;
  folder_name: string | null;
};

export default function Home() {
  const [me, setMe] = useState<Me["data"] | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<Bookmark[]>([]);

  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const isLoggedIn = !!me;

  const folderMap = useMemo(() => {
    const m = new Map<number, string>();
    folders.forEach((f) => m.set(f.id, f.name));
    return m;
  }, [folders]);

  async function checkAuth() {
    setAuthLoading(true);
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      if (!r.ok) {
        setMe(null);
        return;
      }
      const j = (await r.json()) as Me;
      setMe(j.data);
    } catch {
      setMe(null);
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadFolders() {
    const r = await fetch("/api/folders", { cache: "no-store" });
    const j = await r.json();
    setFolders(j.items ?? []);
  }

  async function loadBookmarks(nextQ?: string) {
    const query = typeof nextQ === "string" ? nextQ : q;

    setLoadingList(true);
    try {
      const r = await fetch(`/api/bookmarks?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      setItems(j.items ?? []);
    } finally {
      setLoadingList(false);
    }
  }

  async function sync() {
    if (!isLoggedIn) return;

    setSyncing(true);
    try {
      const r = await fetch("/api/sync/bookmarks", { method: "POST" });
      const j = await r.json();

      if (!r.ok) {
        alert(JSON.stringify(j, null, 2));
        return;
      }

      await loadBookmarks();
    } finally {
      setSyncing(false);
    }
  }

  async function moveFolder(bookmarkId: number, folderId: number) {
    const r = await fetch("/api/bookmarks/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarkId, folderId }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(JSON.stringify(j, null, 2));
      return;
    }

    // UI 즉시 반영
    setItems((prev) =>
      prev.map((b) =>
        b.id === bookmarkId
          ? {
              ...b,
              folder_id: folderId,
              folder_name: folderMap.get(folderId) ?? b.folder_name,
            }
          : b,
      ),
    );
  }

  useEffect(() => {
    // 최초 진입: 인증 확인 + 폴더 + 리스트
    (async () => {
      await checkAuth();
      await loadFolders();
      await loadBookmarks("");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="p-6 space-y-4">
      {/* 상단 바 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 🔐 로그인 버튼: 항상 보이게 */}
        <Button asChild variant="outline">
          <a href="/api/auth/x/start">
            {isLoggedIn ? `@${me?.username} (다시 로그인)` : "X로 로그인"}
          </a>
        </Button>

        {/* 🔄 동기화 버튼: 로그인 상태에서만 활성 */}
        <Button onClick={sync} disabled={!isLoggedIn || syncing}>
          {syncing ? "동기화 중..." : "북마크 동기화"}
        </Button>

        {/* 검색 */}
        <Input
          className="w-64"
          placeholder="검색 (본문/작성자/도메인) — Enter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadBookmarks(e.currentTarget.value);
          }}
        />

        <Badge variant="secondary">
          {authLoading
            ? "인증 확인 중"
            : isLoggedIn
              ? "로그인됨"
              : "로그인 필요"}
        </Badge>

        <Button
          variant="secondary"
          onClick={() => loadBookmarks()}
          disabled={loadingList}
        >
          {loadingList ? "불러오는 중..." : "목록 새로고침"}
        </Button>
      </div>

      {/* 리스트 */}
      <div className="space-y-3">
        {items.map((b) => (
          <Card key={b.id} className="max-w-3xl">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">
                  {b.author_username ? `@${b.author_username}` : "@unknown"}
                </CardTitle>

                <Badge>{b.folder_name ?? "미분류"}</Badge>

                <div className="ml-auto flex items-center gap-2">
                  {/* 폴더 이동 */}
                  <Select
                    value={String(b.folder_id ?? "")}
                    onValueChange={(v) => moveFolder(b.id, Number(v))}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="폴더 이동" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {b.url ? (
                    <Button asChild variant="ghost">
                      <a href={b.url} target="_blank" rel="noreferrer">
                        원문
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                {b.domain ? <span>{b.domain}</span> : null}
                {b.created_at ? <span>{b.created_at}</span> : null}
              </div>
            </CardHeader>

            {/* 북마크 내용 */}
            <CardContent>
              <div className="text-sm whitespace-pre-wrap">{b.text}</div>
              {/* 미디어 렌더링 */}
              {(() => {
                const medias = b.media_json
                  ? (JSON.parse(b.media_json) as any[])
                  : [];
                if (!medias.length) return null;

                return (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {medias.slice(0, 4).map((m) => {
                      // photo는 url, video/gif는 preview_image_url 썸네일로 표시
                      const src =
                        m.type === "photo" ? m.url : m.preview_image_url;
                      if (!src) return null;

                      return (
                        <img
                          key={m.media_key}
                          src={src}
                          alt={m.alt_text ?? "media"}
                          className="w-full rounded-xl border"
                          loading="lazy"
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            아직 불러온 북마크가 없어요. 로그인 후 동기화를 눌러봐.
          </div>
        )}
      </div>
    </main>
  );
}
