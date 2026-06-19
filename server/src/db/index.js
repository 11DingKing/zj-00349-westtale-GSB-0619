import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;
let dbPath;

export function getDb(customPath) {
  if (!db) {
    if (customPath) {
      dbPath = customPath;
    } else if (process.env.DB_PATH) {
      dbPath = process.env.DB_PATH;
    } else {
      dbPath = path.join(__dirname, "../../data/westtale.db");
    }
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function setDb(customDb) {
  db = customDb;
  return db;
}

export function resetDb() {
  if (db) {
    db.close();
    db = null;
    dbPath = null;
  }
}

export function getDbPath() {
  return dbPath;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
