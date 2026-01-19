import express from "express";
import cors from "cors";

const app = express();

// 全てのオリジンからのアクセスを許可（開発用）
app.use(cors());

app.get("/api/sample", (req, res) => {
  res.send("hello");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
