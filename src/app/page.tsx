"use client";
// Next.js App Router에서 클라이언트 컴포넌트로 동작하도록 지정

import { useEffect, useMemo, useState } from "react";

// shadcn/ui 컴포넌트들
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

// =======================
// 타입 정의 영역
// =======================

// 로그인 유저 타입
type Me = {
  data: {
    id: string;
    name?: string;
    username: string;
  };
};

// 폴더 타입
type Folder = {
  id: number;
  name: string;
};

// 북마크 타입 (DB에서 내려주는 구조)
type Bookmark = {
  id: number;
  tweet_id: string;
  text: string;
  author_username: string | null;
  created_at: string | null;
  url: string | null;
  domain: string | null;
  media_json: string | null; // JSON 문자열
  folder_id: number | null;
  folder_name: string | null;
};

export default function Home() {
  // =======================
  // 상태 관리 영역
  // =======================

  const [me, setMe] = useState<Me["data"] | null>(null);
  // 로그인된 유저 정보

  const [authLoading, setAuthLoading] = useState(true);
  // 인증 확인 중인지 여부

  const [folders, setFolders] = useState<Folder[]>([]);
  // 폴더 목록

  const [items, setItems] = useState<Bookmark[]>([]);
  // 북마크 리스트

  const [q, setQ] = useState("");
  // 검색어

  const [syncing, setSyncing] = useState(false);
  // X API 동기화 중 여부

  const [loadingList, setLoadingList] = useState(false);
  // DB 목록 불러오는 중 여부

  const isLoggedIn = !!me;
  // 로그인 여부 boolean

  // =======================
  // 폴더 id → 이름 매핑 캐싱
  // =======================

  const folderMap = useMemo(() => {
    const m = new Map<number, string>();
    folders.forEach((f) => m.set(f.id, f.name));
    return m;
  }, [folders]);
  // moveFolder에서 빠르게 이름 찾기 위해 Map 사용

  // =======================
  // 인증 확인
  // =======================

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

  // =======================
  // 폴더 목록 불러오기
  // =======================

  async function loadFolders() {
    const r = await fetch("/api/folders", { cache: "no-store" });
    const j = await r.json();
    setFolders(j.items ?? []);
  }

  // =======================
  // DB에 저장된 북마크 목록 불러오기
  // (검색어 포함)
  // =======================

  async function loadBookmarks(nextQ?: string) {
    // 검색어 결정
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

  // =======================
  // X API → 최신 북마크 동기화
  // =======================

  async function sync() {
    // 로그인 안되어 있으면 종료
    if (!isLoggedIn) return;

    setSyncing(true);

    try {
      // 서버가 X API 호출해서 DB에 저장
      const r = await fetch("/api/sync/bookmarks", { method: "POST" });
      const j = await r.json();

      if (!r.ok) {
        alert(JSON.stringify(j, null, 2));
        return;
      }

      // 동기화 끝나면 DB에서 다시 목록 불러오기
      await loadBookmarks();
    } finally {
      setSyncing(false);
    }
  }

  // =======================
  // 북마크 폴더 이동
  // =======================

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

    // 서버 성공하면 UI 즉시 반영 (Optimistic UI)
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

  // =======================
  // 최초 진입 시 실행
  // =======================

  useEffect(() => {
    (async () => {
      await checkAuth(); // 로그인 확인
      await loadFolders(); // 폴더 목록
      await loadBookmarks(""); // 북마크 목록
    })();
  }, []);

  // =======================
  // UI 영역
  // =======================

  return (
    <main className="p-6 space-y-4 bg-red-500">
      {/* ===== 상단 컨트롤 바 ===== */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 로그인 버튼 */}
        <Button asChild variant="outline">
          <a href="/api/auth/x/start">
            {isLoggedIn ? `@${me?.username} (다시 로그인)` : "X로 로그인"}
          </a>
        </Button>

        {/* 북마크 동기화 버튼 */}
        <Button onClick={sync} disabled={!isLoggedIn || syncing}>
          {syncing ? "동기화 중..." : "북마크 동기화"}
        </Button>

        {/* 검색 입력 */}
        <Input
          className="w-64"
          placeholder="검색 (본문/작성자/도메인) — Enter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadBookmarks(e.currentTarget.value);
          }}
        />

        {/* 로그인 상태 표시 */}
        <Badge variant="secondary">
          {authLoading
            ? "인증 확인 중"
            : isLoggedIn
              ? "로그인됨"
              : "로그인 필요"}
        </Badge>

        {/* 목록 새로고침 */}
        <Button
          variant="secondary"
          onClick={() => loadBookmarks()}
          disabled={loadingList}
        >
          {loadingList ? "불러오는 중..." : "목록 새로고침"}
        </Button>
      </div>

      {/* ===== 북마크 리스트 ===== */}
      <div className="space-y-3">
        {items.map((b) => (
          <Card key={b.id} className="max-w-3xl">
            {/* 카드 헤더 */}
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* 작성자 */}
                <CardTitle className="text-base">
                  {b.author_username ? `@${b.author_username}` : "@unknown"}
                </CardTitle>

                {/* 현재 폴더 */}
                <Badge>{b.folder_name ?? "미분류"}</Badge>

                {/* 우측 버튼 영역 */}
                <div className="ml-auto flex items-center gap-2">
                  {/* 폴더 이동 드롭다운 */}
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

                  {/* 원문 링크 */}
                  {b.url && (
                    <Button asChild variant="ghost">
                      <a href={b.url} target="_blank" rel="noreferrer">
                        원문
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* 메타 정보 */}
              <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                {b.domain && <span>{b.domain}</span>}
                {b.created_at && <span>{b.created_at}</span>}
              </div>
            </CardHeader>

            {/* 카드 내용 */}
            <CardContent>
              {/* 본문 텍스트 */}
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

        {/* 비어있을 때 안내 */}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            아직 불러온 북마크가 없어요. 로그인 후 동기화를 눌러봐.
          </div>
        )}
      </div>
    </main>
  );
}
