// // sample.js
// // PostgreSQL (Render DB) に接続して actor テーブルのデータを取得する簡単なサンプル

// import pkg from 'pg';
// const { Pool } = pkg;

// // Render DB の接続情報
// const pool = new Pool({
//   connectionString: 'postgresql://cinema_user:Sx8YGHwzYN4HyEyOoSjLM6qAByvFetCw@dpg-d5o7absoud1c73ceeerg-a.singapore-postgres.render.com:5432/cinema_z5jh?sslmode=require'
// });

// async function main() {
//   try {
//     // DBに接続して actor テーブルの全データを取得
//     const result = await pool.query('SELECT * FROM actor ORDER BY actor_no ASC;');
    
//     console.log('=== Actor List ===');
//     result.rows.forEach(actor => {
//       console.log(`${actor.actor_no}: ${actor.name} (${actor.date_of_birth})`);
//     });

//   } catch (err) {
//     console.error('DB接続エラー:', err);
//   } finally {
//     // プールを閉じる
//     await pool.end();
//   }
// }

// // 実行
// main();// 
import express from "express";
import pg from "pg";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// CORSを有効化（ブラウザからアクセスできるようにする）
app.use(cors());
app.use(express.json());

// RenderのPostgreSQL接続情報を環境変数で取得
const pool = new pg.Pool({
connectionString: "postgresql://cinema_user:Sx8YGHwzYN4HyEyOoSjLM6qAByvFetCw@dpg-d5o7absoud1c73ceeerg-a.singapore-postgres.render.com:5432/cinema_z5jh?sslmode=require",
  ssl: {
    rejectUnauthorized: false, // RenderのSSL用
  },
});

// ルート確認用
app.get("/", (req, res) => {
  res.send("API is running");
});

// 俳優情報取得API
app.get("/actors", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM actor ORDER BY actor_no");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB query failed" });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



