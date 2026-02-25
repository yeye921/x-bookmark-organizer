import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // 현재 요청 URL에서 query parameter 추출
  const { searchParams } = new URL(req.url);

  // folderId: 특정 폴더 필터 (null 또는 "all"이면 전체)
  const folderId = searchParams.get("folderId");

  // q: 검색어 (없으면 빈 문자열)
  const q = (searchParams.get("q") ?? "").trim();

  // 기본 SELECT 구문
  // bookmarks 테이블 + folders 테이블 LEFT JOIN
  // media_json, bookmark_rank 포함
  let sql = `
    SELECT 
      b.id,
      b.tweet_id,
      b.text,
      b.author_username,
      b.created_at,
      b.url,
      b.domain,
      b.media_json,
      b.bookmark_rank,
      b.folder_id,
      f.name as folder_name
    FROM bookmarks b
    LEFT JOIN folders f ON f.id = b.folder_id
  `;

  // SQL 바인딩 파라미터 배열
  const params: any[] = [];

  // WHERE 조건을 동적으로 모으기 위한 배열
  const where: string[] = [];

  // 🔹 1) 폴더 필터 조건
  if (folderId && folderId !== "all") {
    where.push("b.folder_id = ?");
    params.push(Number(folderId));
  }

  // 🔹 2) 검색어 조건
  if (q) {
    where.push(
      "(b.text LIKE ? OR b.author_username LIKE ? OR b.domain LIKE ?)",
    );
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  // 조건이 하나라도 있다면 WHERE 절 추가
  if (where.length) {
    sql += " WHERE " + where.join(" AND ");
  }

  /**
   * 🔥 정렬 기준
   *
   * bookmark_rank는 동기화 시
   * 1 = 가장 최근에 북마크한 트윗
   * 2 = 그 다음
   * ...
   *
   * 따라서 오름차순(ASC) 정렬하면
   * 최신 북마크가 위로 온다.
   *
   * LIMIT 300으로 과도한 조회 방지
   */
  sql += " ORDER BY b.bookmark_rank ASC LIMIT 300";

  // SQL 실행
  const rows = db.prepare(sql).all(...params);

  // 클라이언트로 JSON 반환
  return NextResponse.json({ items: rows });
}
