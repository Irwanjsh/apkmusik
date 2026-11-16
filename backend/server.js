const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi ke PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'musik_db',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
});

// Inisialisasi tabel jika belum ada
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lagu (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        duration VARCHAR(10) NOT NULL,
        genre VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed data awal jika tabel kosong
    const result = await pool.query('SELECT COUNT(*) FROM lagu');
    if (parseInt(result.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO lagu (title, artist, duration, genre) VALUES
        ('Lagu Populer 1', 'Penyanyi A', '03:45', 'Pop'),
        ('Lagu Favorit 2', 'Penyanyi B', '04:10', 'Rock'),
        ('Nada Santai 3', 'Penyanyi C', '02:55', 'Jazz'),
        ('Melodi Malam 4', 'Penyanyi D', '03:20', 'R&B'),
        ('Instrumen Otomatis 5', 'Penyanyi E', '05:00', 'Classical');
      `);
      console.log('Data awal berhasil di-seed');
    }

    console.log('Database siap digunakan');
  } catch (err) {
    console.error('Gagal inisialisasi database:', err.message);
    setTimeout(initDB, 3000); // Retry jika DB belum siap
  }
};

// =====================
// ROUTES / ENDPOINT API
// =====================

// GET / — Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend Pemutar Musik Offline berjalan!',
    version: '1.0.0',
  });
});

// GET /api/lagu — Ambil semua lagu
app.get('/api/lagu', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lagu ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/lagu/:id — Ambil lagu berdasarkan ID
app.get('/api/lagu/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lagu WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lagu tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/lagu — Tambah lagu baru
app.post('/api/lagu', async (req, res) => {
  const { title, artist, duration, genre } = req.body;
  if (!title || !artist || !duration) {
    return res.status(400).json({ success: false, message: 'title, artist, dan duration wajib diisi' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO lagu (title, artist, duration, genre) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, artist, duration, genre || 'Unknown']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/lagu/:id — Update lagu
app.put('/api/lagu/:id', async (req, res) => {
  const { title, artist, duration, genre } = req.body;
  try {
    const result = await pool.query(
      'UPDATE lagu SET title=$1, artist=$2, duration=$3, genre=$4 WHERE id=$5 RETURNING *',
      [title, artist, duration, genre, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lagu tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/lagu/:id — Hapus lagu
app.delete('/api/lagu/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM lagu WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lagu tidak ditemukan' });
    }
    res.json({ success: true, message: 'Lagu berhasil dihapus', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Jalankan server
app.listen(PORT, async () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  await initDB();
});
