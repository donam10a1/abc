
import React, { useState, useMemo } from 'react';
import { MathError, MathTopic } from '../types';
// Added CheckCircle2 to the imports from lucide-react
import { Trash2, Calendar as CalendarIcon, Tag, Filter, Search, Clock, ChevronRight, Info, CheckCircle2 } from 'lucide-react';

interface Props {
  errors: MathError[];
  onDelete: (id: string) => void;
}

const ErrorTable: React.FC<Props> = ({ errors, onDelete }) => {
  const [filterTopic, setFilterTopic] = useState<string>('All');
  const [filterPart, setFilterPart] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);

  const filteredErrors = useMemo(() => {
    if (!errors) return [];
    return errors.filter(err => {
      // FIX: Thêm kiểm tra err.topics an toàn
      const matchTopic = filterTopic === 'All' || (err && Array.isArray(err.topics) && err.topics.includes(filterTopic as any));
      const matchPart = filterPart === 'All' || err.part === filterPart;
      const matchSearch = (err.question || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (err.source || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (err.subType || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchDate = true;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (dateFilter === 'Today') matchDate = (now - err.timestamp) < oneDay;
      if (dateFilter === 'Week') matchDate = (now - err.timestamp) < oneDay * 7;
      if (dateFilter === 'Month') matchDate = (now - err.timestamp) < oneDay * 30;

      return matchTopic && matchPart && matchSearch && matchDate;
    });
  }, [errors, filterTopic, filterPart, searchTerm, dateFilter]);

  const uniqueTopics = ['Oxyz', 'Xác suất', 'Tích phân cơ bản', 'Hàm số', 'Hình không gian', 'Vận tốc, chuyển động', 'Khác'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nhật ký lỗi sai</h2>
          <p className="text-slate-500 mt-1">Nơi lưu trữ và phân tích từng bước đi sai của bạn.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm câu hỏi, dạng bài..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-72 shadow-sm transition-all"
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            {(['All', 'Today', 'Week'] as const).map(d => (
              <button 
                key={d} 
                onClick={() => setDateFilter(d)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${dateFilter === d ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {d === 'All' ? 'Tất cả' : d === 'Today' ? 'Hôm nay' : 'Tuần này'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Tag size={20} /></div>
          <select 
            value={filterTopic} 
            onChange={(e) => setFilterTopic(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 outline-none"
          >
            <option value="All">Mọi chủ đề</option>
            {uniqueTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Filter size={20} /></div>
          <select 
            value={filterPart} 
            onChange={(e) => setFilterPart(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 outline-none"
          >
            <option value="All">Mọi phần đề</option>
            <option value="I">Phần I (Trắc nghiệm)</option>
            <option value="II">Phần II (Đúng/Sai)</option>
            <option value="III">Phần III (Tự luận ngắn)</option>
          </select>
        </div>
        <div className="md:col-span-2 flex items-center justify-end px-4">
          <span className="text-xs font-bold text-slate-400">Đang lọc: <span className="text-indigo-600 uppercase">{filteredErrors.length} dữ liệu</span></span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguồn & Thời gian</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân tích lỗi sai</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phần</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredErrors.map((error) => (
                <React.Fragment key={error.id}>
                  <tr 
                    onClick={() => setSelectedErrorId(selectedErrorId === error.id ? null : error.id)}
                    className={`cursor-pointer transition-all ${selectedErrorId === error.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-slate-900">{error.source}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-bold">
                        <Clock size={10} />{new Date(error.timestamp).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-lg">
                      <p className="text-sm font-bold text-slate-700 line-clamp-1">{error.question}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">{error.subType || 'Dạng bài chung'}</span>
                        <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Lỗi: {error.errorType}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-white border border-slate-200 text-slate-800 rounded-xl text-[10px] font-black shadow-sm">PHẦN {error.part}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(error.id); }}
                          className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <ChevronRight size={18} className={`text-slate-300 transition-transform ${selectedErrorId === error.id ? 'rotate-90' : ''}`} />
                      </div>
                    </td>
                  </tr>
                  {selectedErrorId === error.id && (
                    <tr className="bg-indigo-50/10">
                      <td colSpan={4} className="px-12 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Info size={14} className="text-indigo-500" /> Nội dung đầy đủ
                            </h4>
                            <div className="p-6 bg-white rounded-3xl border border-indigo-100 text-sm leading-relaxed text-slate-700 shadow-sm font-medium">
                              {error.question}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              {/* Fix: CheckCircle2 is used below, so it must be imported from lucide-react */}
                              <CheckCircle2 size={14} className="text-emerald-500" /> Giải pháp phục hồi (Remedy)
                            </h4>
                            <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 text-sm leading-relaxed text-emerald-900 shadow-sm font-bold italic">
                              "{error.remedy || 'Hãy xem lại lý thuyết phần này để hiểu rõ hơn.'}"
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400">Độ khó đánh giá:</span>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                                error.difficulty === 'Dễ' ? 'bg-green-100 text-green-700' :
                                error.difficulty === 'Khó' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                              }`}>{error.difficulty}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filteredErrors.length === 0 && (
          <div className="p-24 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-slate-200" size={40} />
            </div>
            <h4 className="text-slate-800 font-bold">Không tìm thấy dữ liệu</h4>
            <p className="text-slate-400 text-sm mt-1">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorTable;
