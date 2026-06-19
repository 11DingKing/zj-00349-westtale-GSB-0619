import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "westtale-test-"));
const tmpDbPath = path.join(tmpDir, "test.db");
process.env.WESTTALE_DB_PATH = tmpDbPath;
process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT || "0";

const { getDb, closeDb } = await import("../../src/db/index.js");

const db = getDb();

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
`);

const { app } = await import("../../src/server.js");

let server;
let baseUrl;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

await startServer();

function resetData() {
  db.exec(`
    DELETE FROM visitor_progress;
    DELETE FROM views;
    DELETE FROM flowers;
    DELETE FROM comments;
    DELETE FROM chapter_figures;
    DELETE FROM chapter_artifacts;
    DELETE FROM chapters;
    DELETE FROM storylines;
    DELETE FROM artifacts;
    DELETE FROM figures;
    DELETE FROM sqlite_sequence;
  `);
}

function seedStoryline({ title = "测试故事线", status = "published" } = {}) {
  const result = db
    .prepare(
      `INSERT INTO storylines (title, description, cover_image, sort_order, status)
       VALUES (?, '', '', 0, ?)`,
    )
    .run(title, status);
  return result.lastInsertRowid;
}

function seedChapter({
  storylineId,
  title = "测试章节",
  status = "published",
  date = "1936-10-24",
  flowerCount = 0,
  commentCount = 0,
} = {}) {
  const sid = storylineId || seedStoryline();
  const result = db
    .prepare(
      `INSERT INTO chapters
        (storyline_id, title, date, content, images, video_url, sort_order, status, view_count, flower_count, comment_count)
       VALUES (?, ?, ?, '', '[]', '', 0, ?, 0, ?, ?)`,
    )
    .run(sid, title, date, status, flowerCount, commentCount);
  return result.lastInsertRowid;
}

function seedComment({
  chapterId,
  visitorName = "访客",
  content = "测试留言",
  status = "approved",
  likeCount = 0,
} = {}) {
  const result = db
    .prepare(
      `INSERT INTO comments (chapter_id, visitor_name, content, status, like_count)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(chapterId, visitorName, content, status, likeCount);
  return result.lastInsertRowid;
}

async function api(method, urlPath, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${baseUrl}${urlPath}`, opts);
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

function getBaseUrl() {
  return baseUrl;
}

function getRawDb() {
  return db;
}

async function shutdown() {
  await new Promise((resolve) => server.close(resolve));
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
}

process.on("exit", () => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
});

export {
  api,
  resetData,
  seedStoryline,
  seedChapter,
  seedComment,
  getBaseUrl,
  getRawDb,
  shutdown,
};
