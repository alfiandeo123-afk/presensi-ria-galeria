import { useEffect, useState } from 'react';
import axios from 'axios';
import { LayoutDashboard, Users, CalendarClock, Wallet, FileText, X, Upload, ChevronDown, LogOut } from 'lucide-react';

// Import Halaman
import Dashboard from './pages/Dashboard';
import Presensi from './pages/Presensi';
import Lembur from './pages/Lembur';
import Shift from './pages/Shift';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activePage, setActivePage] = useState('dashboard'); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // States Data
  const [stats, setStats] = useState({ total_karyawan: 0, hadir_hari_ini: 0, jam_lembur_hari_ini: 0, indikasi_anomali: 0 });
  const [karyawan, setKaryawan] = useState([]);
  const [presensi, setPresensi] = useState([]);
  const [lembur, setLembur] = useState([]);
  const [payroll, setPayroll] = useState([]);
  
  // States Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ employee_id: '', nama: '', departemen: '' });

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftDetail, setShiftDetail] = useState({ shift: '', karyawan: [] });

  // Fungsi Fetch Data
  const fetchAll = () => {
    axios.get('http://localhost:3000/dashboard-stats').then(res => setStats(res.data)).catch(console.log);
    axios.get('http://localhost:3000/employees').then(res => setKaryawan(res.data)).catch(console.log);
    axios.get('http://localhost:3000/attendance').then(res => setPresensi(res.data)).catch(console.log);
    axios.get('http://localhost:3000/lembur').then(res => setLembur(res.data)).catch(console.log);
    axios.get('http://localhost:3000/payroll').then(res => setPayroll(res.data)).catch(console.log);
  };

  useEffect(() => { if(isLoggedIn) fetchAll(); }, [activePage, isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/login', { username, password });
      if (res.data.success) { setIsLoggedIn(true); setLoginError(''); }
    } catch (err) { setLoginError(err.response?.data?.message || 'Error'); }
  };

  const handleLogout = (e) => { 
    e.preventDefault(); 
    setIsLoggedIn(false); 
    setIsProfileOpen(false); 
  };

  const handleSubmitKaryawan = async (e) => { 
    e.preventDefault(); 
    await axios.post('http://localhost:3000/employees', formData); 
    setIsModalOpen(false); 
    setFormData({ employee_id: '', nama: '', departemen: '' });
    fetchAll(); 
    alert('Karyawan berhasil ditambahkan!');
  };
  
  const simulasiIoT = async (type) => {
    try {
      await axios.post('http://localhost:3000/attendance/simulasi', { employee_id: 'EMP-001', type });
      fetchAll(); 
      alert(`Simulasi Tap ${type} Berhasil!`);
    } catch (err) { alert('Gagal: ' + (err.response?.data?.error || err.message)); }
  };

  const resetPresensi = async () => {
    if(window.confirm("Hapus semua data presensi hari ini untuk testing?")) {
      try {
        await axios.get('http://localhost:3000/attendance/reset');
        fetchAll();
        alert('Data presensi hari ini berhasil dihapus!');
      } catch (err) { alert('Gagal reset: ' + err.message); }
    }
  };

  const generateAI = async () => {
    try { 
      await axios.get('http://localhost:3000/shifts/generate'); 
      fetchAll(); 
      alert('AI berhasil membuat jadwal shift mingguan!'); 
    } catch (err) { alert('Gagal: ' + err.message); }
  };

  const showShiftDetail = async (shiftName) => {
    try {
      const res = await axios.get(`http://localhost:3000/shifts/detail/${shiftName}`);
      setShiftDetail({ shift: shiftName, karyawan: res.data });
      setIsShiftModalOpen(true);
    } catch (err) { 
      console.log(err); 
      alert("Gagal memuat detail shift");
    }
  };

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });

  // ==========================================
  // HALAMAN LOGIN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e392a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/leaves.png')]"></div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl w-96 z-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-sm text-gray-300 mb-6">Silahkan masuk ke sistem manajemen</p>
          {loginError && <p className="text-red-400 text-sm mb-4 bg-red-900/30 p-2 rounded">{loginError}</p>}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-white text-gray-800 rounded-lg focus:outline-none" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-white text-gray-800 rounded-lg focus:outline-none" required />
            <button type="submit" className="w-full bg-[#15291e] text-white py-3 rounded-lg font-semibold hover:bg-[#0f1f16]">Sign in</button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // HALAMAN UTAMA
  // ==========================================
  return (
    <div className="flex h-screen bg-[#f4f7f6] font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1e392a] text-white flex flex-col shadow-xl z-20">
        <div className="p-8 flex flex-col items-center border-b border-green-800">
          <h1 className="text-3xl font-serif font-bold tracking-widest text-white">Ria</h1>
          <p className="text-[10px] tracking-[0.3em] text-gray-300 mt-1">GALERIA</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'presensi', icon: CalendarClock, label: 'Presensi' },
            { id: 'lembur', icon: FileText, label: 'Lembur & Anomali' },
            { id: 'shift', icon: CalendarClock, label: 'Jadwal Shift' },
            { id: 'payroll', icon: Wallet, label: 'Payroll' },
            { id: 'karyawan', icon: Users, label: 'Karyawan' },
          ].map((menu) => (
            <button key={menu.id} onClick={() => setActivePage(menu.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activePage === menu.id ? 'bg-white/10 font-semibold text-white' : 'text-gray-300 hover:bg-white/5'}`}>
              <menu.icon size={20} /> {menu.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-green-800 flex items-center gap-3 bg-[#15291e]">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-[#1e392a] font-bold">Y</div>
          <div><p className="text-sm font-semibold">Yuli Darwati</p><p className="text-xs text-gray-400">Manager</p></div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b z-30">
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded"><div className="w-5 h-0.5 bg-gray-600 mb-1"></div><div className="w-5 h-0.5 bg-gray-600 mb-1"></div><div className="w-5 h-0.5 bg-gray-600"></div></button>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> API Connected</span>
            <div className="border border-gray-200 px-3 py-1 rounded text-xs text-gray-600 flex items-center gap-2 font-semibold"><CalendarClock size={14}/> {today}</div>
            <button onClick={resetPresensi} className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-semibold hover:bg-red-200 border border-red-200">Reset Tes</button>
          </div>
          
          <div className="relative">
            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">Y</div>
              <div className="text-right"><p className="text-sm font-bold text-gray-800">Yuli Darwati</p><p className="text-xs text-gray-500">Manager</p></div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activePage === 'dashboard' && <Dashboard stats={stats} presensi={presensi} lembur={lembur} onGenerateAI={generateAI} onShowShiftDetail={showShiftDetail} onNavigate={setActivePage} />}
          
          {activePage === 'presensi' && <Presensi dataPresensi={presensi} onSimulasiTap={simulasiIoT} />}
          
          {activePage === 'lembur' && <Lembur dataLembur={lembur} />}
          
          {activePage === 'shift' && <Shift />}

          {activePage === 'payroll' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-bold text-lg mb-4">Payroll Otomatis</h2>
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 border-b"><th className="p-4">Nama</th><th className="p-4">Gaji Pokok</th><th className="p-4">Lembur</th><th className="p-4">Potongan</th><th className="p-4">Total</th></tr></thead>
                <tbody>
                  {payroll.map((p, i) => (
                    <tr key={i} className="border-b"><td className="p-4 font-bold">{p.nama}</td><td className="p-4">Rp {p.gaji_pokok.toLocaleString()}</td><td className="p-4 text-green-600">+{p.upah_lembur.toLocaleString()}</td><td className="p-4 text-red-600">-{p.potongan.toLocaleString()}</td><td className="p-4 font-bold text-[#1e392a]">Rp {p.total_diterima.toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activePage === 'karyawan' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between mb-4">
                <input type="text" placeholder="Cari Karyawan..." className="border p-2 rounded-lg w-64" />
                <div className="flex gap-2">
                  <button className="border border-[#1e392a] text-[#1e392a] px-4 py-2 rounded-lg flex items-center gap-2"><Upload size={18}/> Import Excel</button>
                  <button onClick={() => setIsModalOpen(true)} className="bg-[#1e392a] text-white px-4 py-2 rounded-lg">+ Tambah Manual</button>
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 border-b"><th className="p-4">ID</th><th className="p-4">Nama</th><th className="p-4">Departemen</th></tr></thead>
                <tbody>
                  {karyawan.map(k => (
                    <tr key={k.id} className="border-b"><td className="p-4">{k.employee_id}</td><td className="p-4 font-bold">{k.nama}</td><td className="p-4">{k.departemen}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL TAMBAH KARYAWAN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-96 p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-4">Tambah Karyawan</h2>
            <form onSubmit={handleSubmitKaryawan} className="space-y-4">
              <input type="text" placeholder="ID (EMP-005)" required className="w-full border p-2 rounded" onChange={(e) => setFormData({...formData, employee_id: e.target.value})} />
              <input type="text" placeholder="Nama Lengkap" required className="w-full border p-2 rounded" onChange={(e) => setFormData({...formData, nama: e.target.value})} />
              <input type="text" placeholder="Departemen" required className="w-full border p-2 rounded" onChange={(e) => setFormData({...formData, departemen: e.target.value})} />
              <button type="submit" className="w-full bg-[#1e392a] text-white py-2 rounded-lg">Simpan</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL SHIFT */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-80 p-6 relative">
            <button onClick={() => setIsShiftModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500"><X size={20}/></button>
            <h2 className="text-lg font-bold mb-1 text-gray-800">Karyawan Shift {shiftDetail.shift}</h2>
            <ul className="space-y-2 mt-4">
              {shiftDetail.karyawan.length > 0 ? shiftDetail.karyawan.map((k, i) => (
                <li key={i} className="bg-gray-50 p-2 rounded border text-sm font-semibold text-gray-700">{k.nama}</li>
              )) : <p className="text-sm text-gray-400">Belum ada jadwal.</p>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;