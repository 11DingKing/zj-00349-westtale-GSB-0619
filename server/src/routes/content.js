import { Router } from "express";
import { getDb } from "../db/index.js";
import {
  jsonResponse,
  errorResponse,
  incrementViewCount,
} from "../utils/helpers.js";

const router = Router();
const db = getDb();

router.get("/artifacts", (req, res) => {
  try {
    const { page = 1, pageSize = 20, category } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = "";
    const params = [];

    if (category) {
      whereClause = "WHERE category = ?";
      params.push(category);
    }

    const total = db
      .prepare(`SELECT COUNT(*) as count FROM artifacts ${whereClause}`)
      .get(...params).count;

    const rows = db
      .prepare(
        `
      SELECT * FROM artifacts ${whereClause}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(...params, parseInt(pageSize), offset);

    jsonResponse(res, {
      list: rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/artifacts/:id", (req, res) => {
  try {
    const { id } = req.params;

    const row = db.prepare("SELECT * FROM artifacts WHERE id = ?").get(id);
    if (!row) {
      return errorResponse(res, "文物不存在", 404);
    }

    incrementViewCount("artifact", id);

    const relatedChapters = db
      .prepare(
        `
      SELECT c.id, c.title, c.date, s.title as storyline_title
      FROM chapters c
      INNER JOIN storylines s ON c.storyline_id = s.id
      INNER JOIN chapter_artifacts ca ON c.id = ca.chapter_id
      WHERE ca.artifact_id = ? AND c.status = 'published'
      ORDER BY c.date ASC
    `,
      )
      .all(id);

    jsonResponse(res, {
      ...row,
      relatedChapters,
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/figures", (req, res) => {
  try {
    const { page = 1, pageSize = 20, role } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = "";
    const params = [];

    if (role) {
      whereClause = "WHERE role LIKE ?";
      params.push(`%${role}%`);
    }

    const total = db
      .prepare(`SELECT COUNT(*) as count FROM figures ${whereClause}`)
      .get(...params).count;

    const rows = db
      .prepare(
        `
      SELECT * FROM figures ${whereClause}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(...params, parseInt(pageSize), offset);

    jsonResponse(res, {
      list: rows,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/figures/:id", (req, res) => {
  try {
    const { id } = req.params;

    const row = db.prepare("SELECT * FROM figures WHERE id = ?").get(id);
    if (!row) {
      return errorResponse(res, "人物不存在", 404);
    }

    incrementViewCount("figure", id);

    const relatedChapters = db
      .prepare(
        `
      SELECT c.id, c.title, c.date, c.content, s.title as storyline_title
      FROM chapters c
      INNER JOIN storylines s ON c.storyline_id = s.id
      INNER JOIN chapter_figures cf ON c.id = cf.chapter_id
      WHERE cf.figure_id = ? AND c.status = 'published'
      ORDER BY c.date ASC
    `,
      )
      .all(id);

    jsonResponse(res, {
      ...row,
      relatedChapters,
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/figures/:id/storyline", (req, res) => {
  try {
    const { id } = req.params;

    const figure = db.prepare("SELECT name FROM figures WHERE id = ?").get(id);
    if (!figure) {
      return errorResponse(res, "人物不存在", 404);
    }

    const chapters = db
      .prepare(
        `
      SELECT c.*, s.title as storyline_title
      FROM chapters c
      INNER JOIN storylines s ON c.storyline_id = s.id
      INNER JOIN chapter_figures cf ON c.id = cf.chapter_id
      WHERE cf.figure_id = ? AND c.status = 'published'
      ORDER BY c.date ASC
    `,
      )
      .all(id);

    const timeline = chapters.map((c) => ({
      chapterId: c.id,
      date: c.date,
      title: c.title,
      storyline_title: c.storyline_title,
      content: c.content ? c.content.substring(0, 200) : "",
    }));

    jsonResponse(res, {
      figureName: figure.name,
      timeline,
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/categories/artifacts", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT DISTINCT category as name, 
        (SELECT COUNT(*) FROM artifacts a2 WHERE a2.category = a1.category) as count
      FROM artifacts a1
      ORDER BY count DESC
    `,
      )
      .all();

    jsonResponse(res, rows);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

export default router;
