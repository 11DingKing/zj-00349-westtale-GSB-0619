import { Router } from "express";
import { getDb } from "../db/index.js";
import {
  jsonResponse,
  errorResponse,
  parseJsonField,
} from "../utils/helpers.js";

const router = Router();
const db = getDb();

router.get("/stats", (req, res) => {
  try {
    const totalStorylines = db
      .prepare("SELECT COUNT(*) as count FROM storylines")
      .get().count;
    const totalChapters = db
      .prepare("SELECT COUNT(*) as count FROM chapters")
      .get().count;
    const publishedChapters = db
      .prepare("SELECT COUNT(*) as count FROM chapters WHERE status = ?")
      .get("published").count;
    const totalArtifacts = db
      .prepare("SELECT COUNT(*) as count FROM artifacts")
      .get().count;
    const totalFigures = db
      .prepare("SELECT COUNT(*) as count FROM figures")
      .get().count;
    const totalViews =
      db.prepare("SELECT SUM(view_count) as count FROM chapters").get().count ||
      0;
    const totalFlowers =
      db.prepare("SELECT SUM(flower_count) as count FROM chapters").get()
        .count || 0;
    const totalComments = db
      .prepare("SELECT COUNT(*) as count FROM comments")
      .get().count;
    const pendingComments = db
      .prepare("SELECT COUNT(*) as count FROM comments WHERE status = ?")
      .get("pending").count;
    const approvedComments = db
      .prepare("SELECT COUNT(*) as count FROM comments WHERE status = ?")
      .get("approved").count;

    const topChapters = db
      .prepare(
        `
      SELECT c.id, c.title, c.date, c.view_count, c.flower_count, c.comment_count, s.title as storyline_title
      FROM chapters c
      INNER JOIN storylines s ON c.storyline_id = s.id
      WHERE c.status = 'published'
      ORDER BY c.view_count DESC
      LIMIT 10
    `,
      )
      .all();

    const topArtifacts = db
      .prepare(
        `
      SELECT id, name, view_count, category
      FROM artifacts
      ORDER BY view_count DESC
      LIMIT 10
    `,
      )
      .all();

    const topFigures = db
      .prepare(
        `
      SELECT id, name, view_count, role
      FROM figures
      ORDER BY view_count DESC
      LIMIT 10
    `,
      )
      .all();

    const chapterStats = db
      .prepare(
        `
      SELECT 
        s.id as storyline_id,
        s.title as storyline_title,
        COUNT(c.id) as chapter_count,
        SUM(c.view_count) as total_views,
        SUM(c.flower_count) as total_flowers,
        SUM(c.comment_count) as total_comments
      FROM storylines s
      LEFT JOIN chapters c ON s.id = c.storyline_id
      GROUP BY s.id
      ORDER BY total_views DESC
    `,
      )
      .all();

    const dailyViews = db
      .prepare(
        `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM views
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
      )
      .all();

    jsonResponse(res, {
      overview: {
        totalStorylines,
        totalChapters,
        publishedChapters,
        totalArtifacts,
        totalFigures,
        totalViews,
        totalFlowers,
        totalComments,
        pendingComments,
        approvedComments,
      },
      topChapters,
      topArtifacts,
      topFigures,
      chapterStats,
      dailyViews,
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/storylines", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT s.*, 
        (SELECT COUNT(*) FROM chapters c WHERE c.storyline_id = s.id) as chapter_count
      FROM storylines s
      ORDER BY s.sort_order ASC, s.created_at DESC
    `,
      )
      .all();

    jsonResponse(res, rows);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.post("/storylines", (req, res) => {
  try {
    const { title, description, coverImage, sortOrder, status } = req.body;

    if (!title) {
      return errorResponse(res, "标题不能为空", 400);
    }

    const stmt = db.prepare(`
      INSERT INTO storylines (title, description, cover_image, sort_order, status, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(
      title,
      description || "",
      coverImage || "",
      sortOrder || 0,
      status || "draft",
    );

    jsonResponse(res, { id: result.lastInsertRowid, message: "创建成功" }, 201);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.put("/storylines/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, coverImage, sortOrder, status } = req.body;

    const storyline = db
      .prepare("SELECT id FROM storylines WHERE id = ?")
      .get(id);
    if (!storyline) {
      return errorResponse(res, "故事线不存在", 404);
    }

    const stmt = db.prepare(`
      UPDATE storylines SET 
        title = ?, description = ?, cover_image = ?, sort_order = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      title,
      description || "",
      coverImage || "",
      sortOrder || 0,
      status || "draft",
      id,
    );

    jsonResponse(res, { message: "更新成功" });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.delete("/storylines/:id", (req, res) => {
  try {
    const { id } = req.params;

    db.exec("BEGIN TRANSACTION");
    db.prepare("DELETE FROM storylines WHERE id = ?").run(id);
    db.exec("COMMIT");

    jsonResponse(res, { message: "删除成功" });
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

router.get("/chapters", (req, res) => {
  try {
    const { storylineId, status } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (storylineId) {
      whereClause += " AND c.storyline_id = ?";
      params.push(storylineId);
    }

    if (status) {
      whereClause += " AND c.status = ?";
      params.push(status);
    }

    const rows = db
      .prepare(
        `
      SELECT c.*, s.title as storyline_title
      FROM chapters c
      INNER JOIN storylines s ON c.storyline_id = s.id
      ${whereClause}
      ORDER BY c.storyline_id ASC, c.sort_order ASC
    `,
      )
      .all(...params);

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

    const artifacts = db
      .prepare(
        `
      SELECT a.id, a.name
      FROM artifacts a
      INNER JOIN chapter_artifacts ca ON a.id = ca.artifact_id
      WHERE ca.chapter_id = ?
    `,
      )
      .all(id);

    const figures = db
      .prepare(
        `
      SELECT f.id, f.name
      FROM figures f
      INNER JOIN chapter_figures cf ON f.id = cf.figure_id
      WHERE cf.chapter_id = ?
    `,
      )
      .all(id);

    jsonResponse(res, {
      ...row,
      images: parseJsonField(row.images),
      artifacts: artifacts.map((a) => a.id),
      figures: figures.map((f) => f.id),
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.post("/chapters", (req, res) => {
  try {
    const {
      storylineId,
      title,
      date,
      content,
      images,
      videoUrl,
      sortOrder,
      status,
      artifacts = [],
      figures = [],
    } = req.body;

    if (!storylineId || !title || !date) {
      return errorResponse(res, "故事线ID、标题、日期不能为空", 400);
    }

    const storyline = db
      .prepare("SELECT id FROM storylines WHERE id = ?")
      .get(storylineId);
    if (!storyline) {
      return errorResponse(res, "故事线不存在", 404);
    }

    db.exec("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT INTO chapters (storyline_id, title, date, content, images, video_url, sort_order, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(
      storylineId,
      title,
      date,
      content || "",
      JSON.stringify(images || []),
      videoUrl || "",
      sortOrder || 0,
      status || "draft",
    );

    const chapterId = result.lastInsertRowid;

    const insertArtStmt = db.prepare(
      "INSERT OR IGNORE INTO chapter_artifacts (chapter_id, artifact_id) VALUES (?, ?)",
    );
    artifacts.forEach((artId) => insertArtStmt.run(chapterId, artId));

    const insertFigStmt = db.prepare(
      "INSERT OR IGNORE INTO chapter_figures (chapter_id, figure_id) VALUES (?, ?)",
    );
    figures.forEach((figId) => insertFigStmt.run(chapterId, figId));

    db.exec("COMMIT");

    jsonResponse(res, { id: chapterId, message: "创建成功" }, 201);
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

router.put("/chapters/:id", (req, res) => {
  try {
    const { id } = req.params;
    const {
      storylineId,
      title,
      date,
      content,
      images,
      videoUrl,
      sortOrder,
      status,
      artifacts = [],
      figures = [],
    } = req.body;

    const chapter = db.prepare("SELECT id FROM chapters WHERE id = ?").get(id);
    if (!chapter) {
      return errorResponse(res, "章节不存在", 404);
    }

    db.exec("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      UPDATE chapters SET 
        storyline_id = ?, title = ?, date = ?, content = ?, images = ?, video_url = ?,
        sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      storylineId,
      title,
      date,
      content || "",
      JSON.stringify(images || []),
      videoUrl || "",
      sortOrder || 0,
      status || "draft",
      id,
    );

    db.prepare("DELETE FROM chapter_artifacts WHERE chapter_id = ?").run(id);
    const insertArtStmt = db.prepare(
      "INSERT OR IGNORE INTO chapter_artifacts (chapter_id, artifact_id) VALUES (?, ?)",
    );
    artifacts.forEach((artId) => insertArtStmt.run(id, artId));

    db.prepare("DELETE FROM chapter_figures WHERE chapter_id = ?").run(id);
    const insertFigStmt = db.prepare(
      "INSERT OR IGNORE INTO chapter_figures (chapter_id, figure_id) VALUES (?, ?)",
    );
    figures.forEach((figId) => insertFigStmt.run(id, figId));

    db.exec("COMMIT");

    jsonResponse(res, { message: "更新成功" });
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

router.patch("/chapters/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["draft", "published", "archived"].includes(status)) {
      return errorResponse(res, "无效的状态值", 400);
    }

    const chapter = db.prepare("SELECT id FROM chapters WHERE id = ?").get(id);
    if (!chapter) {
      return errorResponse(res, "章节不存在", 404);
    }

    db.prepare(
      "UPDATE chapters SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(status, id);

    jsonResponse(res, { message: "状态更新成功", status });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.delete("/chapters/:id", (req, res) => {
  try {
    const { id } = req.params;

    db.exec("BEGIN TRANSACTION");
    db.prepare("DELETE FROM chapters WHERE id = ?").run(id);
    db.exec("COMMIT");

    jsonResponse(res, { message: "删除成功" });
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

router.get("/comments", (req, res) => {
  try {
    const { status, chapterId, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status) {
      whereClause += " AND c.status = ?";
      params.push(status);
    }

    if (chapterId) {
      whereClause += " AND c.chapter_id = ?";
      params.push(chapterId);
    }

    const total = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM comments c ${whereClause}
    `,
      )
      .get(...params).count;

    const rows = db
      .prepare(
        `
      SELECT c.*, ch.title as chapter_title
      FROM comments c
      INNER JOIN chapters ch ON c.chapter_id = ch.id
      ${whereClause}
      ORDER BY c.created_at DESC
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

router.patch("/comments/:id/approve", (req, res) => {
  try {
    const { id } = req.params;

    const comment = db
      .prepare("SELECT id, status FROM comments WHERE id = ?")
      .get(id);
    if (!comment) {
      return errorResponse(res, "留言不存在", 404);
    }

    db.prepare("UPDATE comments SET status = 'approved' WHERE id = ?").run(id);

    jsonResponse(res, { message: "审核通过" });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.patch("/comments/:id/reject", (req, res) => {
  try {
    const { id } = req.params;

    const comment = db
      .prepare("SELECT id, status FROM comments WHERE id = ?")
      .get(id);
    if (!comment) {
      return errorResponse(res, "留言不存在", 404);
    }

    db.prepare("UPDATE comments SET status = 'rejected' WHERE id = ?").run(id);

    jsonResponse(res, { message: "已拒绝" });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.delete("/comments/:id", (req, res) => {
  try {
    const { id } = req.params;

    db.prepare("DELETE FROM comments WHERE id = ?").run(id);

    jsonResponse(res, { message: "删除成功" });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.get("/artifacts", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM artifacts ORDER BY created_at DESC")
      .all();
    jsonResponse(res, rows);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.post("/artifacts", (req, res) => {
  try {
    const { name, description, image, category, era } = req.body;

    if (!name) {
      return errorResponse(res, "名称不能为空", 400);
    }

    const stmt = db.prepare(`
      INSERT INTO artifacts (name, description, image, category, era, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(
      name,
      description || "",
      image || "",
      category || "",
      era || "",
    );

    jsonResponse(res, { id: result.lastInsertRowid, message: "创建成功" }, 201);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.put("/artifacts/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, category, era } = req.body;

    const artifact = db
      .prepare("SELECT id FROM artifacts WHERE id = ?")
      .get(id);
    if (!artifact) {
      return errorResponse(res, "文物不存在", 404);
    }

    const stmt = db.prepare(`
      UPDATE artifacts SET 
        name = ?, description = ?, image = ?, category = ?, era = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      name,
      description || "",
      image || "",
      category || "",
      era || "",
      id,
    );

    jsonResponse(res, { message: "更新成功" });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.delete("/artifacts/:id", (req, res) => {
  try {
    const { id } = req.params;

    db.exec("BEGIN TRANSACTION");
    db.prepare("DELETE FROM artifacts WHERE id = ?").run(id);
    db.exec("COMMIT");

    jsonResponse(res, { message: "删除成功" });
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

router.get("/figures", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM figures ORDER BY created_at DESC")
      .all();
    jsonResponse(res, rows);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.post("/figures", (req, res) => {
  try {
    const { name, birthDate, deathDate, description, portrait, role } =
      req.body;

    if (!name) {
      return errorResponse(res, "名称不能为空", 400);
    }

    const stmt = db.prepare(`
      INSERT INTO figures (name, birth_date, death_date, description, portrait, role, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(
      name,
      birthDate || "",
      deathDate || "",
      description || "",
      portrait || "",
      role || "",
    );

    jsonResponse(res, { id: result.lastInsertRowid, message: "创建成功" }, 201);
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.put("/figures/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, birthDate, deathDate, description, portrait, role } =
      req.body;

    const figure = db.prepare("SELECT id FROM figures WHERE id = ?").get(id);
    if (!figure) {
      return errorResponse(res, "人物不存在", 404);
    }

    const stmt = db.prepare(`
      UPDATE figures SET 
        name = ?, birth_date = ?, death_date = ?, description = ?, portrait = ?, role = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      name,
      birthDate || "",
      deathDate || "",
      description || "",
      portrait || "",
      role || "",
      id,
    );

    jsonResponse(res, { message: "更新成功" });
  } catch (err) {
    errorResponse(res, err.message);
  }
});

router.delete("/figures/:id", (req, res) => {
  try {
    const { id } = req.params;

    db.exec("BEGIN TRANSACTION");
    db.prepare("DELETE FROM figures WHERE id = ?").run(id);
    db.exec("COMMIT");

    jsonResponse(res, { message: "删除成功" });
  } catch (err) {
    db.exec("ROLLBACK");
    errorResponse(res, err.message);
  }
});

export default router;
