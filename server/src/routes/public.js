import { Router } from "express";
import { getDb } from "../db/index.js";
import {
  jsonResponse,
  errorResponse,
  parseJsonField,
  incrementViewCount,
} from "../utils/helpers.js";

const router = Router();

router.get("/storylines", (req, res) => {
  const db = getDb();
  try {
    const status = req.query.status || "published";
    const rows = db
      .prepare(
        `
      SELECT s.*, 
        (SELECT COUNT(*) FROM chapters c WHERE c.storyline_id = s.id AND c.status = 'published') as chapter_count,
        (SELECT SUM(view_count) FROM chapters c WHERE c.storyline_id = s.id) as total_views
      FROM storylines s
      WHERE s.status = ?
      ORDER BY s.sort_order ASC, s.created_at DESC
    `,
      )
      .all(status);

    jsonResponse(res, rows);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/storylines/:id", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const row = db
      .prepare(
        `
      SELECT s.*, 
        (SELECT COUNT(*) FROM chapters c WHERE c.storyline_id = s.id AND c.status = 'published') as chapter_count,
        (SELECT SUM(view_count) FROM chapters c WHERE c.storyline_id = s.id) as total_views
      FROM storylines s WHERE s.id = ?
    `,
      )
      .get(id);

    if (!row) {
      return errorResponse(res, "故事线不存在", 404);
    }

    jsonResponse(res, row);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/storylines/:id/chapters", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const status = req.query.status || "published";

    const rows = db
      .prepare(
        `
      SELECT c.*
      FROM chapters c
      WHERE c.storyline_id = ? AND c.status = ?
      ORDER BY c.sort_order ASC, c.date ASC
    `,
      )
      .all(id, status);

    const chapters = rows.map((row) => ({
      ...row,
      images: parseJsonField(row.images),
    }));

    jsonResponse(res, chapters);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/chapters/:id", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;

    const row = db
      .prepare(
        `
      SELECT c.*, s.title as storyline_title
      FROM chapters c
      LEFT JOIN storylines s ON c.storyline_id = s.id
      WHERE c.id = ?
    `,
      )
      .get(id);

    if (!row) {
      return errorResponse(res, "章节不存在", 404);
    }

    if (row.status !== "published") {
      return errorResponse(res, "章节未发布", 403);
    }

    incrementViewCount("chapter", id);

    const artifacts = db
      .prepare(
        `
      SELECT a.*
      FROM artifacts a
      INNER JOIN chapter_artifacts ca ON a.id = ca.artifact_id
      WHERE ca.chapter_id = ?
    `,
      )
      .all(id);

    const figures = db
      .prepare(
        `
      SELECT f.*
      FROM figures f
      INNER JOIN chapter_figures cf ON f.id = cf.figure_id
      WHERE cf.chapter_id = ?
    `,
      )
      .all(id);

    const prevChapter = db
      .prepare(
        `
      SELECT id, title FROM chapters 
      WHERE storyline_id = ? AND sort_order < ? AND status = 'published'
      ORDER BY sort_order DESC LIMIT 1
    `,
      )
      .get(row.storyline_id, row.sort_order);

    const nextChapter = db
      .prepare(
        `
      SELECT id, title FROM chapters 
      WHERE storyline_id = ? AND sort_order > ? AND status = 'published'
      ORDER BY sort_order ASC LIMIT 1
    `,
      )
      .get(row.storyline_id, row.sort_order);

    jsonResponse(res, {
      ...row,
      images: parseJsonField(row.images),
      artifacts,
      figures,
      prevChapter,
      nextChapter,
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

export default router;
