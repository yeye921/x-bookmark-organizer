import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data.sqlite");
export const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tweet_id TEXT NOT NULL UNIQUE,
    text TEXT NOT NULL,
    author_username TEXT,
    created_at TEXT,
    url TEXT,
    domain TEXT,
    media_json TEXT,
    bookmark_rank INTEGER,
    folder_id INTEGER,
    raw_json TEXT,
    saved_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(folder_id) REFERENCES folders(id)
  );

  -- 기본 폴더 2개(전체/미분류는 UI에서 처리하지만, 미분류 폴더를 DB로도 둘 수 있음)
  INSERT OR IGNORE INTO folders(name) VALUES ('미분류');
`);
