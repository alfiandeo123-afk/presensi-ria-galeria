import { Users, AlertTriangle, TrendingUp, LayoutDashboard } from 'lucide-react';

export default function Dashboard({ stats, presensi, lembur, onGenerateAI, onShowShiftDetail, onNavigate }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Selamat Pagi, Bu Yuli</h1>
        <p className="text-gray-500 text-sm mt-1">Berikut ringkasan operasional Ria Galeria hari ini.</p>
      </div>

      {/* 3 Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#e5e7eb] rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-300">
          <Users size={40} className="text-gray-600" />
          <div><p className="text-sm text-gray-600 font-semibold">Karyawan Hadir</p><h3 className="text-2xl font-bold text-gray-800">{stats.hadir_hari_ini} <span className="text-sm font-normal">dari {stats.total_karyawan} Karyawan</span></h3></div>
        </div>
        <div className="bg-[#fef3c7] rounded-xl p-4 flex items-center gap-4 shadow-sm border border-yellow-200">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white"><TrendingUp size={20}/></div>
          <div><p className="text-sm text-yellow-700 font-semibold">Total Jam Lembur</p><h3 className="text-2xl font-bold text-yellow-800">{stats.jam_lembur_hari_ini} Jam <span className="text-sm font-normal">Hari Ini</span></h3></div>
        </div>
        <div className="bg-[#fce7f3] rounded-xl p-4 flex items-center gap-4 shadow-sm border border-pink-200">
          <AlertTriangle size={40} className="text-red-500" />
          <div><p className="text-sm text-red-700 font-semibold">Indikasi Lembur Fiktif</p><h3 className="text-2xl font-bold text-red-800">{stats.indikasi_anomali} <span className="text-sm font-normal">Perlu Perhatian</span></h3></div>
        </div>
      </div>

      {/* Grafik & AI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-700">Perbandingan Omzet Kasir vs Jam Lembur</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Bulan Ini</span>
          </div>
          <div className="flex items-end justify-between h-40 gap-1 mt-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between text-gray-200 text-xs">
              <div className="border-b w-full"></div><div className="border-b w-full"></div><div className="border-b w-full"></div><div className="border-b w-full"></div>
            </div>
            {[40, 70, 45, 90, 60, 80, 50, 75, 95, 65, 85, 40].map((h, i) => (
              <div key={i} className="flex flex-col items-center justify-end gap-0.5 w-full relative z-10">
                <div className="w-full bg-[#1e392a] rounded-t-sm" style={{ height: `${h}%` }}></div>
                <div className="w-full bg-yellow-400 rounded-b-sm" style={{ height: `${h/2}%` }}></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        <div className="bg-[#e5e7eb] rounded-xl p-6 shadow-sm border border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-black text-white p-1 rounded"><LayoutDashboard size={16}/></div>
            <h3 className="font-bold text-gray-800">AI Shift Planner</h3>
          </div>
          <p className="text-xs text-gray-600 mb-4">Optimalkan kebutuhan karyawan berdasarkan pola operasional restoran.</p>
          <button onClick={onGenerateAI} className="w-full bg-[#1e392a] text-white py-2 rounded-lg font-semibold mb-6 flex items-center justify-center gap-2 hover:bg-green-900 transition">
            <TrendingUp size={16} /> Generate Shift Otomatis
          </button>
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">Prediksi Kebutuhan (Klik Detail)</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div onClick={() => onShowShiftDetail('Pagi')} className="bg-white p-2 rounded shadow-sm border cursor-pointer hover:bg-gray-50 hover:border-[#1e392a] transition">
                <span className="text-lg">☀️</span><p className="font-bold text-gray-800 mt-1">Pagi</p><p className="text-gray-500">08.00 - 16.00</p>
              </div>
              <div onClick={() => onShowShiftDetail('Siang')} className="bg-white p-2 rounded shadow-sm border cursor-pointer hover:bg-gray-50 hover:border-[#1e392a] transition">
                <span className="text-lg">🌤️</span><p className="font-bold text-gray-800 mt-1">Siang</p><p className="text-gray-500">14.00 - 22.00</p>
              </div>
              <div onClick={() => onShowShiftDetail('Malam')} className="bg-white p-2 rounded shadow-sm border cursor-pointer hover:bg-gray-50 hover:border-[#1e392a] transition">
                <span className="text-lg">🌙</span><p className="font-bold text-gray-800 mt-1">Malam</p><p className="text-gray-500">18.00 - 23.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Presensi & Perhatian */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Users size={16}/> Presensi Real-Time</h3>
            <button onClick={() => onNavigate('presensi')} className="text-xs text-gray-500 border px-2 py-1 rounded">Lihat Semua</button>
          </div>
          <table className="w-full text-left text-xs">
            <thead><tr className="text-gray-400 border-b"><th className="pb-2">ID LOG</th><th className="pb-2">Nama</th><th className="pb-2">Jam</th><th className="pb-2">Status</th></tr></thead>
            <tbody>
              {presensi.length > 0 ? presensi.slice(0,5).map(p => (
                <tr key={p.id} className="border-b"><td className="py-2">LOG-{p.id}</td><td className="font-semibold text-gray-800">{p.nama}</td><td>{new Date(p.timestamp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</td><td><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px]">Masuk</span></td></tr>
              )) : <tr><td colSpan="4" className="text-center py-4 text-gray-400">Belum ada data hari ini</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-[#fce7f3] rounded-xl p-4 shadow-sm border border-pink-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={18}/> Perlu Perhatian</h3>
            <button onClick={() => onNavigate('lembur')} className="text-xs text-red-600 font-semibold">Lihat Detail →</button>
          </div>
          <p className="text-xs text-red-700 mb-4">{stats.indikasi_anomali} Indikasi Lembur Fiktif terdeteksi oleh AI.</p>
          
          {lembur.filter(l => l.status_ai !== 'Normal').slice(0,1).map((l, i) => (
            <div key={i} className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm mb-2 border border-pink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">{l.nama ? l.nama.charAt(0) : '?'}</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{l.nama || 'Unknown'} <span className="bg-red-500 text-white text-[9px] px-1 rounded ml-1">Fiktif</span></p>
                  <p className="text-xs text-gray-500">Aktivitas: {l.total_transaksi || 0} Transaksi</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}