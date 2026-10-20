const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "example",
  database: process.env.DB_NAME || "bookshelf",
  waitForConnections: true,
  connectionLimit: 10,
});

const STATUSES = ["to-read", "reading", "finished"];

function validate(body) {
  const title = String(body.title || "").trim();
  const author = String(body.author || "").trim();
  const status = STATUSES.includes(body.status) ? body.status : "to-read";
  if (!title) return { error: "Title is required." };
  if (!author) return { error: "Author is required." };
  return { title, author, status };
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

// READ all
app.get("/api/books", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM books ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load books." });
  }
});

// CREATE
app.post("/api/books", async (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try {
    const [r] = await pool.query(
      "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
      [v.title, v.author, v.status]
    );
    res.status(201).json({ id: r.insertId, ...v });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not add the book." });
  }
});

// UPDATE
app.put("/api/books/:id", async (req, res) => {
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try {
    const [r] = await pool.query(
      "UPDATE books SET title=?, author=?, status=? WHERE id=?",
      [v.title, v.author, v.status, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: "Book not found." });
    res.json({ id: Number(req.params.id), ...v });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not update the book." });
  }
});

// DELETE
app.delete("/api/books/:id", async (req, res) => {
  try {
    const [r] = await pool.query("DELETE FROM books WHERE id=?", [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: "Book not found." });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not delete the book." });
  }
});

// Wait for MySQL, create the table, then start listening
async function start() {
  for (let i = 1; i <= 30; i++) {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        status ENUM('to-read','reading','finished') NOT NULL DEFAULT 'to-read',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      break;
    } catch (e) {
      console.log(`Waiting for database (${i}/30)...`);
      await new Promise((r) => setTimeout(r, 2000));
      if (i === 30) throw e;
    }
  }
  app.listen(3000, () => console.log("Backend listening on port 3000"));
}
start().catch((e) => { console.error(e); process.exit(1); });
