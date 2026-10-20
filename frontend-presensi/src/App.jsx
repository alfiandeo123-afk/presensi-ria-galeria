import { useEffect, useState } from 'react';
import axios from 'axios';
import { LayoutDashboard, Users, CalendarClock, Wallet, FileText, Search, X } from 'lucide-react';

function App() {
  const [activePage, setActivePage] = useState('karyawan'); // State untuk pindah halaman
  
  // State Karyawan
  const [karyawan, setKaryawan] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ employee_id: '', nama: '', departemen: '' });

  // State Presensi
  const [presensi, setPresensi] = useState([]);

  const fetchKaryawan = () => {
    axios.get('http://localhost:3000/employees').then(res => setKaryawan(res.data)).catch(err => console.log(err));
  };

  const fetchPresensi = () => {
    axios.get('http://localhost:3000/attendance').then(res => setPresensi(res.data)).catch(err => console.log(err));
  };

  useEffect(() => {
    fetchKaryawan();
    fetchPresensi();
  }, []);

  const handleSubmitKaryawan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/employees', formData);
      setIsModalOpen(false);
      setFormData({ employee_id: '', nama: '', departemen: '' });
      fetchKaryawan();
      alert('Karyawan berhasil ditambahkan!');
    } catch (err) {
      alert('Gagal menambah: ' + (err.response?.data?.error || err.message));
    }
  };

  // Fungsi untuk simulasi tap fingerprint (buat tes nanti)
  const simulasiTap = async () => {
    try {
      await axios.post('http://localhost:3000/attendance', { employee_id: 'EMP-001', type: 'check_in' });
      fetchPresensi(); // Refresh tabel
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1e392a] text-white flex flex-col shadow-xl z-10">
        <div className="p-6 text-2xl font-bold border-b border-green-800 tracking-wide">Ria Galeria</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActivePage('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activePage === 'dashboard' ? 'bg-green-800 text-white font-semibold' : 'text-gray-300 hover:bg-green-800'}`}><LayoutDashboard size={20} /> Dashboard</button>
          
          <button onClick={() => setActivePage('presensi')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activePage === 'presensi' ? 'bg-green-800 text-white font-semibold' : 'text-gray-300 hover:bg-green-800'}`}><CalendarClock size={20} /> Presensi</button>
          
          <button className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-green-800 transition"><FileText size={20} /> Lembur & Anomali</button>
          <button className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-green-800 transition"><Wallet size={20} /> Payroll</button>
          
          <button onClick={() => setActivePage('karyawan')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activePage === 'karyawan' ? 'bg-green-800 text-white font-semibold' : 'text-gray-300 hover:bg-green-800'}`}><Users size={20} /> Karyawan</button>
        </nav>
        <div className="p-4 border-t border-green-800 flex items-center gap-3 bg-[#15291e]">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1e392a] font-bold">Y</div>
          <div><p className="text-sm font-semibold">Yuli Darwati</p><p className="text-xs text-gray-400">Manager</p></div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {activePage === 'karyawan' ? 'Manajemen Karyawan' : activePage === 'presensi' ? 'Monitoring Presensi' : 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-500">Sen, 21 Oktober 2026</p>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* HALAMAN KARYAWAN */}
          {activePage === 'karyawan' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Cari Karyawan..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none" />
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#1e392a] text-white px-5 py-2 rounded-lg hover:bg-green-900 transition font-semibold shadow-md">+ Tambah Karyawan</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-4 font-semibold">ID Karyawan</th>
                    <th className="p-4 font-semibold">Nama Lengkap</th>
                    <th className="p-4 font-semibold">Departemen</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {karyawan.map((k) => (
                    <tr key={k.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-gray-600 font-medium">{k.employee_id}</td>
                      <td className="p-4 font-bold text-gray-800">{k.nama}</td>
                      <td className="p-4 text-gray-600">{k.departemen}</td>
                      <td className="p-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* HALAMAN PRESENSI */}
          {activePage === 'presensi' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Log Kehadiran (IoT)</h2>
                {/* Tombol simulasi buat tes IoT nanti */}
                <button onClick={simulasiTap} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold">
                  Tes Tap Fingerprint (EMP-001)
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                    <th className="p-4 font-semibold">ID Karyawan</th>
                    <th className="p-4 font-semibold">Nama</th>
                    <th className="p-4 font-semibold">Tipe Absen</th>
                    <th className="p-4 font-semibold">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {presensi.length === 0 ? (
                     <tr><td colSpan="4" className="text-center p-8 text-gray-400">Belum ada data presensi.</td></tr>
                  ) : (
                    presensi.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-gray-600 font-medium">{p.employee_id}</td>
                        <td className="p-4 font-bold text-gray-800">{p.nama || 'Tidak Dikenal'}</td>
                        <td className="p-4 text-gray-600">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.type === 'check_in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.type === 'check_in' ? 'MASUK' : 'KELUAR'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">{new Date(p.timestamp).toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* HALAMAN LAIN (DUMMY) */}
          {activePage === 'dashboard' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                Halaman Dashboard sedang dalam pengembangan.
             </div>
          )}

        </div>
      </main>

      {/* MODAL TAMBAH KARYAWAN (Sama seperti sebelumnya) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Tambah Karyawan Baru</h2>
            <form onSubmit={handleSubmitKaryawan} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">ID Karyawan</label>
                <input type="text" required placeholder="Contoh: EMP-005" value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1e392a]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Lengkap</label>
                <input type="text" required placeholder="Nama Karyawan" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1e392a]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Departemen</label>
                <select required value={formData.departemen} onChange={(e) => setFormData({...formData, departemen: e.target.value})} className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#1e392a]">
                  <option value="">Pilih Departemen...</option>
                  <option value="Kasir">Kasir</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Dapur">Dapur</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#1e392a] text-white py-2 rounded-lg font-semibold hover:bg-green-900 transition">Simpan Data</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;