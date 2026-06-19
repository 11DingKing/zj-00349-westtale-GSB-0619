import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import { createTestDb, closeTestDb } from "./setup.js";

describe("核心交互接口测试", function () {
  let db;
  let publishedChapterId;
  let draftChapterId;
  let pendingCommentId;
  let approvedCommentId;

  before(function () {
    db = createTestDb();

    const insertStoryline = db.prepare(`
      INSERT INTO storylines (title, description, sort_order, status)
      VALUES (?, ?, ?, ?)
    `);
    const storylineResult = insertStoryline.run(
      "测试故事线",
      "测试描述",
      1,
      "published"
    );
    const storylineId = storylineResult.lastInsertRowid;

    const insertChapter = db.prepare(`
      INSERT INTO chapters (storyline_id, title, date, content, status, view_count, flower_count, comment_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const publishedResult = insertChapter.run(
      storylineId,
      "已发布章节",
      "1936-10-24",
      "测试内容",
      "published",
      0,
      0,
      0
    );
    publishedChapterId = publishedResult.lastInsertRowid;

    const draftResult = insertChapter.run(
      storylineId,
      "草稿章节",
      "1936-11-01",
      "草稿内容",
      "draft",
      0,
      0,
      0
    );
    draftChapterId = draftResult.lastInsertRowid;

    const insertComment = db.prepare(`
      INSERT INTO comments (chapter_id, visitor_name, content, status, like_count)
      VALUES (?, ?, ?, ?, ?)
    `);
    const pendingResult = insertComment.run(
      publishedChapterId,
      "测试用户",
      "待审核留言",
      "pending",
      0
    );
    pendingCommentId = pendingResult.lastInsertRowid;

    const approvedResult = insertComment.run(
      publishedChapterId,
      "测试用户2",
      "已通过留言",
      "approved",
      5
    );
    approvedCommentId = approvedResult.lastInsertRowid;
  });

  after(function () {
    closeTestDb(db);
  });

  describe("留言提交测试", function () {
    it("提交留言应该是 pending 待审核状态", async function () {
      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({
          visitorName: "访客张三",
          content: "这是一条测试留言",
        });

      expect(res.status).to.equal(201);
      expect(res.body.code).to.equal(0);
      expect(res.body.data.success).to.be.true;
      expect(res.body.data.message).to.include("等待审核");

      const comment = db
        .prepare("SELECT * FROM comments WHERE visitor_name = ? AND content = ?")
        .get("访客张三", "这是一条测试留言");

      expect(comment).to.not.be.undefined;
      expect(comment.status).to.equal("pending");
      expect(comment.chapter_id).to.equal(publishedChapterId);
    });

    it("提交留言时访客名称和内容不能为空", async function () {
      const res1 = await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({ visitorName: "", content: "内容" });

      expect(res1.status).to.equal(400);
      expect(res1.body.code).to.equal(1);

      const res2 = await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({ visitorName: "用户", content: "" });

      expect(res2.status).to.equal(400);
      expect(res2.body.code).to.equal(1);
    });

    it("留言内容不能超过500字", async function () {
      const longContent = "a".repeat(501);
      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({
          visitorName: "用户",
          content: longContent,
        });

      expect(res.status).to.equal(400);
      expect(res.body.code).to.equal(1);
    });

    it("提交留言后 comment_count 应该增加", async function () {
      const before = db
        .prepare("SELECT comment_count FROM chapters WHERE id = ?")
        .get(publishedChapterId).comment_count;

      await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({
          visitorName: "计数测试用户",
          content: "测试计数",
        });

      const after = db
        .prepare("SELECT comment_count FROM chapters WHERE id = ?")
        .get(publishedChapterId).comment_count;

      expect(after).to.equal(before + 1);
    });
  });

  describe("留言可见性和点赞测试", function () {
    it("只有审核通过(approved)的留言才会出现在列表中", async function () {
      const res = await request(app).get(
        `/api/chapters/${publishedChapterId}/comments`
      );

      expect(res.status).to.equal(200);
      expect(res.body.code).to.equal(0);
      expect(res.body.data.list).to.be.an("array");

      const commentIds = res.body.data.list.map((c) => c.id);
      expect(commentIds).to.include(approvedCommentId);
      expect(commentIds).to.not.include(pendingCommentId);

      const allPending = res.body.data.list.every((c) => c.status === "approved");
      expect(allPending).to.be.true;
    });

    it("未审核通过的留言不能点赞", async function () {
      const res = await request(app).post(
        `/api/comments/${pendingCommentId}/like`
      );

      expect(res.status).to.equal(404);
      expect(res.body.code).to.equal(1);
      expect(res.body.message).to.include("未审核通过");
    });

    it("审核通过的留言可以点赞", async function () {
      const before = db
        .prepare("SELECT like_count FROM comments WHERE id = ?")
        .get(approvedCommentId).like_count;

      const res = await request(app).post(
        `/api/comments/${approvedCommentId}/like`
      );

      expect(res.status).to.equal(200);
      expect(res.body.code).to.equal(0);
      expect(res.body.data.like_count).to.equal(before + 1);

      const after = db
        .prepare("SELECT like_count FROM comments WHERE id = ?")
        .get(approvedCommentId).like_count;
      expect(after).to.equal(before + 1);
    });
  });

  describe("管理员审核留言测试", function () {
    it("管理员可以审核通过留言", async function () {
      const res = await request(app).patch(
        `/api/admin/comments/${pendingCommentId}/approve`
      );

      expect(res.status).to.equal(200);
      expect(res.body.code).to.equal(0);

      const comment = db
        .prepare("SELECT status FROM comments WHERE id = ?")
        .get(pendingCommentId);
      expect(comment.status).to.equal("approved");
    });

    it("审核通过后留言会出现在公开列表中", async function () {
      const res = await request(app).get(
        `/api/chapters/${publishedChapterId}/comments`
      );

      const commentIds = res.body.data.list.map((c) => c.id);
      expect(commentIds).to.include(pendingCommentId);
    });
  });

  describe("献花计数测试", function () {
    it("献花成功并增加 flower_count", async function () {
      const before = db
        .prepare("SELECT flower_count FROM chapters WHERE id = ?")
        .get(publishedChapterId).flower_count;

      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/flowers`)
        .send({
          visitorName: "献花用户",
          message: "向先烈致敬",
        });

      expect(res.status).to.equal(201);
      expect(res.body.code).to.equal(0);
      expect(res.body.data.message).to.equal("献花成功");
      expect(res.body.data.flowerCount).to.equal(before + 1);

      const after = db
        .prepare("SELECT flower_count FROM chapters WHERE id = ?")
        .get(publishedChapterId).flower_count;
      expect(after).to.equal(before + 1);

      const flower = db
        .prepare(
          "SELECT * FROM flowers WHERE chapter_id = ? AND visitor_name = ?"
        )
        .get(publishedChapterId, "献花用户");
      expect(flower).to.not.be.undefined;
      expect(flower.message).to.equal("向先烈致敬");
    });

    it("献花寄语不能超过100字", async function () {
      const longMessage = "b".repeat(101);
      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/flowers`)
        .send({
          visitorName: "用户",
          message: longMessage,
        });

      expect(res.status).to.equal(400);
      expect(res.body.code).to.equal(1);
    });

    it("献花列表可以正常获取", async function () {
      const res = await request(app).get(
        `/api/chapters/${publishedChapterId}/flowers`
      );

      expect(res.status).to.equal(200);
      expect(res.body.code).to.equal(0);
      expect(res.body.data.list).to.be.an("array");
    });
  });

  describe("访客观看进度 upsert 测试", function () {
    const visitorId = "test_visitor_001";

    it("首次保存进度应该创建记录", async function () {
      const res = await request(app).post("/api/progress").send({
        visitorId: visitorId,
        chapterId: publishedChapterId,
        watched: false,
        lastPosition: 120,
      });

      expect(res.status).to.equal(200);
      expect(res.body.code).to.equal(0);
      expect(res.body.data.visitorId).to.equal(visitorId);

      const progress = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(visitorId, publishedChapterId);
      expect(progress).to.not.be.undefined;
      expect(progress.watched).to.equal(0);
      expect(progress.last_position).to.equal(120);
    });

    it("重复保存相同 visitor 和 chapter 应该更新而不是创建", async function () {
      const beforeCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(visitorId, publishedChapterId).count;
      expect(beforeCount).to.equal(1);

      const res = await request(app).post("/api/progress").send({
        visitorId: visitorId,
        chapterId: publishedChapterId,
        watched: true,
        lastPosition: 500,
      });

      expect(res.status).to.equal(200);

      const afterCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(visitorId, publishedChapterId).count;
      expect(afterCount).to.equal(1);

      const updated = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(visitorId, publishedChapterId);
      expect(updated.watched).to.equal(1);
      expect(updated.last_position).to.equal(500);
    });

    it("没有 visitorId 时会自动生成", async function () {
      const res = await request(app).post("/api/progress").send({
        chapterId: publishedChapterId,
        watched: true,
      });

      expect(res.status).to.equal(200);
      expect(res.body.data.visitorId).to.be.a("string");
      expect(res.body.data.visitorId).to.include("visitor_");
    });

    it("进度列表可以正常获取", async function () {
      const res = await request(app).get(
        `/api/progress?visitorId=${visitorId}`
      );

      expect(res.status).to.equal(200);
      expect(res.body.code).to.equal(0);
      expect(res.body.data).to.be.an("array");
    });

    it("mark-watched 接口可以标记章节为已看", async function () {
      const newVisitorId = "mark_watched_visitor";
      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/mark-watched`)
        .send({ visitorId: newVisitorId });

      expect(res.status).to.equal(200);
      expect(res.body.data.watched).to.be.true;

      const progress = db
        .prepare(
          "SELECT watched FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(newVisitorId, publishedChapterId);
      expect(progress.watched).to.equal(1);
    });
  });

  describe("章节未发布时的校验测试", function () {
    it("章节是 draft 状态时不能留言", async function () {
      const res = await request(app)
        .post(`/api/chapters/${draftChapterId}/comments`)
        .send({
          visitorName: "用户",
          content: "测试留言",
        });

      expect(res.status).to.equal(404);
      expect(res.body.code).to.equal(1);
      expect(res.body.message).to.include("未发布");
    });

    it("章节不存在时不能留言", async function () {
      const res = await request(app)
        .post(`/api/chapters/99999/comments`)
        .send({
          visitorName: "用户",
          content: "测试留言",
        });

      expect(res.status).to.equal(404);
      expect(res.body.code).to.equal(1);
    });

    it("章节是 draft 状态时不能献花", async function () {
      const res = await request(app)
        .post(`/api/chapters/${draftChapterId}/flowers`)
        .send({
          visitorName: "用户",
          message: "献花",
        });

      expect(res.status).to.equal(404);
      expect(res.body.code).to.equal(1);
      expect(res.body.message).to.include("未发布");
    });

    it("章节不存在时不能献花", async function () {
      const res = await request(app)
        .post(`/api/chapters/99999/flowers`)
        .send({
          visitorName: "用户",
          message: "献花",
        });

      expect(res.status).to.equal(404);
      expect(res.body.code).to.equal(1);
    });
  });
});
