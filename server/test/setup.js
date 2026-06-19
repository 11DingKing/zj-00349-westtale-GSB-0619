import Database from "better-sqlite3";

export function createTestDb() {
  const db = new Database(":memory:");
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
  `);

  global.__testDb = db;
  return db;
}

export function closeTestDb(db) {
  if (db) {
    db.close();
  }
  global.__testDb = null;
}
