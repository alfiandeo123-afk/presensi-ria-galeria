import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, ChevronLeft, ChevronRight, Zap, Info, Lightbulb } from 'lucide-react';

export default function Shift() {
  const [filterDept, setFilterDept] = useState('Semua');
  const [shiftsData, setShiftsData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  const fetchShifts = () => {
    axios.get(`http://localhost:3000/shifts?startDate=${currentWeekStart}`)
      .then(res => setShiftsData(res.data))
      .catch(console.log);
  };

  useEffect(() => {
    fetchShifts();
  }, [currentWeekStart]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await axios.get('http://localhost:3000/shifts/generate');
      // Pindah ke minggu depan secara otomatis di UI setelah generate
      const nextWeek = new Date(currentWeekStart);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentWeekStart(nextWeek.toISOString().split('T')[0]);
      alert('AI berhasil membuat jadwal mingguan!');
    } catch (err) { alert('Gagal generate'); }
    setIsGenerating(false);
  };

  const processedData = {};
  shiftsData.forEach(s => {
    if (filterDept !== 'Semua' && s.departemen !== filterDept) return;
    if (!processedData[s.employee_id]) {
      processedData[s.employee_id] = { nama: s.nama, dept: s.departemen, jadwal: {} };
    }
    processedData[s.employee_id].jadwal[s.tanggal] = s.shift;
  });

  const daysInWeek = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    daysInWeek.push({
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      dayDate: d.getDate()
    });
  }

  const getShiftColor = (shift) => {
    switch(shift) {
      case 'Pagi': return 'bg-[#dcfce7] text-[#166534] border-[#86efac]';
      case 'Siang': return 'bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]';
      case 'Malam': return 'bg-[#fef9c3] text-[#854d0e] border-[#fde047]';
      case 'Libur': return 'bg-[#fce7f3] text-[#9d174d] border-[#fbcfe8]';
      default: return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Jadwal Shift Karyawan</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola dan pantau jadwal shift karyawan restoran Ria Galeria secara real-time.</p>
      </div>

      <div className="bg-[#2b4536] p-3 rounded-lg flex flex-wrap justify-between items-center gap-2">
        <div className="flex gap-2">
           <div className="bg-[#c5d3c9] text-[#1e392a] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">
            <Calendar size={14} />
            <input 
              type="date" 
              value={currentWeekStart} 
              onChange={(e) => setCurrentWeekStart(getMonday(e.target.value))}
              className="bg-transparent focus:outline-none cursor-pointer text-[#1e392a] font-semibold"
            />
          </div>
          <select 
            value={filterDept} 
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-[#c5d3c9] text-[#1e392a] px-3 py-1.5 rounded text-xs font-semibold focus:outline-none"
          >
            <option value="Semua">Semua Departemen</option>
            <option value="Kasir">Kasir</option>
            <option value="Front Office">Front Office</option>
            <option value="Dapur">Dapur</option>
          </select>
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="bg-[#1a2c22] text-white border border-gray-500 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 hover:bg-black transition disabled:opacity-50"
        >
          <Zap size={14} className={isGenerating ? "animate-pulse" : ""}/> 
          {isGenerating ? 'Memproses AI...' : 'Generate Shift Otomatis'}
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Tabel Jadwal Shift</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-[#e5e7eb] border-b">
                  <th className="p-3 text-left font-bold text-gray-600 border-r min-w-[150px]">Nama Karyawan</th>
                  {daysInWeek.map((d, i) => (
                    <th key={i} className="p-3 font-bold text-gray-600 border-r">{d.dayName}, {d.dayDate}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(processedData).length > 0 ? Object.keys(processedData).map((id, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-left font-semibold text-gray-800 border-r">
                      {processedData[id].nama} <br/>
                      <span className="text-[10px] text-gray-500 font-normal">{processedData[id].dept}</span>
                    </td>
                    {daysInWeek.map((d, i) => {
                      const shift = processedData[id].jadwal[d.date];
                      return (
                        <td key={i} className="p-2 border-r">
                          <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold border ${getShiftColor(shift)}`}>
                            {shift || 'Libur'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="p-8 text-gray-500">Belum ada jadwal. Silakan klik Generate Shift Otomatis.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-64 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Detail Minggu Ini</h3>
            <div className="text-xs space-y-2 text-gray-600">
              <p className="font-semibold text-gray-800">{currentWeekStart} s/d {daysInWeek[6].date}</p>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Hari Kerja: <b>{shiftsData.filter(s => s.shift !== 'Libur').length} Shift</b></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-pink-500 rounded-full"></span> Hari Libur: <b>{shiftsData.filter(s => s.shift === 'Libur').length} Shift</b></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Total Jam Kerja: <b>{shiftsData.filter(s => s.shift !== 'Libur').length * 8} Jam</b></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2"><Info size={16}/> Legenda Shift</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Pagi (08.00 - 16.00)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Siang (14.00 - 22.00)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-500"></span> Libur</div>
            </div>
          </div>

          <div className="bg-[#e5e7eb] rounded-xl border border-gray-300 p-4">
            <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2"><Lightbulb size={16}/> Tips</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Gunakan fitur <b>Generate Shift Otomatis</b> untuk mengisi jadwal 1 minggu ke depan secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}