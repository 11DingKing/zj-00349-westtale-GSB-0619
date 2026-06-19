import { test, before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";

import {
  api,
  resetData,
  seedStoryline,
  seedChapter,
  seedComment,
  getRawDb,
  shutdown,
} from "./helpers/setup.js";

before(() => {
  resetData();
});

after(async () => {
  await shutdown();
});

beforeEach(() => {
  resetData();
});

describe("留言提交（POST /api/chapters/:id/comments）", () => {
  test("成功提交后状态为 pending，章节 comment_count +1", async () => {
    const chapterId = seedChapter({ status: "published" });

    const res = await api("POST", `/api/chapters/${chapterId}/comments`, {
      visitorName: "李明",
      content: "缅怀西路军先烈",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.code, 0);
    assert.equal(res.body.data.success, true);

    const db = getRawDb();
    const row = db
      .prepare("SELECT * FROM comments WHERE chapter_id = ?")
      .get(chapterId);
    assert.ok(row, "留言应已写入数据库");
    assert.equal(row.status, "pending", "新留言默认应为 pending 待审核");
    assert.equal(row.visitor_name, "李明");
    assert.equal(row.content, "缅怀西路军先烈");

    const chapter = db
      .prepare("SELECT comment_count FROM chapters WHERE id = ?")
      .get(chapterId);
    assert.equal(chapter.comment_count, 1);
  });

  test("缺少访客名或内容返回 400", async () => {
    const chapterId = seedChapter();

    const r1 = await api("POST", `/api/chapters/${chapterId}/comments`, {
      content: "缺少访客名",
    });
    assert.equal(r1.status, 400);
    assert.equal(r1.body.code, 1);

    const r2 = await api("POST", `/api/chapters/${chapterId}/comments`, {
      visitorName: "张三",
    });
    assert.equal(r2.status, 400);
  });

  test("超过 500 字时返回 400", async () => {
    const chapterId = seedChapter();
    const longContent = "字".repeat(501);

    const res = await api("POST", `/api/chapters/${chapterId}/comments`, {
      visitorName: "王五",
      content: longContent,
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, 1);
  });

  test("章节未发布（draft）禁止留言，返回 404", async () => {
    const chapterId = seedChapter({ status: "draft" });

    const res = await api("POST", `/api/chapters/${chapterId}/comments`, {
      visitorName: "访客",
      content: "试图留言",
    });

    assert.equal(res.status, 404);
    assert.match(res.body.message, /未发布|不存在/);

    const db = getRawDb();
    const count = db
      .prepare("SELECT COUNT(*) as c FROM comments WHERE chapter_id = ?")
      .get(chapterId).c;
    assert.equal(count, 0, "未发布章节不应写入留言");
  });

  test("章节不存在时返回 404", async () => {
    const res = await api("POST", `/api/chapters/99999/comments`, {
      visitorName: "访客",
      content: "你好",
    });
    assert.equal(res.status, 404);
  });
});

describe("留言审核与可见性", () => {
  test("访客侧 GET /chapters/:id/comments 仅返回 approved 留言", async () => {
    const chapterId = seedChapter({ status: "published" });
    seedComment({ chapterId, content: "已审核 1", status: "approved" });
    seedComment({ chapterId, content: "已审核 2", status: "approved" });
    seedComment({ chapterId, content: "待审核", status: "pending" });
    seedComment({ chapterId, content: "已拒绝", status: "rejected" });

    const res = await api("GET", `/api/chapters/${chapterId}/comments`);

    assert.equal(res.status, 200);
    assert.equal(res.body.code, 0);
    assert.equal(res.body.data.total, 2, "仅 approved 计入总数");
    assert.equal(res.body.data.list.length, 2);
    for (const c of res.body.data.list) {
      assert.equal(c.status, "approved");
    }
  });

  test("审核通过后 PATCH /admin/comments/:id/approve 将状态改为 approved", async () => {
    const chapterId = seedChapter({ status: "published" });
    const commentId = seedComment({ chapterId, status: "pending" });

    const res = await api("PATCH", `/api/admin/comments/${commentId}/approve`);
    assert.equal(res.status, 200);

    const db = getRawDb();
    const row = db
      .prepare("SELECT status FROM comments WHERE id = ?")
      .get(commentId);
    assert.equal(row.status, "approved");
  });
});

describe("留言点赞（POST /api/comments/:id/like）", () => {
  test("仅 approved 留言可被点赞，like_count +1", async () => {
    const chapterId = seedChapter({ status: "published" });
    const commentId = seedComment({
      chapterId,
      status: "approved",
      likeCount: 5,
    });

    const res = await api("POST", `/api/comments/${commentId}/like`);

    assert.equal(res.status, 200);
    assert.equal(res.body.code, 0);
    assert.equal(res.body.data.like_count, 6);

    const db = getRawDb();
    const row = db
      .prepare("SELECT like_count FROM comments WHERE id = ?")
      .get(commentId);
    assert.equal(row.like_count, 6);
  });

  test("pending 状态的留言不能点赞，返回 404", async () => {
    const chapterId = seedChapter({ status: "published" });
    const commentId = seedComment({ chapterId, status: "pending" });

    const res = await api("POST", `/api/comments/${commentId}/like`);

    assert.equal(res.status, 404);
    assert.match(res.body.message, /未审核|不存在/);

    const db = getRawDb();
    const row = db
      .prepare("SELECT like_count FROM comments WHERE id = ?")
      .get(commentId);
    assert.equal(row.like_count, 0, "未审核留言点赞数不应变化");
  });

  test("rejected 留言不能点赞", async () => {
    const chapterId = seedChapter({ status: "published" });
    const commentId = seedComment({ chapterId, status: "rejected" });

    const res = await api("POST", `/api/comments/${commentId}/like`);
    assert.equal(res.status, 404);
  });

  test("留言不存在时返回 404", async () => {
    const res = await api("POST", `/api/comments/999999/like`);
    assert.equal(res.status, 404);
  });
});

describe("献花计数（POST /api/chapters/:id/flowers）", () => {
  test("献花成功，章节 flower_count +1，并返回最新值", async () => {
    const chapterId = seedChapter({ status: "published", flowerCount: 10 });

    const res = await api("POST", `/api/chapters/${chapterId}/flowers`, {
      visitorName: "张爱国",
      message: "致敬先烈",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.code, 0);
    assert.equal(res.body.data.flowerCount, 11);

    const db = getRawDb();
    const chapter = db
      .prepare("SELECT flower_count FROM chapters WHERE id = ?")
      .get(chapterId);
    assert.equal(chapter.flower_count, 11);

    const flower = db
      .prepare("SELECT * FROM flowers WHERE chapter_id = ?")
      .get(chapterId);
    assert.ok(flower);
    assert.equal(flower.visitor_name, "张爱国");
    assert.equal(flower.message, "致敬先烈");
  });

  test("多次献花会累计 flower_count", async () => {
    const chapterId = seedChapter({ status: "published", flowerCount: 0 });

    await api("POST", `/api/chapters/${chapterId}/flowers`, {});
    await api("POST", `/api/chapters/${chapterId}/flowers`, {});
    const last = await api("POST", `/api/chapters/${chapterId}/flowers`, {});

    assert.equal(last.body.data.flowerCount, 3);

    const db = getRawDb();
    const total = db
      .prepare("SELECT COUNT(*) as c FROM flowers WHERE chapter_id = ?")
      .get(chapterId).c;
    assert.equal(total, 3);
  });

  test("章节未发布时禁止献花，返回 404 且计数不变", async () => {
    const chapterId = seedChapter({ status: "draft", flowerCount: 7 });

    const res = await api("POST", `/api/chapters/${chapterId}/flowers`, {
      visitorName: "访客",
      message: "请收下",
    });

    assert.equal(res.status, 404);
    assert.match(res.body.message, /未发布|不存在/);

    const db = getRawDb();
    const chapter = db
      .prepare("SELECT flower_count FROM chapters WHERE id = ?")
      .get(chapterId);
    assert.equal(chapter.flower_count, 7, "未发布章节献花计数不应变化");

    const flowerRows = db
      .prepare("SELECT COUNT(*) as c FROM flowers WHERE chapter_id = ?")
      .get(chapterId).c;
    assert.equal(flowerRows, 0);
  });

  test("献花寄语超过 100 字时返回 400", async () => {
    const chapterId = seedChapter({ status: "published" });
    const res = await api("POST", `/api/chapters/${chapterId}/flowers`, {
      message: "字".repeat(101),
    });
    assert.equal(res.status, 400);
  });
});

describe("访客观看进度 upsert（POST /api/progress）", () => {
  test("首次提交插入新记录", async () => {
    const chapterId = seedChapter({ status: "published" });

    const res = await api("POST", `/api/progress`, {
      visitorId: "visitor_test_001",
      chapterId,
      watched: true,
      lastPosition: 42,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.code, 0);
    assert.equal(res.body.data.visitorId, "visitor_test_001");

    const db = getRawDb();
    const row = db
      .prepare(
        "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?",
      )
      .get("visitor_test_001", chapterId);
    assert.ok(row);
    assert.equal(row.watched, 1);
    assert.equal(row.last_position, 42);
  });

  test("同一 visitorId + chapterId 再次提交则 upsert 更新", async () => {
    const chapterId = seedChapter({ status: "published" });

    await api("POST", `/api/progress`, {
      visitorId: "visitor_test_002",
      chapterId,
      watched: false,
      lastPosition: 10,
    });

    await api("POST", `/api/progress`, {
      visitorId: "visitor_test_002",
      chapterId,
      watched: true,
      lastPosition: 88,
    });

    const db = getRawDb();
    const rows = db
      .prepare(
        "SELECT * FROM visitor_progress WHERE visitor_id = ? AND chapter_id = ?",
      )
      .all("visitor_test_002", chapterId);
    assert.equal(rows.length, 1, "应仅有一条记录（upsert）");
    assert.equal(rows[0].watched, 1);
    assert.equal(rows[0].last_position, 88);
  });

  test("未传 visitorId 时自动生成并返回", async () => {
    const chapterId = seedChapter({ status: "published" });

    const res = await api("POST", `/api/progress`, {
      chapterId,
      watched: true,
      lastPosition: 0,
    });

    assert.equal(res.status, 200);
    assert.match(res.body.data.visitorId, /^visitor_/);
  });

  test("缺少 chapterId 返回 400", async () => {
    const res = await api("POST", `/api/progress`, {
      visitorId: "visitor_x",
    });
    assert.equal(res.status, 400);
  });

  test("章节不存在时返回 404", async () => {
    const res = await api("POST", `/api/progress`, {
      visitorId: "visitor_x",
      chapterId: 999999,
    });
    assert.equal(res.status, 404);
  });

  test("GET /api/progress 返回该访客的进度列表", async () => {
    const storylineId = seedStoryline();
    const c1 = seedChapter({ storylineId, title: "章节1" });
    const c2 = seedChapter({ storylineId, title: "章节2" });

    await api("POST", `/api/progress`, {
      visitorId: "v_list",
      chapterId: c1,
      watched: true,
      lastPosition: 5,
    });
    await api("POST", `/api/progress`, {
      visitorId: "v_list",
      chapterId: c2,
      watched: false,
      lastPosition: 0,
    });

    const res = await api("GET", `/api/progress?visitorId=v_list`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);
  });
});
