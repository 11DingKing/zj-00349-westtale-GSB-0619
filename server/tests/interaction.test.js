import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { setupTestApp, teardownTestDb } from "./setup.js";

describe("互动接口测试", () => {
  let app;
  let db;
  let testData;

  beforeEach(() => {
    const setup = setupTestApp();
    app = setup.app;
    db = setup.db;
    testData = setup.testData;
  });

  afterEach(() => {
    teardownTestDb(db);
  });

  describe("留言功能", () => {
    it("提交留言后状态应为pending待审核", async () => {
      const res = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/comments`)
        .send({
          visitorName: "测试用户",
          content: "这是一条测试留言",
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data.success).toBe(true);

      const comment = db
        .prepare("SELECT * FROM comments WHERE visitor_name = ?")
        .get("测试用户");
      expect(comment).toBeTruthy();
      expect(comment.status).toBe("pending");
      expect(comment.content).toBe("这是一条测试留言");

      const chapter = db
        .prepare("SELECT comment_count FROM chapters WHERE id = ?")
        .get(testData.publishedChapterId);
      expect(chapter.comment_count).toBe(1);
    });

    it("留言提交时访客名称和内容不能为空", async () => {
      const res1 = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/comments`)
        .send({
          visitorName: "",
          content: "内容",
        });
      expect(res1.status).toBe(400);
      expect(res1.body.code).toBe(1);

      const res2 = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/comments`)
        .send({
          visitorName: "用户",
          content: "",
        });
      expect(res2.status).toBe(400);
      expect(res2.body.code).toBe(1);
    });

    it("留言内容不能超过500字", async () => {
      const longContent = "a".repeat(501);
      const res = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/comments`)
        .send({
          visitorName: "测试用户",
          content: longContent,
        });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(1);
    });

    it("pending状态的留言在公开列表中不可见", async () => {
      db.prepare(
        `INSERT INTO comments (chapter_id, visitor_name, content, status) VALUES (?, ?, ?, 'pending')`
      ).run(testData.publishedChapterId, "用户1", "待审核留言");

      const res = await request(app).get(
        `/api/chapters/${testData.publishedChapterId}/comments`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it("只有审核通过的留言才能被点赞", async () => {
      const pendingComment = db
        .prepare(
          `INSERT INTO comments (chapter_id, visitor_name, content, status) VALUES (?, ?, ?, 'pending')`
        )
        .run(testData.publishedChapterId, "用户1", "待审核留言");
      const pendingCommentId = pendingComment.lastInsertRowid;

      const likeRes1 = await request(app).post(
        `/api/comments/${pendingCommentId}/like`
      );
      expect(likeRes1.status).toBe(404);
      expect(likeRes1.body.code).toBe(1);

      const approvedComment = db
        .prepare(
          `INSERT INTO comments (chapter_id, visitor_name, content, status, like_count) VALUES (?, ?, ?, 'approved', 0)`
        )
        .run(testData.publishedChapterId, "用户2", "已通过留言");
      const approvedCommentId = approvedComment.lastInsertRowid;

      const likeRes2 = await request(app).post(
        `/api/comments/${approvedCommentId}/like`
      );
      expect(likeRes2.status).toBe(200);
      expect(likeRes2.body.data.like_count).toBe(1);

      const likeRes3 = await request(app).post(
        `/api/comments/${approvedCommentId}/like`
      );
      expect(likeRes3.status).toBe(200);
      expect(likeRes3.body.data.like_count).toBe(2);
    });

    it("管理员审核通过后留言才可见", async () => {
      const commentResult = db
        .prepare(
          `INSERT INTO comments (chapter_id, visitor_name, content, status) VALUES (?, ?, ?, 'pending')`
        )
        .run(testData.publishedChapterId, "测试用户", "待审核的留言");
      const commentId = commentResult.lastInsertRowid;

      const beforeRes = await request(app).get(
        `/api/chapters/${testData.publishedChapterId}/comments`
      );
      expect(beforeRes.body.data.total).toBe(0);

      const approveRes = await request(app).patch(
        `/api/admin/comments/${commentId}/approve`
      );
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.code).toBe(0);

      const comment = db
        .prepare("SELECT status FROM comments WHERE id = ?")
        .get(commentId);
      expect(comment.status).toBe("approved");

      const afterRes = await request(app).get(
        `/api/chapters/${testData.publishedChapterId}/comments`
      );
      expect(afterRes.body.data.total).toBe(1);
      expect(afterRes.body.data.list[0].content).toBe("待审核的留言");
    });
  });

  describe("献花功能", () => {
    it("献花成功后计数应正确增加", async () => {
      const res1 = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/flowers`)
        .send({
          visitorName: "用户A",
          message: "致敬先烈",
        });
      expect(res1.status).toBe(201);
      expect(res1.body.data.flowerCount).toBe(1);

      const res2 = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/flowers`)
        .send({
          visitorName: "用户B",
          message: "",
        });
      expect(res2.status).toBe(201);
      expect(res2.body.data.flowerCount).toBe(2);

      const chapter = db
        .prepare("SELECT flower_count FROM chapters WHERE id = ?")
        .get(testData.publishedChapterId);
      expect(chapter.flower_count).toBe(2);

      const flowers = db
        .prepare("SELECT COUNT(*) as count FROM flowers WHERE chapter_id = ?")
        .get(testData.publishedChapterId);
      expect(flowers.count).toBe(2);
    });

    it("献花寄语不能超过100字", async () => {
      const longMessage = "a".repeat(101);
      const res = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/flowers`)
        .send({
          visitorName: "测试用户",
          message: longMessage,
        });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(1);
    });

    it("默认访客名为匿名用户", async () => {
      await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/flowers`)
        .send({});

      const flower = db
        .prepare(
          "SELECT visitor_name FROM flowers WHERE chapter_id = ? ORDER BY id DESC LIMIT 1"
        )
        .get(testData.publishedChapterId);
      expect(flower.visitor_name).toBe("匿名用户");
    });
  });

  describe("访客观看进度", () => {
    it("首次保存进度应创建新记录", async () => {
      const visitorId = "test_visitor_001";
      const res = await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: testData.publishedChapterId,
          watched: false,
          lastPosition: 120,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.visitorId).toBe(visitorId);

      const progress = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(visitorId, testData.publishedChapterId);
      expect(progress).toBeTruthy();
      expect(progress.watched).toBe(0);
      expect(progress.last_position).toBe(120);
    });

    it("重复保存同一章节进度应执行upsert更新", async () => {
      const visitorId = "test_visitor_002";

      await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: testData.publishedChapterId,
          watched: false,
          lastPosition: 100,
        });

      await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: testData.publishedChapterId,
          watched: true,
          lastPosition: 500,
        });

      const progress = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(visitorId, testData.publishedChapterId);
      expect(progress.watched).toBe(1);
      expect(progress.last_position).toBe(500);

      const count = db
        .prepare(
          "SELECT COUNT(*) as count FROM visitor_progress WHERE visitor_id = ?"
        )
        .get(visitorId);
      expect(count.count).toBe(1);
    });

    it("没有传visitorId时应自动生成", async () => {
      const res = await request(app)
        .post("/api/progress")
        .send({
          chapterId: testData.publishedChapterId,
          watched: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.visitorId).toMatch(/^visitor_/);
    });

    it("章节ID不能为空", async () => {
      const res = await request(app)
        .post("/api/progress")
        .send({
          visitorId: "test_visitor",
          watched: true,
        });
      expect(res.status).toBe(400);
    });

    it("章节不存在时应返回404", async () => {
      const res = await request(app)
        .post("/api/progress")
        .send({
          visitorId: "test_visitor",
          chapterId: 99999,
          watched: true,
        });
      expect(res.status).toBe(404);
    });

    it("查询进度应返回正确数据", async () => {
      const visitorId = "test_visitor_003";

      await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: testData.publishedChapterId,
          watched: true,
          lastPosition: 300,
        });

      const res = await request(app)
        .get("/api/progress")
        .query({ visitorId });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].chapter_id).toBe(testData.publishedChapterId);
      expect(res.body.data[0].watched).toBe(1);
    });

    it("mark-watched接口应标记为已观看", async () => {
      const visitorId = "test_visitor_004";
      const res = await request(app)
        .post(`/api/chapters/${testData.publishedChapterId}/mark-watched`)
        .send({ visitorId });

      expect(res.status).toBe(200);
      expect(res.body.data.watched).toBe(true);

      const progress = db
        .prepare(
          "SELECT watched FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?"
        )
        .get(visitorId, testData.publishedChapterId);
      expect(progress.watched).toBe(1);
    });
  });

  describe("章节状态校验", () => {
    it("未发布（草稿）章节不能留言", async () => {
      const res = await request(app)
        .post(`/api/chapters/${testData.draftChapterId}/comments`)
        .send({
          visitorName: "测试用户",
          content: "尝试在草稿章节留言",
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toContain("未发布");
    });

    it("未发布（草稿）章节不能献花", async () => {
      const res = await request(app)
        .post(`/api/chapters/${testData.draftChapterId}/flowers`)
        .send({
          visitorName: "测试用户",
          message: "尝试在草稿章节献花",
        });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toContain("未发布");
    });

    it("不存在的章节不能留言", async () => {
      const res = await request(app)
        .post(`/api/chapters/99999/comments`)
        .send({
          visitorName: "测试用户",
          content: "尝试在不存在的章节留言",
        });
      expect(res.status).toBe(404);
    });

    it("不存在的章节不能献花", async () => {
      const res = await request(app)
        .post(`/api/chapters/99999/flowers`)
        .send({
          visitorName: "测试用户",
          message: "尝试在不存在的章节献花",
        });
      expect(res.status).toBe(404);
    });
  });
});
