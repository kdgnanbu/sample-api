import express from "express";
import cors from "cors";
import pg from "pg";
const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
 connectionString: "postgresql://cinema_user:Sx8YGHwzYN4HyEyOoSjLM6qAByvFetCw@dpg-d5o7absoud1c73ceeerg-a.singapore-postgres.render.com:5432/cinema_z5jh?sslmode=require",
  ssl: { rejectUnauthorized: false }, // Render DB は SSL 必須
});

// ----------------------------
// 日本語カスタムソート関数
// ----------------------------
function customJapaneseSort(a, b) {
  const getTypePriority = str => {
    if (!str) return 4;
    const ch = str[0];
    if (ch.match(/[一-龯]/)) return 0;
    if (ch.match(/[ぁ-ん]/)) return 1;
    if (ch.match(/[ァ-ヴー]/)) return 2;
    if (ch.match(/[A-Za-z]/)) return 3;
    return 4;
  };
  const pa = getTypePriority(a);
  const pb = getTypePriority(b);
  if (pa !== pb) return pa - pb;
  return a.localeCompare(b, 'ja');
}

// ----------------------------
// 俳優一覧取得
// ----------------------------
app.get("/api/actor", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.actor_no, a.name, a.date_of_birth, a.gender_no, g.gender,
             a.nationality_no, a.image_path, n.nationality, w.awards
      FROM actor a
      LEFT JOIN awards w ON a.actor_no = w.actor_no
      LEFT JOIN gender g ON a.gender_no = g.gender_no
      LEFT JOIN nationality n ON a.nationality_no = n.nationality_no
    `);

    const actors: any = {};
    rows.forEach(r => {
      if (!actors[r.actor_no]) {
        actors[r.actor_no] = {
          actor_no: r.actor_no,
          name: r.name,
          date_of_birth: r.date_of_birth ? r.date_of_birth.toISOString().split("T")[0] : null,
          gender_no: r.gender_no,
          gender: r.gender,
          nationality_no: r.nationality_no,
          image_path: r.image_path,
          nationality: r.nationality,
          awards: r.awards ? [r.awards] : [],
          movies: [],
          movieDetails: [],
        };
      } else if (r.awards) actors[r.actor_no].awards.push(r.awards);
    });

    const actorList = Object.values(actors);

    // actor_no一覧
    const actorNos = actorList.map(a => a.actor_no);
    if (actorNos.length > 0) {
      const { rows: movieRows } = await pool.query(`
        SELECT ma.actor_no, m.movie_no, m.title, c.category, a.age_limit
        FROM movie_actor ma
        JOIN movie m ON ma.movie_no = m.movie_no
        JOIN category c ON m.category_no = c.category_no
        JOIN age_limit a ON m.age_limit_no = a.age_limit_no
        WHERE ma.actor_no = ANY($1::int[])
      `, [actorNos]);

      const movieMap: any = {};
      movieRows.forEach(r => {
        if (!movieMap[r.movie_no]) {
          movieMap[r.movie_no] = { movie_no: r.movie_no, title: r.title, category: r.category, age_limit: r.age_limit };
        }
      });

      actorList.forEach(actor => {
        actor.movieDetails = movieRows
          .filter(r => r.actor_no === actor.actor_no)
          .map(r => movieMap[r.movie_no]);
      });
    }

    actorList.sort((a, b) => customJapaneseSort(a.name, b.name));
    res.json(actorList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------
// 映画一覧
// ----------------------------
app.get("/api/movie", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.movie_no, m.title, m.image_path, c.category, m.relese_date, a.age_limit
      FROM movie m
      JOIN category c ON m.category_no = c.category_no
      JOIN age_limit a ON m.age_limit_no = a.age_limit_no
    `);

    const movies: any = {};
    rows.forEach(r => {
      if (!movies[r.movie_no]) {
        movies[r.movie_no] = {
          movie_no: r.movie_no,
          title: r.title,
          image_path: r.image_path,
          category: r.category,
          relese_date: r.relese_date ? r.relese_date.toISOString().split("T")[0] : null,
          age_limit: r.age_limit,
          actors: [],
        };
      }
    });

    const movieList = Object.values(movies);
    const movieIds = movieList.map(m => m.movie_no);
    if (movieIds.length > 0) {
      const { rows: actorRows } = await pool.query(`
        SELECT movie_no, actor_no FROM movie_actor WHERE movie_no = ANY($1::int[])
      `, [movieIds]);
      actorRows.forEach(r => {
        if (movies[r.movie_no]) movies[r.movie_no].actors.push(r.actor_no);
      });
    }

    movieList.sort((a,b) => customJapaneseSort(a.title, b.title));
    res.json(movieList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------
// 俳優検索（POST）
// ----------------------------
app.post("/api/actor/search", async (req, res) => {
  const { keyword, gender, ageRange } = req.body;

  let query = `
    SELECT a.actor_no, a.name, a.date_of_birth, a.gender_no, g.gender,
           a.nationality_no, a.image_path, n.nationality, w.awards
    FROM actor a
    LEFT JOIN awards w ON a.actor_no = w.actor_no
    LEFT JOIN gender g ON a.gender_no = g.gender_no
    LEFT JOIN nationality n ON a.nationality_no = n.nationality_no
    WHERE 1=1
  `;
  const values = [];
  let idx = 1;

  if (keyword) {
    query += ` AND a.name ILIKE $${idx++}`;
    values.push(`%${keyword}%`);
  }
  if (gender) {
    query += ` AND a.gender_no = $${idx++}`;
    values.push(gender);
  }
  if (ageRange) {
    const ranges = { "10s":[10,19], "20s":[20,29], "30s":[30,39], "40s":[40,49], "50s":[50,59], "60s":[60,200] };
    const [min, max] = ranges[ageRange];
    query += ` AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.date_of_birth)) BETWEEN $${idx++} AND $${idx++}`;
    values.push(min, max);
  }

  try {
    const { rows } = await pool.query(query, values);
    const actors = {};
    rows.forEach(r => {
      if (!actors[r.actor_no]) {
        actors[r.actor_no] = {
          actor_no: r.actor_no,
          name: r.name,
          date_of_birth: r.date_of_birth ? r.date_of_birth.toISOString().split("T")[0] : null,
          gender_no: r.gender_no,
          gender: r.gender,
          nationality_no: r.nationality_no,
          image_path: r.image_path,
          nationality: r.nationality,
          awards: [],
          movies: [],
        };
      }
      if (r.awards) actors[r.actor_no].awards.push(r.awards);
    });

    const actorList = Object.values(actors);
    actorList.sort((a, b) => customJapaneseSort(a.name, b.name));
    res.json(actorList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------
// 映画一覧取得
// ----------------------------

// ----------------------------
// 映画検索（POST）
// ----------------------------
app.post("/api/movie/search", async (req, res) => {
  const { keyword, categories, genres } = req.body;
  const values = [];
  let idx = 1;
  let query = `
    SELECT m.movie_no, m.title, m.image_path, c.category, m.relese_date, a.age_limit
    FROM movie m
    JOIN category c ON m.category_no = c.category_no
    JOIN age_limit a ON m.age_limit_no = a.age_limit_no
    WHERE 1=1
  `;
  if (keyword) {
    query += ` AND m.title ILIKE $${idx++}`;
    values.push(`%${keyword}%`);
  }
  if (categories?.length) {
    query += ` AND m.category_no = ANY($${idx++}::int[])`;
    values.push(categories);
  }
  if (genres?.length) {
    query += ` AND m.movie_no IN (
      SELECT movie_no FROM movie_genre WHERE genre_no = ANY($${idx++}::int[])
    )`;
    values.push(genres);
  }

  try {
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------
// カテゴリ・ジャンル取得
// ----------------------------
app.get("/api/movie/categories", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT category_no, category FROM category");
    res.json(rows.map(r => ({ id: r.category_no, name: r.category })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/movie/genre", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT genre_no, genre FROM genre");
    res.json(rows.map(r => ({ id: r.genre_no, name: r.genre })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ----------------------------
app.listen(process.env.PORT || 3000, () =>
  console.log(`Server running on port ${process.env.PORT || 3000}`)
);








