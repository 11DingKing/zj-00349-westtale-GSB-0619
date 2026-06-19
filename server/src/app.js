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

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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

export default app;
