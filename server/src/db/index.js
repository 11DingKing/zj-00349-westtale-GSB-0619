import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export function getDb(customDbPath) {
  if (!db) {
    const resolvedPath = customDbPath || path.join(__dirname, "../../data/westtale.db");
    db = new Database(resolvedPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function setDb(database) {
  db = database;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
