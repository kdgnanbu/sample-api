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
    // DBなしで接続
    connection = await mysql.createConnection(dbConfig);

    // DB作成
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_general_ci;
    `);

    // DB選択
    await connection.query(`USE ${process.env.DB_NAME};`);

    // ========================
    // TABLE 作成
    // ========================
    await connection.query(`
      CREATE TABLE IF NOT EXISTS movie (
        movie_no INT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category_no INT NOT NULL,
        relese_date DATE,
        age_limit_no INT,
        image_path VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS actor (
        actor_no INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS movie_actor (
        movie_no INT,
        actor_no INT,
        PRIMARY KEY (movie_no, actor_no)
      );
    `);

    // ========================
    // 初期データ INSERT
    // ========================
    await connection.query(`
      INSERT IGNORE INTO movie VALUES
      (1,'トリック 劇場版',2,'2002-11-09',1,'/images/movies/trick-movie.jpg'),
      (2,'テルマエ・ロマエ',2,'2012-04-28',1,'/images/movies/thermae-romae.jpg'),
      (3,'パリピ孔明 THE MOVIE',2,'2025-04-25',1,'/images/movies/paripi-koumei-the-movie.jpg'),
      (4,'ごくせん',2,'2009-07-11',1,'/images/movies/gokusen.jpg'),
      (5,'DEADPOOL',1,'2016-06-01',3,'/images/movies/deadpool.jpg'),
      (7,'トリック 劇場版2',2,'2006-11-09',1,'/images/movies/trick-movie2.jpg'),
      (8,'トリック ラストステージ',2,'2014-01-11',1,'/images/movies/trick-laststage.jpg'),
      (9,'テルマエ・ロマエII',2,'2014-04-26',1,'/images/movies/thermae-romae2.jpg'),
      (10,'修羅雪姫',2,'2001-01-01',3,'/images/movies/shura-yukihime.jpg'),
      (11,'なくもんか',2,'2009-11-14',1,'/images/movies/nakumonka.jpg'),
      (12,'キャラクター',2,'2021-06-11',3,'/images/movies/character.jpg');
    `);

    console.log("✅ DB初期化完了");

  } catch (err) {
    console.error("❌ DB初期化エラー", err);
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
