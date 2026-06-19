import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./db/index.js";

import publicRoutes from "./routes/public.js";
import contentRoutes from "./routes/content.js";
import interactionRoutes from "./routes/interaction.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

getDb();

app.use("/api", publicRoutes);
app.use("/api", contentRoutes);
app.use("/api", interactionRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    code: 0,
    message: "ok",
    data: { timestamp: new Date().toISOString() },
  });
});

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));

app.get("*", (req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ code: 1, message: "Not Found" });
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 1,
    message: "服务器内部错误",
    data: null,
  });
});

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === pathToFileUrl(process.argv[1]);

function pathToFileUrl(p) {
  try {
    return new URL(`file://${path.resolve(p)}`).href;
  } catch (e) {
    return "";
  }
}

if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`\n🚀 西路军历史数字展陈后端服务已启动`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`📡 API 前缀: http://localhost:${PORT}/api`);
    console.log(`🔧 后台管理: http://localhost:${PORT}/admin\n`);
  });
}

export { app };
export default app;
