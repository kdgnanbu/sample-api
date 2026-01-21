import express from "express";
import { initDB } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔽 DB初期化は「失敗しても落とさない」
initDB()
  .then(() => {
    console.log("✅ DB init done");
  })
  .catch((err) => {
    console.error("❌ DB init failed", err);
  });

app.get("/", (req, res) => {
  res.send("Cinema API running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
