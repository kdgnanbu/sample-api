import express from "express";
import { initDB } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

await initDB();

app.get("/", (req, res) => {
  res.send("Cinema API running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

