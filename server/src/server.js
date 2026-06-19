import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 西路军历史数字展陈后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📡 API 前缀: http://localhost:${PORT}/api`);
  console.log(`🔧 后台管理: http://localhost:${PORT}/admin\n`);
});
