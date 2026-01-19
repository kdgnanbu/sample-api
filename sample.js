import express from "express";

const app = express();

app.get("/api/sample", (req, res) => {
  res.send("hello");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


