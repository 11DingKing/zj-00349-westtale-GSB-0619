import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, closeDb } from "../db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = getDb();

db.exec(`
  CREATE TABLE IF NOT EXISTS storylines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    storyline_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    content TEXT,
    images TEXT,
    video_url TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    view_count INTEGER DEFAULT 0,
    flower_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (storyline_id) REFERENCES storylines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    category TEXT,
    era TEXT,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS figures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birth_date TEXT,
    death_date TEXT,
    description TEXT,
    portrait TEXT,
    role TEXT,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chapter_artifacts (
    chapter_id INTEGER NOT NULL,
    artifact_id INTEGER NOT NULL,
    PRIMARY KEY (chapter_id, artifact_id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chapter_figures (
    chapter_id INTEGER NOT NULL,
    figure_id INTEGER NOT NULL,
    PRIMARY KEY (chapter_id, figure_id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (figure_id) REFERENCES figures(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    visitor_name TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    like_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS flowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    visitor_name TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    visitor_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visitor_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    chapter_id INTEGER NOT NULL,
    watched INTEGER DEFAULT 0,
    last_position INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(visitor_id, chapter_id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chapters_storyline ON chapters(storyline_id);
  CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);
  CREATE INDEX IF NOT EXISTS idx_comments_chapter ON comments(chapter_id);
  CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
  CREATE INDEX IF NOT EXISTS idx_flowers_chapter ON flowers(chapter_id);
  CREATE INDEX IF NOT EXISTS idx_views_target ON views(target_type, target_id);
`);

console.log("数据库表创建完成，开始插入种子数据...");

const insertStoryline = db.prepare(`
  INSERT INTO storylines (title, description, cover_image, sort_order, status)
  VALUES (?, ?, ?, ?, ?)
`);

