import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";
import { setupTestApp } from "./setup.js";
import { resetDb } from "../src/db/index.js";

describe("互动接口测试", () => {
  let app;
  let db;
  let testData;

  beforeEach(() => {
    const setup = setupTestApp();
    db = setup.db;
    testData = setup.testData;
    app = createApp();
  });

  afterEach(() => {
    resetDb();
  });

  describe("留言功能", () => {
    it("提交留言后状态应为 pending（待审核）", async () => {
      const { publishedChapterId } = testData;

      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({
          visitorName: "测试访客",
          content: "这是一条测试留言",
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.message).toBe("留言提交成功，等待审核");

      const comment = db
        .prepare("SELECT * FROM comments WHERE visitor_name = ?")
        .get("测试访客");
      expect(comment).toBeDefined();
      expect(comment.status).toBe("pending");
      expect(comment.content).toBe("这是一条测试留言");
      expect(comment.chapter_id).toBe(publishedChapterId);

      const chapter = db
        .prepare("SELECT comment_count FROM chapters WHERE id = ?")
        .get(publishedChapterId);
      expect(chapter.comment_count).toBe(1);
    });

    it("留言内容不能为空", async () => {
      const { publishedChapterId } = testData;

      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({
          visitorName: "",
          content: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("访客名称和留言内容不能为空");
    });

    it("留言内容不能超过500字", async () => {
      const { publishedChapterId } = testData;

      const longContent = "测".repeat(501);

      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/comments`)
        .send({
          visitorName: "测试访客",
          content: longContent,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("留言内容不能超过500字");
    });

    it("待审核留言不应出现在公开留言列表中", async () => {
      const { publishedChapterId } = testData;

      db.prepare(
        `
        INSERT INTO comments (chapter_id, visitor_name, content, status, created_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `,
      ).run(publishedChapterId, "待审核用户", "这条留言还没审核");

      const res = await request(app).get(
        `/api/chapters/${publishedChapterId}/comments`,
      );

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.list.length).toBe(0);
    });

    it("审核通过后的留言才可见", async () => {
      const { publishedChapterId } = testData;

      const insertResult = db
        .prepare(
          `
        INSERT INTO comments (chapter_id, visitor_name, content, status, created_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `,
        )
        .run(publishedChapterId, "待审核用户", "这条留言等待审核");

      const commentId = insertResult.lastInsertRowid;

      let res = await request(app).get(
        `/api/chapters/${publishedChapterId}/comments`,
      );
      expect(res.body.data.total).toBe(0);

      const approveRes = await request(app).patch(
        `/api/admin/comments/${commentId}/approve`,
      );
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.code).toBe(0);

      const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(commentId);
      expect(comment.status).toBe("approved");

      res = await request(app).get(
        `/api/chapters/${publishedChapterId}/comments`,
      );
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.list[0].content).toBe("这条留言等待审核");
      expect(res.body.data.list[0].visitor_name).toBe("待审核用户");
    });

    it("未审核通过的留言不能点赞", async () => {
      const { publishedChapterId } = testData;

      const insertResult = db
        .prepare(
          `
        INSERT INTO comments (chapter_id, visitor_name, content, status, created_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `,
        )
        .run(publishedChapterId, "待审核用户", "这条留言还没审核");

      const commentId = insertResult.lastInsertRowid;

      const res = await request(app).post(`/api/comments/${commentId}/like`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("留言不存在或未审核通过");

      const comment = db.prepare("SELECT like_count FROM comments WHERE id = ?").get(commentId);
      expect(comment.like_count).toBe(0);
    });

    it("审核通过后的留言可以点赞", async () => {
      const { publishedChapterId } = testData;

      const insertResult = db
        .prepare(
          `
        INSERT INTO comments (chapter_id, visitor_name, content, status, like_count, created_at)
        VALUES (?, ?, ?, 'approved', 0, CURRENT_TIMESTAMP)
      `,
        )
        .run(publishedChapterId, "已审核用户", "这条留言已通过审核");

      const commentId = insertResult.lastInsertRowid;

      const res = await request(app).post(`/api/comments/${commentId}/like`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.like_count).toBe(1);

      const comment = db.prepare("SELECT like_count FROM comments WHERE id = ?").get(commentId);
      expect(comment.like_count).toBe(1);

      await request(app).post(`/api/comments/${commentId}/like`);
      const commentAfterSecondLike = db
        .prepare("SELECT like_count FROM comments WHERE id = ?")
        .get(commentId);
      expect(commentAfterSecondLike.like_count).toBe(2);
    });
  });

  describe("献花功能", () => {
    it("献花后计数应正确增加", async () => {
      const { publishedChapterId } = testData;

      let chapter = db
        .prepare("SELECT flower_count FROM chapters WHERE id = ?")
        .get(publishedChapterId);
      expect(chapter.flower_count).toBe(0);

      const res1 = await request(app)
        .post(`/api/chapters/${publishedChapterId}/flowers`)
        .send({
          visitorName: "献花人1",
          message: "致敬先烈",
        });

      expect(res1.status).toBe(201);
      expect(res1.body.code).toBe(0);
      expect(res1.body.data.flowerCount).toBe(1);
      expect(res1.body.data.message).toBe("献花成功");

      const flower1 = db
        .prepare("SELECT * FROM flowers WHERE visitor_name = ?")
        .get("献花人1");
      expect(flower1).toBeDefined();
      expect(flower1.message).toBe("致敬先烈");
      expect(flower1.chapter_id).toBe(publishedChapterId);

      const res2 = await request(app)
        .post(`/api/chapters/${publishedChapterId}/flowers`)
        .send({
          visitorName: "献花人2",
          message: "永垂不朽",
        });

      expect(res2.body.data.flowerCount).toBe(2);

      chapter = db
        .prepare("SELECT flower_count FROM chapters WHERE id = ?")
        .get(publishedChapterId);
      expect(chapter.flower_count).toBe(2);

      const flowersRes = await request(app).get(
        `/api/chapters/${publishedChapterId}/flowers`,
      );
      expect(flowersRes.status).toBe(200);
      expect(flowersRes.body.data.total).toBe(2);
    });

    it("献花寄语不能超过100字", async () => {
      const { publishedChapterId } = testData;

      const longMessage = "致".repeat(101);

      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/flowers`)
        .send({
          visitorName: "测试用户",
          message: longMessage,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("献花寄语不能超过100字");
    });

    it("匿名用户也可以献花（默认名称）", async () => {
      const { publishedChapterId } = testData;

      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/flowers`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);

      const flower = db
        .prepare("SELECT * FROM flowers ORDER BY id DESC LIMIT 1")
        .get();
      expect(flower.visitor_name).toBe("匿名用户");
      expect(flower.message).toBe("");
    });
  });

  describe("访客进度功能", () => {
    it("首次保存进度应创建新记录", async () => {
      const { publishedChapterId } = testData;
      const visitorId = "test_visitor_001";

      const res = await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: publishedChapterId,
          watched: false,
          lastPosition: 120,
        });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.visitorId).toBe(visitorId);
      expect(res.body.data.message).toBe("进度保存成功");

      const progress = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?",
        )
        .get(visitorId, publishedChapterId);
      expect(progress).toBeDefined();
      expect(progress.watched).toBe(0);
      expect(progress.last_position).toBe(120);
    });

    it("重复保存同一章节进度应更新（upsert）", async () => {
      const { publishedChapterId } = testData;
      const visitorId = "test_visitor_002";

      await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: publishedChapterId,
          watched: false,
          lastPosition: 100,
        });

      let progress = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?",
        )
        .get(visitorId, publishedChapterId);
      expect(progress.watched).toBe(0);
      expect(progress.last_position).toBe(100);

      const res = await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: publishedChapterId,
          watched: true,
          lastPosition: 300,
        });

      expect(res.status).toBe(200);

      progress = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?",
        )
        .get(visitorId, publishedChapterId);
      expect(progress.watched).toBe(1);
      expect(progress.last_position).toBe(300);

      const count = db
        .prepare(
          "SELECT COUNT(*) as count FROM visitor_progress WHERE visitor_id = ?",
        )
        .get(visitorId);
      expect(count.count).toBe(1);
    });

    it("不提供 visitorId 时应自动生成", async () => {
      const { publishedChapterId } = testData;

      const res = await request(app)
        .post("/api/progress")
        .send({
          chapterId: publishedChapterId,
          watched: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.visitorId).toBeDefined();
      expect(res.body.data.visitorId.startsWith("visitor_")).toBe(true);
    });

    it("chapterId 为必填项", async () => {
      const res = await request(app)
        .post("/api/progress")
        .send({
          visitorId: "test_visitor",
          watched: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("章节ID不能为空");
    });

    it("不存在的章节应返回404", async () => {
      const res = await request(app)
        .post("/api/progress")
        .send({
          visitorId: "test_visitor",
          chapterId: 99999,
          watched: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("章节不存在");
    });

    it("可以查询访客的观看进度", async () => {
      const { publishedChapterId } = testData;
      const visitorId = "test_visitor_003";

      await request(app)
        .post("/api/progress")
        .send({
          visitorId,
          chapterId: publishedChapterId,
          watched: true,
          lastPosition: 500,
        });

      const res = await request(app).get(
        `/api/progress?visitorId=${visitorId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].chapter_id).toBe(publishedChapterId);
      expect(res.body.data[0].watched).toBe(1);
      expect(res.body.data[0].last_position).toBe(500);
    });

    it("标记已看过功能应正常工作", async () => {
      const { publishedChapterId } = testData;
      const visitorId = "test_visitor_004";

      const res = await request(app)
        .post(`/api/chapters/${publishedChapterId}/mark-watched`)
        .send({ visitorId });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.watched).toBe(true);

      const progress = db
        .prepare(
          "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?",
        )
        .get(visitorId, publishedChapterId);
      expect(progress.watched).toBe(1);
    });
  });

  describe("未发布章节校验", () => {
    it("草稿状态的章节不能留言", async () => {
      const { draftChapterId } = testData;

      const res = await request(app)
        .post(`/api/chapters/${draftChapterId}/comments`)
        .send({
          visitorName: "测试访客",
          content: "尝试在草稿章节留言",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("章节不存在或未发布");

      const comments = db
        .prepare("SELECT COUNT(*) as count FROM comments WHERE chapter_id = ?")
        .get(draftChapterId);
      expect(comments.count).toBe(0);
    });

    it("草稿状态的章节不能献花", async () => {
      const { draftChapterId } = testData;

      const res = await request(app)
        .post(`/api/chapters/${draftChapterId}/flowers`)
        .send({
          visitorName: "测试访客",
          message: "尝试在草稿章节献花",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("章节不存在或未发布");

      const flowers = db
        .prepare("SELECT COUNT(*) as count FROM flowers WHERE chapter_id = ?")
        .get(draftChapterId);
      expect(flowers.count).toBe(0);

      const chapter = db
        .prepare("SELECT flower_count FROM chapters WHERE id = ?")
        .get(draftChapterId);
      expect(chapter.flower_count).toBe(0);
    });

    it("不存在的章节不能留言", async () => {
      const res = await request(app)
        .post(`/api/chapters/99999/comments`)
        .send({
          visitorName: "测试访客",
          content: "尝试在不存在的章节留言",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("章节不存在或未发布");
    });

    it("不存在的章节不能献花", async () => {
      const res = await request(app)
        .post(`/api/chapters/99999/flowers`)
        .send({
          visitorName: "测试访客",
          message: "尝试在不存在的章节献花",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toBe("章节不存在或未发布");
    });
  });
});
