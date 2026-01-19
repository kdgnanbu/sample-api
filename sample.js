// initDB.js
import { Pool } from "pg";

// ====== 接続情報 ======
// Render 上なら DATABASE_URL が設定されているはず
// ローカル用にはここで直接書く
const LOCAL_DB_URL = "postgresql://root:02nGnXc9EnrWD0ESFpWP2nEZqORTZsE4@dpg-d5mrgv3e5dus73en9b90-a/sample_aol9";

const connectionString = process.env.DATABASE_URL || LOCAL_DB_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false } // Render 上の SSL 必須
    : false,
});

// ====== DB 初期化 ======
async function initDB() {
  try {
    // actor テーブル
    await pool.query(`
      CREATE TABLE IF NOT EXISTS actor (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
    `);

    // movie テーブル
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movie (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    console.log("✅ Tables created successfully");
  } catch (err) {
    console.error("❌ DB init error:", err);
  } finally {
    await pool.end();
  }
}

// 実行
initDB();
