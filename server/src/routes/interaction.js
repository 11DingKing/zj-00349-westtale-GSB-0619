import { Router } from "express";
import { getDb } from "../db/index.js";
import {
  jsonResponse,
  errorResponse,
  generateVisitorId,
} from "../utils/helpers.js";

const router = Router();

router.get("/chapters/:id/comments", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM comments 
      WHERE chapter_id = ? AND status = 'approved'
    `,
      )
      .get(id).count;

    const rows = db
      .prepare(
        `
      SELECT * FROM comments 
      WHERE chapter_id = ? AND status = 'approved'
      ORDER BY like_count DESC, created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(id, parseInt(pageSize), offset);

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

router.post("/chapters/:id/comments", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { visitorName, content } = req.body;

    if (!visitorName || !content) {
      return errorResponse(res, "访客名称和留言内容不能为空", 400);
    }

    if (content.length > 500) {
      return errorResponse(res, "留言内容不能超过500字", 400);
    }

    const chapter = db
      .prepare("SELECT id, status FROM chapters WHERE id = ?")
      .get(id);
    if (!chapter || chapter.status !== "published") {
      return errorResponse(res, "章节不存在或未发布", 404);
    }

    db.exec("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT INTO comments (chapter_id, visitor_name, content, status, created_at)
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `);
    stmt.run(id, visitorName, content);

    db.prepare(
      "UPDATE chapters SET comment_count = comment_count + 1 WHERE id = ?",
    ).run(id);

    db.exec("COMMIT");

    jsonResponse(
      res,
      {
        message: "留言提交成功，等待审核",
        success: true,
      },
      201,
    );
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

router.post("/comments/:id/like", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;

    const comment = db
      .prepare("SELECT id, status FROM comments WHERE id = ?")
      .get(id);
    if (!comment || comment.status !== "approved") {
      return errorResponse(res, "留言不存在或未审核通过", 404);
    }

    db.prepare(
      "UPDATE comments SET like_count = like_count + 1 WHERE id = ?",
    ).run(id);

    const updated = db
      .prepare("SELECT like_count FROM comments WHERE id = ?")
      .get(id);

    jsonResponse(res, updated);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/chapters/:id/flowers", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const total = db
      .prepare("SELECT COUNT(*) as count FROM flowers WHERE chapter_id = ?")
      .get(id).count;

    const rows = db
      .prepare(
        `
      SELECT * FROM flowers 
      WHERE chapter_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(id, parseInt(pageSize), offset);

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

router.post("/chapters/:id/flowers", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { visitorName = "匿名用户", message = "" } = req.body;

    const chapter = db
      .prepare("SELECT id, status FROM chapters WHERE id = ?")
      .get(id);
    if (!chapter || chapter.status !== "published") {
      return errorResponse(res, "章节不存在或未发布", 404);
    }

    if (message.length > 100) {
      return errorResponse(res, "献花寄语不能超过100字", 400);
    }

    db.exec("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT INTO flowers (chapter_id, visitor_name, message, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(id, visitorName, message);

    db.prepare(
      "UPDATE chapters SET flower_count = flower_count + 1 WHERE id = ?",
    ).run(id);

    db.exec("COMMIT");

    const count = db
      .prepare("SELECT flower_count FROM chapters WHERE id = ?")
      .get(id);

    jsonResponse(
      res,
      {
        message: "献花成功",
        flowerCount: count.flower_count,
      },
      201,
    );
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

router.get("/progress", (req, res) => {
  const db = getDb();
  try {
    const { visitorId } = req.query;

    if (!visitorId) {
      return jsonResponse(res, []);
    }

    const rows = db
      .prepare(
        `
      SELECT vp.chapter_id, vp.watched, vp.last_position, c.title, c.storyline_id, s.title as storyline_title
      FROM visitor_progress vp
      INNER JOIN chapters c ON vp.chapter_id = c.id
      INNER JOIN storylines s ON c.storyline_id = s.id
      WHERE vp.visitor_id = ?
      ORDER BY vp.updated_at DESC
    `,
      )
      .all(visitorId);

    jsonResponse(res, rows);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.post("/progress", (req, res) => {
  const db = getDb();
  try {
    let { visitorId, chapterId, watched, lastPosition } = req.body;

    if (!visitorId) {
      visitorId = generateVisitorId();
    }

    if (!chapterId) {
      return errorResponse(res, "章节ID不能为空", 400);
    }

    const chapter = db
      .prepare("SELECT id FROM chapters WHERE id = ?")
      .get(chapterId);
    if (!chapter) {
      return errorResponse(res, "章节不存在", 404);
    }

    const stmt = db.prepare(`
      INSERT INTO visitor_progress (visitor_id, chapter_id, watched, last_position, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(visitor_id, chapter_id) DO UPDATE SET
        watched = excluded.watched,
        last_position = excluded.last_position,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(visitorId, chapterId, watched ? 1 : 0, lastPosition || 0);

    jsonResponse(res, {
      visitorId,
      message: "进度保存成功",
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.post("/chapters/:id/mark-watched", (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    let { visitorId } = req.body;

    if (!visitorId) {
      visitorId = generateVisitorId();
    }

    const chapter = db.prepare("SELECT id FROM chapters WHERE id = ?").get(id);
    if (!chapter) {
      return errorResponse(res, "章节不存在", 404);
    }

    const stmt = db.prepare(`
      INSERT INTO visitor_progress (visitor_id, chapter_id, watched, updated_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(visitor_id, chapter_id) DO UPDATE SET
        watched = 1,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(visitorId, id);

    jsonResponse(res, {
      visitorId,
      watched: true,
      message: "已标记为看过",
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

export default router;
