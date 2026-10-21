const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const ExcelJS = require('exceljs');
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

// Fungsi Bantuan: Format Waktu WIB
const getWIBDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
const getWIBTime = (dateObj) => new Date(dateObj).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':'); // HH:mm:ss

// ================= 1. LOGIN & KARYAWAN =================
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

// ================= 2. IOT PRESENSI =================
app.post('/attendance/simulasi', async (req, res) => {
  const { employee_id, type } = req.body;
  try {
    const jam = new Date().getHours();
    let shift = 'Pagi';
    if (jam >= 14 && jam < 18) shift = 'Siang';
    if (jam >= 18) shift = 'Malam';

    await pool.query('INSERT INTO attendance (employee_id, type, shift) VALUES (?, ?, ?)', [employee_id, type, shift]);
    res.json({ pesan: `Simulasi Tap ${type} berhasil!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/attendance/reset', async (req, res) => {
  try {
    await pool.query(`DELETE FROM attendance WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+07:00')) = ?`, [getWIBDate()]);
    res.json({ pesan: "Data presensi hari ini berhasil di-reset" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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
      // Format tanggal & waktu WIB secara manual
      const dateStr = new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
      const timeStr = getWIBTime(r.timestamp);
      const key = `${r.employee_id}_${dateStr}`;

      if (!grouped[key]) {
        grouped[key] = {
          id_log: `LOG-${r.id}`,
          nama: r.nama,
          shift: r.shift || 'Pagi',
          tanggal: dateStr,
          jam_masuk: '-',
          jam_keluar: '-',
          status: 'Belum Absen'
        };
      }

      if (r.type === 'check_in') {
        if (grouped[key].jam_masuk === '-') {
          grouped[key].jam_masuk = timeStr;
          grouped[key].status = 'Bekerja';
        }
      } else if (r.type === 'check_out') {
        grouped[key].jam_keluar = timeStr;
        grouped[key].status = 'Selesai';
      }
    });

    // Filter HANYA untuk hari ini (WIB)
    const hariIni = getWIBDate();
    const result = Object.values(grouped)
      .filter(item => item.tanggal === hariIni)
      .sort((a, b) => b.id_log.localeCompare(a.id_log));
      
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= 3. DASHBOARD STATS =================
app.get('/dashboard-stats', async (req, res) => {
  try {
    const [totalEmp] = await pool.query('SELECT COUNT(*) as total FROM employees');
    const [hadir] = await pool.query(`SELECT COUNT(DISTINCT employee_id) as hadir FROM attendance WHERE DATE(CONVERT_TZ(timestamp, '+00:00', '+07:00')) = ?`, [getWIBDate()]);
    const [lemburHariIni] = await pool.query(`SELECT COALESCE(SUM(TIME_TO_SEC(TIMEDIFF(jam_selesai, jam_mulai)))/3600, 0) as total_jam FROM lembur WHERE tanggal = ?`, [getWIBDate()]);
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

// ================= 4. AI LEMBUR & EXPORT =================
app.get('/lembur', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.id, l.employee_id, e.nama, e.departemen, DATE_FORMAT(l.tanggal, '%Y-%m-%d') as tanggal,
             l.jam_mulai, l.jam_selesai, 
             (SELECT SUM(jumlah) FROM transaksi t WHERE t.employee_id = l.employee_id AND DATE(t.timestamp) = l.tanggal) as total_transaksi,
             (SELECT SUM(total_harga) FROM transaksi t WHERE t.employee_id = l.employee_id AND DATE(t.timestamp) = l.tanggal) as total_pendapatan
      FROM lembur l 
      LEFT JOIN employees e ON l.employee_id = e.employee_id 
      ORDER BY l.id DESC
    `);

    const hasil = rows.map(r => {
      const start = new Date(`1970-01-01T${r.jam_mulai}Z`);
      const end = new Date(`1970-01-01T${r.jam_selesai}Z`);
      const diffMins = Math.abs(end - start) / 60000;
      const jam = Math.floor(diffMins / 60);
      const menit = diffMins % 60;
      const durasi = `${jam}j ${menit}m`;

      let skor = 10;
      let status = 'Normal';
      if (!r.total_transaksi || r.total_transaksi === 0) { skor = 92; status = 'Lembur Fiktif'; }
      else if (r.total_transaksi <= 2) { skor = 46; status = 'Perlu Review'; }

      return {
        ...r,
        jam_normal: '08:00 - 16:00',
        durasi: durasi,
        total_pendapatan: r.total_pendapatan || 0,
        skor_anomali: skor,
        status_ai: status
      };
    });
    res.json(hasil);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/lembur/export', async (req, res) => {
  try {
    const { tanggal } = req.query;
    let query = `
      SELECT l.employee_id, e.nama, e.departemen, DATE_FORMAT(l.tanggal, '%d-%m-%Y') as tanggal, 
             l.jam_mulai, l.jam_selesai,
             (SELECT SUM(jumlah) FROM transaksi t WHERE t.employee_id = l.employee_id AND DATE(t.timestamp) = l.tanggal) as total_transaksi
      FROM lembur l 
      LEFT JOIN employees e ON l.employee_id = e.employee_id 
    `;
    const params = [];
    let namaFile = 'Laporan_Lembur_Semua.xlsx';

    if (tanggal) {
      query += ` WHERE l.tanggal = ?`;
      params.push(tanggal);
      namaFile = `Laporan_Lembur_${tanggal}.xlsx`;
    }
    query += ` ORDER BY l.id DESC`;

    const [rows] = await pool.query(query, params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Lembur');

    worksheet.columns = [
      { header: 'ID Karyawan', key: 'id', width: 15 },
      { header: 'Nama', key: 'nama', width: 25 },
      { header: 'Departemen', key: 'dept', width: 15 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Jam Mulai', key: 'mulai', width: 12 },
      { header: 'Jam Selesai', key: 'selesai', width: 12 },
      { header: 'Total Transaksi', key: 'trx', width: 15 },
      { header: 'Status AI', key: 'status', width: 20 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E392A' } };

    rows.forEach(r => {
      const trx = r.total_transaksi || 0;
      const status = trx === 0 ? 'Lembur Fiktif' : (trx <= 2 ? 'Perlu Review' : 'Normal');
      const jamMulai = r.jam_mulai ? r.jam_mulai.substring(0,5) : '-';
      const jamSelesai = r.jam_selesai ? r.jam_selesai.substring(0,5) : '-';
      worksheet.addRow({ id: r.employee_id, nama: r.nama, dept: r.departemen, tanggal: r.tanggal, mulai: jamMulai, selesai: jamSelesai, trx: trx, status: status });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${namaFile}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= 5. AI SHIFT PLANNER (MINGGUAN) =================
app.get('/shifts/generate', async (req, res) => {
  try {
    // Tentukan Senin minggu depan
    const today = new Date();
    const nextMonday = new Date(today.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7)));
    const startDateStr = nextMonday.toISOString().split('T')[0];
    
    // Hapus data 7 hari ke depan
    await pool.query('DELETE FROM jadwal_shift WHERE tanggal >= ? AND tanggal <= DATE_ADD(?, INTERVAL 6 DAY)', [startDateStr, startDateStr]);
    
    const [employees] = await pool.query('SELECT employee_id FROM employees');
    const shifts = ['Pagi', 'Siang', 'Malam', 'Libur'];
    
    // Loop 7 hari
    for (let d = 0; d < 7; d++) {
      const currentDate = new Date(nextMonday);
      currentDate.setDate(nextMonday.getDate() + d);
      const dateStr = currentDate.toISOString().split('T')[0];

      for (let i = 0; i < employees.length; i++) {
        // Acak shift
        const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
        await pool.query('INSERT INTO jadwal_shift (employee_id, tanggal, shift) VALUES (?, ?, ?)', [employees[i].employee_id, dateStr, randomShift]);
      }
    }
    res.json({ pesan: "AI berhasil membuat jadwal shift 1 minggu ke depan!" });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/shifts', async (req, res) => {
  const { startDate } = req.query;
  try {
    let query = `
      SELECT s.id, s.employee_id, e.nama, e.departemen, DATE_FORMAT(s.tanggal, '%Y-%m-%d') as tanggal, s.shift 
      FROM jadwal_shift s 
      LEFT JOIN employees e ON s.employee_id = e.employee_id 
    `;
    const params = [];
    if (startDate) {
      query += ` WHERE s.tanggal >= ? AND s.tanggal <= DATE_ADD(?, INTERVAL 6 DAY)`;
      params.push(startDate, startDate);
    }
    query += ` ORDER BY s.tanggal ASC, e.nama ASC`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Detail shift untuk Dashboard (Modal)
app.get('/shifts/detail/:shiftName', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.nama FROM jadwal_shift s 
      JOIN employees e ON s.employee_id = e.employee_id 
      WHERE s.shift = ? AND s.tanggal = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    `, [req.params.shiftName]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= 6. PAYROLL =================
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3000, () => console.log('Backend jalan di port 3000'));