// sample.js
import pkg from "pg";
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL; // Render では自動で設定される

// PostgreSQL接続用プール
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render では SSL 設定が必要
  },
});

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()"); // 現在時刻を取得するだけ
    console.log("✅ DB接続成功:", res.rows[0]);
  } catch (err) {
    console.error("❌ DB接続エラー:", err);
  } finally {
    await pool.end();
  }
}

testConnection();
