import { useState } from 'react';
import { Calendar, Download, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Lembur({ dataLembur }) {
  const [filterDept, setFilterDept] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterDate, setFilterDate] = useState('');

  // Logika Filter
  const filteredData = dataLembur.filter(l => {
    const matchDept = filterDept === 'Semua' || l.departemen === filterDept;
    const matchStatus = filterStatus === 'Semua' || l.status_ai === filterStatus;
    const matchDate = filterDate === '' || (l.tanggal && l.tanggal.split('T')[0] === filterDate);
    return matchDept && matchStatus && matchDate;
  });

  // Fungsi Download Laporan (Dinamis Sesuai Tanggal)
  const handleExport = () => {
    // Jika filterDate ada isinya, kirim sebagai parameter URL
    const url = filterDate 
      ? `http://localhost:3000/lembur/export?tanggal=${filterDate}` 
      : 'http://localhost:3000/lembur/export';
      
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Monitoring Lembur & Anomali</h1>
        <p className="text-gray-500 text-sm mt-1">Menganalisis data lembur karyawan, mendeteksi indikasi lembur fiktif, serta meninjau bukti aktivitas yang terkait.</p>
      </div>

      {/* Bar Filter Atas */}
      <div className="bg-[#2b4536] p-3 rounded-lg flex flex-wrap justify-between items-center gap-2">
        <div className="flex gap-2">
          
          {/* Date Picker */}
          <div className="bg-[#c5d3c9] text-[#1e392a] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 hover:bg-white transition cursor-pointer relative">
            <Calendar size={14} />
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-[#1e392a] font-semibold"
              title="Pilih Tanggal"
            />
          </div>

          {/* Filter Departemen */}
          <select 
            value={filterDept} 
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-[#c5d3c9] text-[#1e392a] px-3 py-1.5 rounded text-xs font-semibold focus:outline-none cursor-pointer hover:bg-white transition"
          >
            <option value="Semua">Semua Departemen</option>
            <option value="Kasir">Kasir</option>
            <option value="Front Office">Front Office</option>
            <option value="Dapur">Dapur</option>
          </select>

          {/* Filter Status */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#c5d3c9] text-[#1e392a] px-3 py-1.5 rounded text-xs font-semibold focus:outline-none cursor-pointer hover:bg-white transition"
          >
            <option value="Semua">Semua Status</option>
            <option value="Normal">Normal</option>
            <option value="Perlu Review">Perlu Review</option>
            <option value="Lembur Fiktif">Lembur Fiktif</option>
          </select>
        </div>

        <button onClick={handleExport} className="bg-[#1a2c22] text-white border border-gray-500 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 hover:bg-black transition">
          <Download size={14} /> Eksport Laporan
        </button>
      </div>

      {/* Tabel Utama */}
      <div className="bg-[#8fa898] p-4 rounded-xl shadow-inner">
        <div className="bg-white rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#e5e7eb] text-gray-700 border-b">
                <th className="p-3 font-bold">ID</th>
                <th className="p-3 font-bold">NAMA</th>
                <th className="p-3 font-bold">DEPARTEMEN</th>
                <th className="p-3 font-bold">JAM NORMAL</th>
                <th className="p-3 font-bold">JAM LEMBUR</th>
                <th className="p-3 font-bold">DURASI</th>
                <th className="p-3 font-bold">AKTIVITAS TRANSAKSI</th>
                <th className="p-3 font-bold text-center">SKOR<br/>ANOMALI</th>
                <th className="p-3 font-bold">STATUS</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((l, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className={`p-3 font-bold ${l.status_ai === 'Lembur Fiktif' ? 'text-red-500' : 'text-gray-600'}`}>{l.employee_id}</td>
                  <td className={`p-3 font-bold ${l.status_ai === 'Lembur Fiktif' ? 'text-red-500' : 'text-gray-800'}`}>{l.nama}</td>
                  <td className="p-3 text-gray-600">{l.departemen || 'Kasir'}</td>
                  <td className="p-3 text-gray-600">{l.jam_normal}</td>
                  {/* Pengaman format jam */}
                  <td className="p-3 text-gray-600">
                    {l.jam_mulai ? l.jam_mulai.substring(0,5) : '-'} - {l.jam_selesai ? l.jam_selesai.substring(0,5) : '-'}
                  </td>
                  <td className="p-3 font-semibold text-gray-700">{l.durasi}</td>
                  <td className="p-3 text-gray-600">
                    {l.total_transaksi || 0} Transaksi <br/>
                    <span className="text-[10px] text-gray-400">(Rp {(l.total_pendapatan || 0).toLocaleString('id-ID')})</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-[10px] ${
                      l.skor_anomali >= 80 ? 'bg-red-500' : 
                      l.skor_anomali >= 40 ? 'bg-yellow-400' : 
                      'bg-green-500'
                    }`}>
                      {l.skor_anomali}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      l.status_ai === 'Lembur Fiktif' ? 'bg-red-100 text-red-600' : 
                      l.status_ai === 'Perlu Review' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {l.status_ai}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400 cursor-pointer hover:text-black"><ChevronRight size={16}/></td>
                </tr>
              )) : (
                <tr><td colSpan="10" className="text-center p-8 text-gray-500">Data tidak ditemukan untuk filter ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-4 text-xs text-gray-600 font-semibold px-2">
          <span>Menampilkan 1 - {filteredData.length} dari {filteredData.length} data</span>
          <div className="flex gap-1">
             <button className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-gray-200"><ChevronLeft size={14}/></button>
             <button className="w-6 h-6 bg-[#1e392a] text-white rounded flex items-center justify-center">1</button>
             <button className="w-6 h-6 bg-white rounded flex items-center justify-center hover:bg-gray-200"><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}