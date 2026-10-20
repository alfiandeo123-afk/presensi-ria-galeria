const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi ke TiDB
const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: process.env.TIDB_PORT,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DB_NAME,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10,
});

// 1. Tes Koneksi
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS hasil');
    res.json({ sukses: true, pesan: "Database terhubung!", hasil: rows[0].hasil });
  } catch (err) {
    res.status(500).json({ sukses: false, error: err.message });
  }
});

// 2. Ambil Semua Karyawan (GET)
app.get('/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Tambah Karyawan Baru (POST) -> INI FITUR BARU KITA
app.post('/employees', async (req, res) => {
  const { employee_id, nama, departemen } = req.body;
  try {
    await pool.query(
      'INSERT INTO employees (employee_id, nama, departemen) VALUES (?, ?, ?)',
      [employee_id, nama, departemen]
    );
    res.json({ pesan: "Karyawan berhasil ditambahkan!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk menerima data dari IoT Fingerprint
app.post('/attendance', async (req, res) => {
  const { employee_id, type } = req.body;
  try {
    await pool.query(
      'INSERT INTO attendance (employee_id, type) VALUES (?, ?)',
      [employee_id, type]
    );
    res.json({ pesan: "Data presensi berhasil dicatat!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint untuk melihat semua data presensi (untuk frontend)
app.get('/attendance', async (req, res) => {
  try {
    // Menggabungkan tabel attendance dengan employees untuk mendapatkan nama
    const [rows] = await pool.query(`
      SELECT a.id, a.employee_id, e.nama, a.type, a.timestamp 
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      ORDER BY a.timestamp DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Nyalakan server
app.listen(3000, () => {
  console.log('Server backend jalan di http://localhost:3000');
});