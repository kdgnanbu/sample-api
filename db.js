import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ========================
// DB 接続情報
// ========================
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  multipleStatements: true
};

// ========================
// DB 初期化
// ========================
export const initDB = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      multipleStatements: true,
    });

    await connection.query(`USE ${process.env.DB_NAME};`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS movie (
        movie_no INT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category_no INT NOT NULL,
        relese_date DATE,
        age_limit_no INT,
        image_path VARCHAR(255)
      );
    `);

    console.log("✅ DB初期化完了");

  } catch (err) {
    console.error("❌ DB init error:", err);
  } finally {
    if (connection) await connection.end();
  }
};


// ========================
// 通常クエリ用 Pool
// ========================
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});
