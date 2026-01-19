import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

// 開発用 CORS 許可（必要に応じて制限可能）
app.use(cors());

// Render 上の PostgreSQL に接続
// DATABASE_URL は Render の Environment Variables に設定
DATABASE_URL=postgres://root:02nGnXc9EnrWD0ESFpWP2nEZqORTZsE4@dpg-d5mrgv3e5dus73en9b90-a:5432/sample_aol9?sslmode=require 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render では必須
});

// DB 初期化関数
async function initDB() {
  try {
    // テーブル作成
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sample_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
      );
    `);

    // 確認用データ挿入（重複は避ける）
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