const insertChapter = db.prepare(`
  INSERT INTO chapters (storyline_id, title, date, content, images, video_url, sort_order, status, view_count, flower_count, comment_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertArtifact = db.prepare(`
  INSERT INTO artifacts (name, description, image, category, era, view_count)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertFigure = db.prepare(`
  INSERT INTO figures (name, birth_date, death_date, description, portrait, role, view_count)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertChapterArtifact = db.prepare(`
  INSERT OR IGNORE INTO chapter_artifacts (chapter_id, artifact_id)
  VALUES (?, ?)
`);

const insertChapterFigure = db.prepare(`
  INSERT OR IGNORE INTO chapter_figures (chapter_id, figure_id)
  VALUES (?, ?)
`);

const insertComment = db.prepare(`
  INSERT INTO comments (chapter_id, visitor_name, content, status, like_count, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertFlower = db.prepare(`
  INSERT INTO flowers (chapter_id, visitor_name, message, created_at)
  VALUES (?, ?, ?, ?)
`);

const imgUrl = (prompt, size = "square_hd") =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

const storylines = [
  {
    title: "西征悲歌：红西路军征战史",
    description:
      "1936年10月至1937年3月，中国工农红军第四方面军一部奉中央军委命令，西渡黄河作战，在河西走廊与国民党马步芳、马步青等部展开了艰苦卓绝的战斗。这段悲壮的历史，展现了红军将士不畏艰险、不怕牺牲的英雄气概。",
    cover_image: imgUrl(
      "中国工农红军西路军军旗飘扬，河西走廊雪山背景，历史油画风格",
    ),
    sort_order: 1,
    status: "published",
  },
  {
    title: "铁血英魂：西路军人物志",
    description:
      "西路军的将士们，无论是高级指挥员还是普通战士，都用鲜血和生命谱写了一曲曲壮丽的英雄赞歌。让我们铭记这些为民族解放事业献出宝贵生命的革命先烈。",
    cover_image: imgUrl("西路军指战员肖像，革命历史人物油画，庄严肃穆"),
    sort_order: 2,
    status: "published",
  },
  {
    title: "永恒的记忆：西路军文物史料展",
    description:
      "一件件珍贵的文物，承载着那段烽火岁月的记忆。通过这些历史遗存，我们可以更真切地感受到西路军将士们的革命精神和崇高品格。",
    cover_image: imgUrl(
      "红军长征文物展柜，老旧的军帽、徽章、武器，博物馆陈列风格",
    ),
    sort_order: 3,
    status: "published",
  },
];

const storylineIds = [];
storylines.forEach((s, index) => {
  const result = insertStoryline.run(
    s.title,
    s.description,
    s.cover_image,
    s.sort_order,
    s.status,
  );
  storylineIds.push(result.lastInsertRowid);
});
console.log(`插入 ${storylineIds.length} 条故事线`);

const chapters = [
  {
    storyline_idx: 0,
    title: "西渡黄河，踏上西征路",
    date: "1936-10-24",
    content:
      "1936年10月，中国工农红军第一、二、四方面军在甘肃会宁胜利会师后，红四方面军总部率第三十军、九军、五军等部共2.18万人，奉中央军委命令西渡黄河，执行宁夏战役计划。10月24日，红三十军在靖远虎豹口突破黄河天险，拉开了西路军西征的序幕。",
    images: JSON.stringify([
      imgUrl("红军西渡黄河油画，虎豹口渡口，木船渡江战斗场景"),
      imgUrl("靖远虎豹口黄河渡口，红色革命纪念地"),
    ]),
    video_url: "",
    sort_order: 1,
    status: "published",
    view_count: 1286,
    flower_count: 342,
    comment_count: 89,
  },
  {
    storyline_idx: 0,
    title: "一条山战斗，初战告捷",
    date: "1936-10-27",
    content:
      "渡河后，西路军迅速向国民党马步芳、马步青部发起进攻。红三十军在一条山地区与敌军激战数日，歼灭敌骑兵五百余人，击毙敌副总指挥马廷祥，取得了渡河后的第一个重大胜利。这一胜利极大地鼓舞了全军士气，但也暴露了西路军的实力，引起了马家军的疯狂反扑。",
    images: JSON.stringify([
      imgUrl("一条山战斗场景油画，红军骑兵冲锋，沙漠戈壁战场"),
      imgUrl("一条山战役纪念碑，蓝天白云背景"),
    ]),
    video_url: "",
    sort_order: 2,
    status: "published",
    view_count: 1056,
    flower_count: 278,
    comment_count: 67,
  },
  {
    storyline_idx: 0,
    title: "古浪血战，九军受挫",
    date: "1936-11-10",
    content:
      "1936年11月10日，红九军进占古浪县城，遭到马家军三个骑兵旅、两个步兵旅和四个民团的猛烈围攻。在三天三夜的激战中，红九军歼敌两千余人，但自身也伤亡惨重，伤亡两千四百余人，军长孙玉清负伤，参谋长陈伯稚等多名指挥员壮烈牺牲。古浪一战使红九军元气大伤。",
    images: JSON.stringify([
      imgUrl("古浪血战油画，惨烈的巷战场景，红军战士坚守阵地"),
      imgUrl("古浪战役纪念馆，烈士陵园"),
    ]),
    video_url: "",
    sort_order: 3,
    status: "published",
    view_count: 1123,
    flower_count: 389,
    comment_count: 95,
  },
  {
    storyline_idx: 0,
    title: "永昌山丹，建立根据地",
    date: "1936-11-18",
    content:
      "1936年11月上旬，西路军分三路西进，红三十军攻占永昌，红九军进驻山丹，红五军控制临泽、高台一线。在永昌、山丹一带，西路军与马家军展开了四十余天的拉锯战，歼敌数千人，并帮助当地建立了苏维埃政权。但由于敌军重兵围攻，加上补给困难，西路军处境日益艰难。",
    images: JSON.stringify([
      imgUrl("永昌保卫战油画，红军战士在城墙上阻击敌人"),
      imgUrl("山丹红西路军纪念馆"),
    ]),
    video_url: "",
    sort_order: 4,
    status: "published",
    view_count: 934,
    flower_count: 256,
    comment_count: 58,
  },
  {
    storyline_idx: 0,
    title: "高台悲歌，五军殉难",
    date: "1937-01-20",
    content:
      "1937年1月1日，红五军军长董振堂率部攻占高台县城。1月12日，马家军集中两万余人围攻高台。红五军将士与敌血战九昼夜，终因寡不敌众，于1月20日县城失守。军长董振堂、政治部主任杨克明等三千余名将士壮烈牺牲。高台失守是西路军西征中最惨烈的战斗之一。",
    images: JSON.stringify([
      imgUrl("高台血战油画，董振堂军长指挥战斗，城墙攻防战"),
      imgUrl("高台中国工农红军西路军纪念馆，董振堂纪念像"),
    ]),
    video_url: "",
    sort_order: 5,
    status: "published",
    view_count: 1567,
    flower_count: 523,
    comment_count: 142,
  },
  {
    storyline_idx: 0,
    title: "倪家营子苦战，绝境坚守",
    date: "1937-02-01",
    content:
      "高台失守后，西路军集中于临泽倪家营子地区，全军仅剩一万余人。从1月28日开始，马家军以七个旅的兵力对倪家营子发起猛攻。西路军在极其艰苦的条件下，与敌血战四十余天，歼敌万余人，但自身也伤亡惨重，兵力锐减到不足三千人。2月21日，西路军被迫从倪家营子突围。",
    images: JSON.stringify([
      imgUrl("倪家营子战斗油画，红军利用土围子阻击敌军骑兵"),
      imgUrl("倪家营子西路军战场遗址"),
    ]),
    video_url: "",
    sort_order: 6,
    status: "published",
    view_count: 1089,
    flower_count: 312,
    comment_count: 78,
  },
  {
    storyline_idx: 0,
    title: "石窝分兵，悲壮落幕",
    date: "1937-03-14",
    content:
      "1937年3月14日，西路军余部在祁连山红石窝召开会议，决定将剩余人员分编为三个支队，分散深入祁连山打游击。李先念率领的左支队四百余人，历尽艰险，于1937年4月底到达新疆星星峡，在陈云、滕代远的接应下进入新疆，后来回到延安。其他两支队伍大多壮烈牺牲。",
    images: JSON.stringify([
      imgUrl("石窝会议油画，西路军将领召开会议，风雪祁连山"),
      imgUrl("祁连山深处红军战士艰难行军场景"),
    ]),
    video_url: "",
    sort_order: 7,
    status: "published",
    view_count: 1342,
    flower_count: 456,
    comment_count: 118,
  },
  {
    storyline_idx: 0,
    title: "永恒的丰碑",
    date: "1937-05",
    content:
      "西路军西征虽然失败了，但西路军广大将士在极端艰苦的条件下，不怕牺牲、浴血奋战，歼灭了大量国民党军队，有力地策应了河东红军的行动，推动了西安事变的和平解决，为中国革命的胜利作出了不可磨灭的贡献。他们的英雄业绩和崇高精神，永远铭记在人民心中。",
    images: JSON.stringify([
      imgUrl("西路军英烈纪念碑，庄严肃穆，阳光照耀"),
      imgUrl("后人敬献的鲜花，缅怀革命先烈"),
    ]),
    video_url: "",
    sort_order: 8,
    status: "published",
    view_count: 1678,
    flower_count: 689,
    comment_count: 156,
  },
  {
    storyline_idx: 1,
    title: "徐向前：西路军总指挥",
    date: "1901-1990",
    content:
      "徐向前（1901-1990），山西五台人，中国人民解放军缔造者之一。1936年任红四方面军总指挥，率部西渡黄河，任西路军总指挥。在河西走廊的极端困境中，他沉着指挥部队与敌浴血奋战。西路军失败后，他化装成牧羊人，历经艰险回到延安。新中国成立后，曾任中国人民解放军总参谋长、中央军委副主席、国务院副总理兼国防部长等职，1955年被授予元帅军衔。",
    images: JSON.stringify([
      imgUrl("徐向前元帅肖像，八路军军装，威严庄重"),
      imgUrl("徐向前在指挥战斗的历史场景复原"),
    ]),
    video_url: "",
    sort_order: 1,
    status: "published",
    view_count: 2345,
    flower_count: 789,
    comment_count: 234,
  },
  {
    storyline_idx: 1,
    title: "陈昌浩：西路军政治委员",
    date: "1906-1967",
    content:
      "陈昌浩（1906-1967），湖北武汉人，中国共产党早期领导人之一。1936年任红四方面军政治委员，与徐向前一起率部西渡黄河，任西路军政治委员。西路军失败后，辗转回到延安。新中国成立后，从事编译工作，曾任中央马列学院副教育长、编译局副局长等职。他翻译的《苏联共产党（布）历史简明教程》等著作，在宣传马克思主义理论方面作出了重要贡献。",
    images: JSON.stringify([
      imgUrl("陈昌浩肖像，红军军装，知识分子气质"),
      imgUrl("陈昌浩在延安时期的工作场景复原"),
    ]),
    video_url: "",
    sort_order: 2,
    status: "published",
    view_count: 1876,
    flower_count: 543,
    comment_count: 167,
  },
  {
    storyline_idx: 1,
    title: "董振堂：红五军军长",
    date: "1895-1937",
    content:
      "董振堂（1895-1937），河北新河人，宁都起义领导人之一。1931年12月率部参加红军，任红五军团副总指挥兼十三军军长，后任红五军团军团长。1936年10月率红五军西渡黄河，编入西路军。1937年1月在高台战斗中，他率三千余名将士与敌血战九昼夜，在战斗中壮烈牺牲，年仅42岁。他是西路军牺牲的最高将领之一。",
    images: JSON.stringify([
      imgUrl("董振堂军长肖像，英俊刚毅，红军军装"),
      imgUrl("董振堂在高台城头指挥战斗的场景复原"),
    ]),
    video_url: "",
    sort_order: 3,
    status: "published",
    view_count: 2654,
    flower_count: 912,
    comment_count: 289,
  },
  {
    storyline_idx: 1,
    title: "孙玉清：红九军军长",
    date: "1910-1937",
    content:
      '孙玉清（1910-1937），湖北黄安（今红安）人。1927年参加黄麻起义，1929年加入中国共产党。他作战勇猛，屡建奇功，被誉为"战将"。1936年任红九军军长，率部西渡黄河。在古浪战斗中身负重伤。1937年3月在祁连山作战中被俘，面对敌人的威逼利诱，他坚贞不屈，于1937年5月在青海西宁英勇就义，年仅27岁。',
    images: JSON.stringify([
      imgUrl("孙玉清军长肖像，年轻英武，红军军装"),
      imgUrl("孙玉清在古浪前线指挥战斗的场景复原"),
    ]),
    video_url: "",
    sort_order: 4,
    status: "published",
    view_count: 1987,
    flower_count: 654,
    comment_count: 198,
  },
  {
    storyline_idx: 1,
    title: "李先念：红三十军政治委员",
    date: "1909-1992",
    content:
      "李先念（1909-1992），湖北黄安（今红安）人。1927年参加黄麻起义，1936年任红三十军政治委员，率部西渡黄河。西路军失败后，他率领左支队四百余人，在祁连山中艰苦转战四十余天，终于在1937年4月底到达新疆星星峡，保存了西路军最后一批骨干力量。新中国成立后，曾任国务院副总理、国家主席等职，为党和人民的事业作出了重要贡献。",
    images: JSON.stringify([
      imgUrl("李先念肖像，红军时期，眼神坚定"),
      imgUrl("李先念率领红军穿越祁连雪山的场景复原"),
    ]),
    video_url: "",
    sort_order: 5,
    status: "published",
    view_count: 2234,
    flower_count: 765,
    comment_count: 223,
  },
  {
    storyline_idx: 1,
    title: "杨克明：红五军政治部主任",
    date: "1905-1937",
    content:
      "杨克明（1905-1937），四川涪陵（今属重庆）人。1926年加入中国共产党，长期在川东地区从事革命武装斗争。1935年参加长征，任红五军政治部主任。1936年10月随红五军西渡黄河。1937年1月在高台战斗中，他与军长董振堂一起指挥部队与敌血战，在城破后仍坚持巷战，最终壮烈牺牲，年仅32岁。",
    images: JSON.stringify([
      imgUrl("杨克明肖像，戴眼镜，儒雅坚毅"),
      imgUrl("杨克明在高台街头与战士一起战斗的场景复原"),
    ]),
    video_url: "",
    sort_order: 6,
    status: "published",
    view_count: 1765,
    flower_count: 534,
    comment_count: 156,
  },
  {
    storyline_idx: 1,
    title: "王树声：西路军副总指挥",
    date: "1905-1974",
    content:
      "王树声（1905-1974），湖北麻城人。1927年参与领导黄麻起义，1936年任红四方面军副总指挥，协助徐向前指挥西路军作战。西路军失败后，他率领一支小部队在祁连山中坚持游击斗争，历经艰险，于1937年8月回到延安。新中国成立后，曾任湖北军区司令员、国防部副部长、军事科学院副院长等职，1955年被授予大将军衔。",
    images: JSON.stringify([
      imgUrl("王树声肖像，威武刚毅，红军军装"),
      imgUrl("王树声在祁连山打游击的场景复原"),
    ]),
    video_url: "",
    sort_order: 7,
    status: "published",
    view_count: 2123,
    flower_count: 678,
    comment_count: 189,
  },
  {
    storyline_idx: 1,
    title: "西路军女战士：巾帼英雄",
    date: "1936-1937",
    content:
      "在西路军的队伍中，有一千三百多名女战士，她们组成了前进剧团、卫生队、妇女先锋团等。在西征途中，她们与男同志一样行军作战，担负着宣传、救护、运输等繁重任务。在战斗中，许多女战士英勇牺牲，被俘的女战士也坚贞不屈，用生命和鲜血谱写了一曲曲惊天地泣鬼神的巾帼英雄史诗。",
    images: JSON.stringify([
      imgUrl("西路军女战士群像油画，英勇无畏，战地黄花"),
      imgUrl("妇女先锋团战士战斗场景复原"),
    ]),
    video_url: "",
    sort_order: 8,
    status: "published",
    view_count: 2456,
    flower_count: 890,
    comment_count: 267,
  },
];

const chapterIds = [];
chapters.forEach((c) => {
  const result = insertChapter.run(
    storylineIds[c.storyline_idx],
    c.title,
    c.date,
    c.content,
    c.images,
    c.video_url,
    c.sort_order,
    c.status,
    c.view_count,
    c.flower_count,
    c.comment_count,
  );
  chapterIds.push(result.lastInsertRowid);
});
console.log(`插入 ${chapterIds.length} 个章节`);

const artifacts = [
  {
    name: "董振堂用过的望远镜",
    description:
      "这架望远镜是红五军军长董振堂在西征途中使用的。董振堂就是用它观察敌情，指挥了一次次战斗。在高台战斗中，这架望远镜见证了他生命中最后的战斗。",
    image: imgUrl("铜制军用望远镜，老旧磨损，放在红绒布上，博物馆展柜"),
    category: "武器装备",
    era: "1936-1937",
    view_count: 1234,
  },
  {
    name: "红军战士的军帽",
    description:
      "这是一顶缀有红五星的红军八角帽，帽檐已经磨破，上面还留有战场上的硝烟痕迹。它的主人是一位普通的西路军战士，在战斗中英勇牺牲。",
    image: imgUrl("老旧的红军八角帽，红五星，磨损痕迹，陈列在展柜中"),
    category: "生活用品",
    era: "1936-1937",
    view_count: 987,
  },
  {
    name: "长征时期的干粮袋",
    description:
      "这是西路军战士使用过的干粮袋，上面缝着多个补丁，记录着艰苦的行军历程。在河西走廊的严寒中，就是这样的干粮袋，维系着战士们的生命。",
    image: imgUrl("粗布干粮袋，多个补丁，帆布材质，展陈品"),
    category: "生活用品",
    era: "1936-1937",
    view_count: 876,
  },
  {
    name: "红军标语墙复制品",
    description:
      '这是根据西路军在永昌、山丹一带留下的标语复制的。墙上写着"打倒蒋介石！""抗日救国！""建立苏维埃政权！"等口号，是西路军宣传工作的重要见证。',
    image: imgUrl("黄土墙上的红军标语，毛笔书写，历史感强"),
    category: "宣传品",
    era: "1936",
    view_count: 1056,
  },
  {
    name: "土造手榴弹",
    description:
      "由于武器弹药匮乏，西路军战士就地取材，制造了大量土手榴弹。这种手榴弹虽然简陋，但在近战中发挥了重要作用，凝结着战士们的智慧和勇气。",
    image: imgUrl("土造手榴弹，石头或生铁材质，博物馆陈列"),
    category: "武器装备",
    era: "1936-1937",
    view_count: 765,
  },
  {
    name: "女战士的针线包",
    description:
      "这个针线包是西路军前进剧团一位女战士的遗物。在艰苦的行军途中，她用它缝补战友们的衣服，也为牺牲的战友整理遗容。针线包里还留着几枚生锈的顶针和丝线。",
    image: imgUrl("粗布针线包，刺绣图案，里面有针线顶针，怀旧风格"),
    category: "生活用品",
    era: "1936-1937",
    view_count: 1123,
  },
  {
    name: "马家军的马刀",
    description:
      "这是缴获的马家军骑兵使用的马刀。在西路军与马家军的战斗中，这样的马刀夺走了无数红军战士的生命。这把刀作为历史的见证，提醒后人铭记那段悲壮的历史。",
    image: imgUrl("马家军骑兵马刀，冷兵器，带刀鞘，展陈"),
    category: "敌方武器",
    era: "1936-1937",
    view_count: 934,
  },
  {
    name: "红军使用的油灯",
    description:
      "这盏小小的油灯，曾在无数个夜晚陪伴西路军指战员研究作战方案、撰写战斗总结。在漆黑的河西走廊寒夜，它的光芒象征着革命的希望。",
    image: imgUrl("老旧的铁制油灯，玻璃灯罩，磨损痕迹，博物馆灯光"),
    category: "生活用品",
    era: "1936-1937",
    view_count: 845,
  },
  {
    name: "苏维埃政府印章复制品",
    description:
      "这是西路军在永昌建立的中华苏维埃永昌区临时政府的印章复制品。1936年12月，西路军在永昌、山丹一带建立了县级苏维埃政权，这是河西走廊最早的红色政权。",
    image: imgUrl("木质印章，刻有五角星和镰刀锤头，苏维埃字样"),
    category: "政权建设",
    era: "1936",
    view_count: 1089,
  },
  {
    name: "西路军战士的家书",
    description:
      '这是一位西路军战士在西征途中写给家中父母的信。信中写道："儿为革命牺牲，死而无怨。望双亲保重身体，革命胜利之日，就是儿荣归之时。"信纸已经泛黄，但字迹依然清晰。',
    image: imgUrl("泛黄的信纸，毛笔手写家书，老旧信封，历史感"),
    category: "文书档案",
    era: "1936",
    view_count: 1456,
  },
  {
    name: "冲锋号",
    description:
      "这把铜制冲锋号，曾在无数次战斗中吹响。号声一响，战士们就跃出战壕，向敌人发起冲锋。它的声音，是西路军将士不畏牺牲、勇往直前的象征。",
    image: imgUrl("铜制军号，磨损痕迹，放在展柜中，红色背景"),
    category: "军用品",
    era: "1936-1937",
    view_count: 1345,
  },
  {
    name: "李先念用过的地图袋",
    description:
      "这个帆布地图袋是红三十军政治委员李先念在西征时使用的。袋中曾装着祁连山和河西走廊的军用地图，李先念就是靠着这些地图，率领左支队穿越了茫茫祁连山。",
    image: imgUrl("帆布地图袋，磨损严重，有多个口袋，军事风格"),
    category: "军用品",
    era: "1936-1937",
    view_count: 1212,
  },
];

const artifactIds = [];
artifacts.forEach((a) => {
  const result = insertArtifact.run(
    a.name,
    a.description,
    a.image,
    a.category,
    a.era,
    a.view_count,
  );
  artifactIds.push(result.lastInsertRowid);
});
console.log(`插入 ${artifactIds.length} 件文物`);

const figures = [
  {
    name: "徐向前",
    birth_date: "1901-11-08",
    death_date: "1990-09-21",
    description:
      "徐向前，原名徐象谦，字子敬，山西五台人。中国人民解放军的缔造者之一，中华人民共和国元帅。1936年任西路军总指挥，率部西征。",
    portrait: imgUrl("徐向前元帅标准肖像，红军军装，庄重威严"),
    role: "西路军总指挥",
    view_count: 2345,
  },
  {
    name: "陈昌浩",
    birth_date: "1906-09-18",
    death_date: "1967-07-30",
    description:
      "陈昌浩，湖北武汉人。中国共产党早期领导人之一，曾任红四方面军政治委员。1936年任西路军政治委员，与徐向前共同指挥西路军作战。",
    portrait: imgUrl("陈昌浩肖像，戴眼镜，知识分子气质，红军军装"),
    role: "西路军政治委员",
    view_count: 1876,
  },
  {
    name: "董振堂",
    birth_date: "1895-12-21",
    death_date: "1937-01-20",
    description:
      "董振堂，字绍仲，河北新河人。宁都起义领导人之一，红五军军长。1937年1月在高台战斗中壮烈牺牲。",
    portrait: imgUrl("董振堂肖像，英俊刚毅，正直的眼神"),
    role: "红五军军长",
    view_count: 2654,
  },
  {
    name: "孙玉清",
    birth_date: "1910-03",
    death_date: "1937-05",
    description:
      '孙玉清，湖北黄安人。红九军军长，作战勇猛，被誉为"战将"。1937年3月被俘，5月在西宁就义。',
    portrait: imgUrl("孙玉清肖像，年轻英武，眼神坚定"),
    role: "红九军军长",
    view_count: 1987,
  },
  {
    name: "李先念",
    birth_date: "1909-06-23",
    death_date: "1992-06-21",
    description:
      "李先念，湖北黄安人。红三十军政治委员。西路军失败后，率左支队到达新疆，保存了骨干力量。后曾任中华人民共和国主席。",
    portrait: imgUrl("李先念肖像，和蔼可亲，眼神深邃"),
    role: "红三十军政治委员",
    view_count: 2234,
  },
  {
    name: "王树声",
    birth_date: "1905-05-26",
    death_date: "1974-01-07",
    description:
      "王树声，湖北麻城人。西路军副总指挥，协助徐向前指挥作战。1955年被授予大将军衔。",
    portrait: imgUrl("王树声肖像，威武威严，大将风度"),
    role: "西路军副总指挥",
    view_count: 2123,
  },
  {
    name: "杨克明",
    birth_date: "1905",
    death_date: "1937-01-20",
    description:
      "杨克明，原名陶正，四川涪陵人。红五军政治部主任。1937年1月在高台战斗中壮烈牺牲。",
    portrait: imgUrl("杨克明肖像，戴眼镜，儒雅坚毅"),
    role: "红五军政治部主任",
    view_count: 1765,
  },
  {
    name: "程世才",
    birth_date: "1912-08-08",
    death_date: "1990-11-15",
    description: "程世才，湖北大悟人。红三十军军长。1955年被授予中将军衔。",
    portrait: imgUrl("程世才肖像，年轻有为，眼神敏锐"),
    role: "红三十军军长",
    view_count: 1543,
  },
  {
    name: "陈海松",
    birth_date: "1914",
    death_date: "1937-03-12",
    description:
      "陈海松，湖北大悟人。红九军政治委员。1937年3月在梨园口战斗中壮烈牺牲，年仅23岁。",
    portrait: imgUrl("陈海松肖像，年轻英俊，朝气蓬勃"),
    role: "红九军政治委员",
    view_count: 1654,
  },
  {
    name: "黄超",
    birth_date: "1906",
    death_date: "1938",
    description:
      "黄超，贵州人。红五军政治委员。西路军失败后随左支队到新疆，后被错杀。",
    portrait: imgUrl("黄超肖像，红军政治工作者形象"),
    role: "红五军政治委员",
    view_count: 1234,
  },
  {
    name: "李特",
    birth_date: "1902",
    death_date: "1938",
    description:
      "李特，原名徐克勋，安徽霍邱人。西路军参谋长。随左支队到新疆后被错杀。",
    portrait: imgUrl("李特肖像，参谋长形象，戴眼镜"),
    role: "西路军参谋长",
    view_count: 1123,
  },
  {
    name: "曾日三",
    birth_date: "1904",
    death_date: "1937-04",
    description:
      "曾日三，湖南宜章人。红九军代政治委员。1937年4月在祁连山牛毛山战斗中被俘，英勇就义。",
    portrait: imgUrl("曾日三肖像，沉稳坚毅"),
    role: "红九军代政治委员",
    view_count: 1098,
  },
];

const figureIds = [];
figures.forEach((f) => {
  const result = insertFigure.run(
    f.name,
    f.birth_date,
    f.death_date,
    f.description,
    f.portrait,
    f.role,
    f.view_count,
  );
  figureIds.push(result.lastInsertRowid);
});
console.log(`插入 ${figureIds.length} 位人物`);

const chapterArtifactRelations = [
  { chapter: 0, artifacts: [0, 1, 2] },
  { chapter: 1, artifacts: [3, 4] },
  { chapter: 2, artifacts: [4, 6] },
  { chapter: 3, artifacts: [3, 8] },
  { chapter: 4, artifacts: [0, 5, 9] },
  { chapter: 5, artifacts: [1, 4, 7] },
  { chapter: 6, artifacts: [10, 11] },
  { chapter: 7, artifacts: [1, 9, 10] },
  { chapter: 14, artifacts: [5, 9] },
  { chapter: 15, artifacts: [1, 2, 7] },
];

chapterArtifactRelations.forEach((rel) => {
  const chapterId = chapterIds[rel.chapter];
  rel.artifacts.forEach((artIdx) => {
    insertChapterArtifact.run(chapterId, artifactIds[artIdx]);
  });
});
console.log("插入章节-文物关联");

const chapterFigureRelations = [
  { chapter: 0, figures: [0, 1, 4] },
  { chapter: 1, figures: [0, 7] },
  { chapter: 2, figures: [3, 8] },
  { chapter: 3, figures: [0, 1] },
  { chapter: 4, figures: [2, 6] },
  { chapter: 5, figures: [0, 1, 5] },
  { chapter: 6, figures: [4, 7, 10] },
  { chapter: 7, figures: [0, 1, 2, 3] },
  { chapter: 8, figures: [0] },
  { chapter: 9, figures: [1] },
  { chapter: 10, figures: [2] },
  { chapter: 11, figures: [3] },
  { chapter: 12, figures: [4] },
  { chapter: 13, figures: [6] },
  { chapter: 14, figures: [5] },
  { chapter: 15, figures: [9, 10, 11] },
];

chapterFigureRelations.forEach((rel) => {
  const chapterId = chapterIds[rel.chapter];
  rel.figures.forEach((figIdx) => {
    insertChapterFigure.run(chapterId, figureIds[figIdx]);
  });
});
console.log("插入章节-人物关联");

const comments = [
  {
    chapter_idx: 0,
    name: "张爱国",
    content: "向西路军先烈致敬！你们的精神永远值得我们学习！",
    status: "approved",
    likes: 45,
    date: "2026-06-10 14:30:00",
  },
  {
    chapter_idx: 0,
    name: "李明",
    content: "第一次详细了解这段历史，太震撼了。",
    status: "approved",
    likes: 23,
    date: "2026-06-11 09:15:00",
  },
  {
    chapter_idx: 0,
    name: "王芳",
    content: "先烈们用生命换来了今天的和平，我们要倍加珍惜。",
    status: "approved",
    likes: 34,
    date: "2026-06-12 16:45:00",
  },
  {
    chapter_idx: 4,
    name: "赵一",
    content: "董振堂军长永垂不朽！高台三千英灵永存！",
    status: "approved",
    likes: 78,
    date: "2026-06-08 11:20:00",
  },
  {
    chapter_idx: 4,
    name: "孙磊",
    content: "每次看到这段历史都热泪盈眶，这是我们民族的脊梁。",
    status: "approved",
    likes: 56,
    date: "2026-06-09 08:30:00",
  },
  {
    chapter_idx: 4,
    name: "周敏",
    content: "向革命先烈致以最崇高的敬意！",
    status: "approved",
    likes: 43,
    date: "2026-06-10 19:50:00",
  },
  {
    chapter_idx: 7,
    name: "吴小红",
    content: "西路军的精神永存，他们的牺牲不会被忘记。",
    status: "approved",
    likes: 67,
    date: "2026-06-05 13:15:00",
  },
  {
    chapter_idx: 7,
    name: "郑强",
    content: "感谢这个数字展，让我们能如此真切地感受那段历史。",
    status: "approved",
    likes: 45,
    date: "2026-06-07 10:00:00",
  },
  {
    chapter_idx: 7,
    name: "钱华",
    content: "铭记历史，开创未来，这是对先烈最好的告慰。",
    status: "approved",
    likes: 52,
    date: "2026-06-11 15:30:00",
  },
  {
    chapter_idx: 10,
    name: "李建国",
    content: "董振堂军长是真正的民族英雄，他的精神永远激励着我们。",
    status: "approved",
    likes: 89,
    date: "2026-06-03 09:45:00",
  },
  {
    chapter_idx: 10,
    name: "王静",
    content: "每次看到这里都会流泪，先烈们太伟大了。",
    status: "approved",
    likes: 61,
    date: "2026-06-04 17:20:00",
  },
  {
    chapter_idx: 15,
    name: "陈曦",
    content: "巾帼不让须眉，西路军女战士们永垂不朽！",
    status: "approved",
    likes: 72,
    date: "2026-06-06 12:10:00",
  },
  {
    chapter_idx: 15,
    name: "林梅",
    content: "女性在革命中同样作出了巨大贡献，值得永远铭记。",
    status: "approved",
    likes: 58,
    date: "2026-06-08 14:30:00",
  },
  {
    chapter_idx: 0,
    name: "黄明",
    content: "建议更多人来了解这段历史。",
    status: "pending",
    likes: 0,
    date: "2026-06-16 11:00:00",
  },
  {
    chapter_idx: 4,
    name: "刘涛",
    content: "高台战斗太惨烈了，革命胜利来之不易。",
    status: "pending",
    likes: 0,
    date: "2026-06-16 14:20:00",
  },
];

comments.forEach((c) => {
  insertComment.run(
    chapterIds[c.chapter_idx],
    c.name,
    c.content,
    c.status,
    c.likes,
    c.date,
  );
});
console.log(`插入 ${comments.length} 条留言`);

const flowers = [
  {
    chapter_idx: 0,
    name: "匿名用户",
    message: "缅怀先烈，致敬英雄",
    date: "2026-06-10 10:00:00",
  },
  {
    chapter_idx: 0,
    name: "王志远",
    message: "西路军精神永垂不朽",
    date: "2026-06-11 11:30:00",
  },
  {
    chapter_idx: 4,
    name: "张明",
    message: "董振堂军长千古",
    date: "2026-06-08 15:00:00",
  },
  {
    chapter_idx: 4,
    name: "李丽",
    message: "向高台三千英灵致敬",
    date: "2026-06-09 09:20:00",
  },
  {
    chapter_idx: 4,
    name: "赵刚",
    message: "英烈永存",
    date: "2026-06-09 16:45:00",
  },
  {
    chapter_idx: 7,
    name: "孙涛",
    message: "铭记历史，勿忘国耻",
    date: "2026-06-05 14:10:00",
  },
  {
    chapter_idx: 7,
    name: "周婷",
    message: "为了新中国，前进！",
    date: "2026-06-06 08:30:00",
  },
  {
    chapter_idx: 10,
    name: "吴鹏",
    message: "董振堂将军永垂不朽",
    date: "2026-06-03 16:20:00",
  },
  {
    chapter_idx: 12,
    name: "郑华",
    message: "李先念主席，您的功绩永存",
    date: "2026-06-04 11:50:00",
  },
  {
    chapter_idx: 15,
    name: "林芳",
    message: "巾帼英雄永垂不朽",
    date: "2026-06-07 13:40:00",
  },
  {
    chapter_idx: 6,
    name: "刘强",
    message: "石窝分兵，西路军最后的悲壮",
    date: "2026-06-12 10:15:00",
  },
  {
    chapter_idx: 5,
    name: "陈静",
    message: "倪家营子的战斗太惨烈了",
    date: "2026-06-13 15:30:00",
  },
];

flowers.forEach((f) => {
  insertFlower.run(chapterIds[f.chapter_idx], f.name, f.message, f.date);
});
console.log(`插入 ${flowers.length} 条献花记录`);

closeDb();
console.log("\n数据库初始化完成！");
console.log(
  `共计：${storylineIds.length} 条故事线，${chapterIds.length} 个章节，${artifactIds.length} 件文物，${figureIds.length} 位人物`,
);
