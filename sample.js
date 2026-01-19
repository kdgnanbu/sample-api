import express from "express";
import cors from "cors";
import pkg from "pg";
import "dotenv/config"; // ローカルで.envを使う場合

const { Pool } = pkg;
const app = express();

// 開発用 CORS 許可
app.use(cors());

// DB 接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render Internal DB は自動設定
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Renderは必須
});

// 初期テーブル作成関数
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sample_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
      );
    `);

    // 確認用にデータ挿入（重複は避ける）
    await pool.query(`
      INSERT INTO sample_table (name)
      VALUES ('hello database')
      ON CONFLICT DO NOTHING;
    `);

    console.log("✅ DB 初期化完了");
  } catch (err) {
    console.error("❌ DB init error:", err);
  }
}

// API エンドポイント
app.get("/api/sample", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sample_table LIMIT 1");
    res.json(result.rows[0] || { message: "no data" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// サーバー起動
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDB();
});
