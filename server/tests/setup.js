import Database from "better-sqlite3";
import { resetDb, setDb } from "../src/db/index.js";

export function createTestDb() {
  const db = new Database(":memory:");

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS storylines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storyline_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      content TEXT,
      images TEXT,
      video_url TEXT,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      view_count INTEGER DEFAULT 0,
      flower_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (storyline_id) REFERENCES storylines(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      category TEXT,
      era TEXT,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS figures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birth_date TEXT,
      death_date TEXT,
      description TEXT,
      portrait TEXT,
      role TEXT,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapter_artifacts (
      chapter_id INTEGER NOT NULL,
      artifact_id INTEGER NOT NULL,
      PRIMARY KEY (chapter_id, artifact_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapter_figures (
      chapter_id INTEGER NOT NULL,
      figure_id INTEGER NOT NULL,
      PRIMARY KEY (chapter_id, figure_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      FOREIGN KEY (figure_id) REFERENCES figures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL,
      visitor_name TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      like_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flowers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL,
      visitor_name TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      visitor_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visitor_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL,
      chapter_id INTEGER NOT NULL,
      watched INTEGER DEFAULT 0,
      last_position INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(visitor_id, chapter_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chapters_storyline ON chapters(storyline_id);
    CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);
    CREATE INDEX IF NOT EXISTS idx_comments_chapter ON comments(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
    CREATE INDEX IF NOT EXISTS idx_flowers_chapter ON flowers(chapter_id);
    CREATE INDEX IF NOT EXISTS idx_views_target ON views(target_type, target_id);
  `);

  return db;
}

export function seedTestData(db) {
  const insertStoryline = db.prepare(`
    INSERT INTO storylines (title, description, cover_image, sort_order, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const storylineResult = insertStoryline.run(
    "测试故事线",
    "测试用故事线描述",
    "",
    1,
    "published",
  );
  const storylineId = storylineResult.lastInsertRowid;

  const insertChapter = db.prepare(`
    INSERT INTO chapters (storyline_id, title, date, content, images, video_url, sort_order, status, view_count, flower_count, comment_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const publishedChapterResult = insertChapter.run(
    storylineId,
    "已发布测试章节",
    "2026-01-01",
    "测试内容",
    "[]",
    "",
    1,
    "published",
    0,
    0,
    0,
  );
  const publishedChapterId = publishedChapterResult.lastInsertRowid;

  const draftChapterResult = insertChapter.run(
    storylineId,
    "草稿测试章节",
    "2026-01-02",
    "草稿内容",
    "[]",
    "",
    2,
    "draft",
    0,
    0,
    0,
  );
  const draftChapterId = draftChapterResult.lastInsertRowid;

  return {
    storylineId,
    publishedChapterId,
    draftChapterId,
  };
}

export function setupTestApp() {
  resetDb();
  const db = createTestDb();
  setDb(db);
  const testData = seedTestData(db);
  return { db, testData };
}
