import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getDomain(url?: string) {
  try {
    if (!url) return null;
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("x_access_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "missing x_access_token cookie" },
      { status: 401 },
    );
  }

  // 1) 내 user id 가져오기
  const meRes = await fetch(
    "https://api.x.com/2/users/me?user.fields=username",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  const me = await meRes.json();
  if (!meRes.ok) {
    return NextResponse.json(
      { error: "x api users/me failed", details: me },
      { status: meRes.status },
    );
  }

  const userId: string = me?.data?.id;

  // 2) 북마크 가져오기 (페이지네이션)
  let pagination_token: string | undefined = undefined;
  let totalSavedOrUpdated = 0;
  let totalFetched = 0;

  // ✅ 북마크 순서 랭크: 1이 최신 북마크
  // (북마크 API가 보통 최신부터 반환하므로, 받아오는 순서대로 rank를 부여)
  let rank = 1;

  // ✅ media_json + bookmark_rank 포함하도록 upsert SQL 수정
  const upsert = db.prepare(`
    INSERT INTO bookmarks (
      tweet_id, text, author_username, created_at, url, domain,
      media_json, bookmark_rank,
      folder_id, raw_json
    )
    VALUES (
      @tweet_id, @text, @author_username, @created_at, @url, @domain,
      @media_json, @bookmark_rank,
      @folder_id, @raw_json
    )
    ON CONFLICT(tweet_id) DO UPDATE SET
      text=excluded.text,
      author_username=excluded.author_username,
      created_at=excluded.created_at,
      url=excluded.url,
      domain=excluded.domain,
      media_json=excluded.media_json,
      bookmark_rank=excluded.bookmark_rank,
      raw_json=excluded.raw_json
  `);

  // 미분류 폴더 id 가져오기(없으면 생성돼 있음)
  const uncat = db
    .prepare(`SELECT id FROM folders WHERE name='미분류'`)
    .get() as {
    id: number;
  };

  // 안전 상한(원하면 줄여도 됨)
  const MAX_PAGES = 10;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`https://api.x.com/2/users/${userId}/bookmarks`);
    url.searchParams.set("max_results", "100");

    // ✅ 미디어 포함
    url.searchParams.set(
      "tweet.fields",
      "created_at,entities,author_id,attachments",
    );
    url.searchParams.set("expansions", "author_id,attachments.media_keys");
    url.searchParams.set(
      "media.fields",
      "type,url,preview_image_url,width,height,alt_text",
    );
    url.searchParams.set("user.fields", "username");

    if (pagination_token) {
      url.searchParams.set("pagination_token", pagination_token);
    }

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: "x api bookmarks failed", details: json },
        { status: r.status },
      );
    }

    const tweets: any[] = json?.data ?? [];
    totalFetched += tweets.length;

    // 작성자 맵 (author_id -> username)
    const users: any[] = json?.includes?.users ?? [];
    const authorById = new Map<string, string>();
    for (const u of users) authorById.set(u.id, u.username);

    // 미디어 맵 (media_key -> media object)
    const media: any[] = json?.includes?.media ?? [];
    const mediaByKey = new Map<string, any>();
    for (const m of media) mediaByKey.set(m.media_key, m);

    // 트랜잭션으로 빠르게 저장
    db.transaction(() => {
      for (const t of tweets) {
        // 링크(있으면 첫 번째만)
        const firstUrl = t?.entities?.urls?.[0]?.expanded_url as
          | string
          | undefined;

        // ✅ attachments.media_keys -> includes.media 매칭해서 배열로 저장
        const keys: string[] = t?.attachments?.media_keys ?? [];
        const medias = keys.map((k) => mediaByKey.get(k)).filter(Boolean);

        upsert.run({
          tweet_id: t.id,
          text: t.text ?? "",
          author_username: authorById.get(t.author_id) ?? null,
          created_at: t.created_at ?? null,
          url: firstUrl ?? null,
          domain: getDomain(firstUrl),

          // ✅ 미디어/북마크순서
          media_json: JSON.stringify(medias),
          bookmark_rank: rank,

          // ✅ 폴더/원본
          folder_id: uncat?.id ?? null,
          raw_json: JSON.stringify(t),
        });

        totalSavedOrUpdated += 1;
        rank += 1;
      }
    })();

    pagination_token = json?.meta?.next_token;
    if (!pagination_token) break;
  }

  return NextResponse.json({
    ok: true,
    userId,
    fetched: totalFetched,
    savedOrUpdated: totalSavedOrUpdated,
  });
}
