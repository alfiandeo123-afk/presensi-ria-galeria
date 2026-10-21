const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: process.env.TIDB_PORT,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DB_NAME,
  ssl: { rejectUnauthorized: true }
});

// ================= LOGIN & KARYAWAN =================
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, user: { nama: "Yuli Darwati", role: "Manager" } });
  } else {
    res.status(401).json({ success: false, message: "Username atau password salah!" });
  }
});

app.get('/employees', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM employees ORDER BY id DESC');
  res.json(rows);
});

app.post('/employees', async (req, res) => {
  const { employee_id, nama, departemen } = req.body;
  try {
    await pool.query('INSERT INTO employees (employee_id, nama, departemen) VALUES (?, ?, ?)', [employee_id, nama, departemen]);
    res.json({ pesan: "Karyawan ditambahkan" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= IOT PRESENSI =================
app.post('/attendance/simulasi', async (req, res) => {
  const { employee_id, type } = req.body;
  try {
    const jam = new Date().getHours();
    let shift = 'Pagi';
    if (jam >= 14 && jam < 18) shift = 'Siang';
    if (jam >= 18) shift = 'Malam';

    await pool.query('INSERT INTO attendance (employee_id, type, shift) VALUES (?, ?, ?)', [employee_id, type, shift]);
    res.json({ pesan: `Simulasi Tap ${type} berhasil!` });
  } catch (err) { 
    console.error("Error Simulasi:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// Endpoint Ambil Log Presensi (Digabung per Hari)
app.get('/attendance', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.employee_id, e.nama, a.type, a.shift, a.timestamp 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.employee_id 
      ORDER BY a.timestamp ASC
    `);
    
    const grouped = {};
    rows.forEach(r => {
      const date = new Date(r.timestamp).toLocaleDateString('id-ID');
      const key = `${r.employee_id}_${date}`;
      const time = new Date(r.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');

      if (!grouped[key]) {
        grouped[key] = {
          id_log: `LOG-${r.id}`,
          nama: r.nama,
          shift: r.shift || 'Pagi',
          tanggal: date,
          jam_masuk: '-',
          jam_keluar: '-',
          status: 'Belum Absen'
        };
      }

      if (r.type === 'check_in') {
        if (grouped[key].jam_masuk === '-') {
          grouped[key].jam_masuk = time;
          if (parseInt(time.split(':')[0]) >= 8 && parseInt(time.split(':')[1]) > 10) {
            grouped[key].status = 'Terlambat';
          } else {
            grouped[key].status = 'Bekerja';
          }
        }
      } else if (r.type === 'check_out') {
        grouped[key].jam_keluar = time;
        grouped[key].status = 'Selesai';
      }
    });

    const result = Object.values(grouped).sort((a, b) => b.id_log.localeCompare(a.id_log));
    res.json(result);
  } catch (err) { 
    console.error("Error GET Attendance:", err);
    res.status(500).json({ error: err.message }); 
  }
});

// ================= DASHBOARD & LEMBUR =================
app.get('/dashboard-stats', async (req, res) => {
  try {
    const [totalEmp] = await pool.query('SELECT COUNT(*) as total FROM employees');
    const [hadir] = await pool.query(`SELECT COUNT(DISTINCT employee_id) as hadir FROM attendance WHERE DATE(timestamp) = CURDATE()`);
    const [lemburHariIni] = await pool.query(`SELECT COALESCE(SUM(TIME_TO_SEC(TIMEDIFF(jam_selesai, jam_mulai)))/3600, 0) as total_jam FROM lembur WHERE tanggal = CURDATE()`);
    const [lemburData] = await pool.query(`SELECT l.id, (SELECT SUM(jumlah) FROM transaksi t WHERE t.employee_id = l.employee_id AND DATE(t.timestamp) = l.tanggal) as total_transaksi FROM lembur l`);
    const anomali = lemburData.filter(l => l.total_transaksi === null || l.total_transaksi < 2).length;

    res.json({
      total_karyawan: totalEmp[0].total,
      hadir_hari_ini: hadir[0].hadir,
      jam_lembur_hari_ini: parseFloat(lemburHariIni[0].total_jam).toFixed(0),
      indikasi_anomali: anomali
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/lembur', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT l.*, e.nama, (SELECT SUM(jumlah) FROM transaksi t WHERE t.employee_id = l.employee_id AND DATE(t.timestamp) = l.tanggal) as total_transaksi
    FROM lembur l LEFT JOIN employees e ON l.employee_id = e.employee_id ORDER BY l.id DESC
  `);
  const hasil = rows.map(r => {
    let skor = r.total_transaksi === null ? 90 : (r.total_transaksi < 2 ? 50 : 10);
    let status = skor >= 80 ? 'Anomali' : skor >= 40 ? 'Perlu Review' : 'Normal';
    return { ...r, skor_anomali: skor, status_ai: status };
  });
  res.json(hasil);
});

// ================= SHIFT & PAYROLL =================
app.get('/shifts/generate', async (req, res) => {
  try {
    await pool.query('DELETE FROM jadwal_shift WHERE tanggal = CURDATE() + INTERVAL 1 DAY');
    const [employees] = await pool.query('SELECT employee_id FROM employees');
    const shifts = ['Pagi', 'Siang', 'Malam'];
    for (let i = 0; i < employees.length; i++) {
      const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
      await pool.query('INSERT INTO jadwal_shift (employee_id, tanggal, shift) VALUES (?, CURDATE() + INTERVAL 1 DAY, ?)', [employees[i].employee_id, randomShift]);
    }
    res.json({ pesan: "AI berhasil membuat shift otomatis!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/shifts', async (req, res) => {
  const [rows] = await pool.query(`SELECT s.*, e.nama FROM jadwal_shift s LEFT JOIN employees e ON s.employee_id = e.employee_id ORDER BY s.tanggal DESC`);
  res.json(rows);
});

app.get('/shifts/detail/:shiftName', async (req, res) => {
  const [rows] = await pool.query(`SELECT e.nama FROM jadwal_shift s JOIN employees e ON s.employee_id = e.employee_id WHERE s.shift = ? AND s.tanggal = CURDATE() + INTERVAL 1 DAY`, [req.params.shiftName]);
  res.json(rows);
});

app.get('/payroll', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.employee_id, e.nama, e.gaji_pokok, 
      COALESCE((SELECT SUM(TIME_TO_SEC(TIMEDIFF(jam_selesai, jam_mulai)))/3600 FROM lembur WHERE employee_id = e.employee_id), 0) as jam_lembur 
      FROM employees e
    `);
    const hasil = rows.map(r => {
      const upahLembur = parseFloat(r.jam_lembur) * 25000;
      const potongan = r.nama === 'Fathintun' ? 100000 : 0;
      return { ...r, upah_lembur: upahLembur, potongan: potongan, total_diterima: (r.gaji_pokok || 0) + upahLembur - potongan };
    });
    res.json(hasil);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: err.message }); 
  }
});

app.listen(3000, () => console.log('Backend jalan di port 3000'));