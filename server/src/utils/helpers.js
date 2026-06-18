import { getDb } from "../db/index.js";

export function jsonResponse(res, data, status = 200) {
  res.status(status).json({
    code: 0,
    message: "success",
    data,
  });
}

export function errorResponse(res, message, status = 500) {
  res.status(status).json({
    code: 1,
    message,
    data: null,
  });
}

export function parseJsonField(value) {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch (e) {
    return [];
  }
}

export function generateVisitorId() {
  return (
    "visitor_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  );
}

export function incrementViewCount(targetType, targetId) {
  const db = getDb();

  db.exec("BEGIN TRANSACTION");

  try {
    const stmt = db.prepare(
      "INSERT INTO views (target_type, target_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    );
    stmt.run(targetType, targetId);

    if (targetType === "chapter") {
      db.prepare(
        "UPDATE chapters SET view_count = view_count + 1 WHERE id = ?",
      ).run(targetId);
    } else if (targetType === "artifact") {
      db.prepare(
        "UPDATE artifacts SET view_count = view_count + 1 WHERE id = ?",
      ).run(targetId);
    } else if (targetType === "figure") {
      db.prepare(
        "UPDATE figures SET view_count = view_count + 1 WHERE id = ?",
      ).run(targetId);
    }

    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
