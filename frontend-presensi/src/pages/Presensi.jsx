import { useState } from 'react';
import { Search, Calendar, FileText, Users, Fingerprint, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Presensi({ dataPresensi, onSimulasiTap }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Logika Filter
  const filteredData = dataPresensi.filter(p => {
    const matchSearch = p.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchShift = filterShift === 'Semua' || p.shift === filterShift;
    const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;
    return matchSearch && matchShift && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Presensi</h1>
          <p className="text-gray-500 text-sm mt-1">Monitoring dan Kehadiran Karyawan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSimulasiTap('check_in')} className="bg-[#1e392a] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-green-900"><Fingerprint size={16}/> Tap Masuk</button>
          <button onClick={() => onSimulasiTap('check_out')} className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-yellow-600"><Fingerprint size={16}/> Tap Keluar</button>
        </div>
      </div>

      <div className="bg-[#e5e7eb] p-6 rounded-xl border border-gray-300 shadow-sm">
        {/* Baris Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" placeholder="Cari Karyawan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e392a]" />
          </div>
          <div className="flex items-center border border-gray-300 rounded-lg px-3 bg-white">
            <Calendar size={16} className="text-gray-500 mr-2" />
            <select className="bg-transparent text-sm text-gray-700 focus:outline-none"><option>Tanggal</option></select>
          </div>
          <div className="flex items-center border border-gray-300 rounded-lg px-3 bg-white">
            <FileText size={16} className="text-gray-500 mr-2" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent text-sm text-gray-700 focus:outline-none">
              <option value="Semua">Status</option>
              <option value="Normal">Normal</option>
              <option value="Fiktif">Fiktif</option>
            </select>
          </div>
          <div className="flex items-center border border-gray-300 rounded-lg px-3 bg-white">
            <Users size={16} className="text-gray-500 mr-2" />
            <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)} className="bg-transparent text-sm text-gray-700 focus:outline-none">
              <option value="Semua">Shift</option>
              <option value="Pagi">Pagi</option>
              <option value="Siang">Siang</option>
              <option value="Malam">Malam</option>
            </select>
          </div>
        </div>

        {/* Tabel Presensi */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#d1d5db] text-gray-700">
                <th className="p-4 font-semibold">ID LOG</th>
                <th className="p-4 font-semibold">NAMA</th>
                <th className="p-4 font-semibold">JAM MASUK</th>
                <th className="p-4 font-semibold">JAM KELUAR</th>
                <th className="p-4 font-semibold">STATUS</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
                            {filteredData.length > 0 ? filteredData.map((p, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{p.id_log}</td>
                  <td className="p-4 font-semibold text-gray-800">{p.nama}</td>
                  <td className="p-4 text-gray-600">{p.jam_masuk}</td>
                  <td className="p-4 text-gray-600">{p.jam_keluar}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      p.status === 'Selesai' ? 'bg-green-100 text-green-700 border-green-300' : 
                      p.status === 'Bekerja' ? 'bg-blue-100 text-blue-700 border-blue-300' : 
                      p.status === 'Terlambat' ? 'bg-red-100 text-red-700 border-red-300' : 
                      'bg-gray-100 text-gray-600 border-gray-300'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400"><ChevronRight size={18}/></td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center p-8 text-gray-500">Data tidak ditemukan. Klik "Tap Masuk" untuk tes IoT.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Static */}
        <div className="flex justify-center items-center gap-2 mt-6">
          <button className="p-1 text-gray-500 hover:bg-white rounded"><ChevronLeft size={20}/></button>
          <button className="w-8 h-8 rounded-full bg-[#1e392a] text-white flex items-center justify-center font-semibold">1</button>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-100">2</button>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-100">3</button>
          <button className="p-1 text-gray-500 hover:bg-white rounded"><ChevronRight size={20}/></button>
        </div>
      </div>
    </div>
  );
}