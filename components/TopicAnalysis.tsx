
import React, { useMemo, useState } from 'react';
import { MathError, MathTopic } from '../types';
import { Target, TrendingUp, AlertTriangle, ChevronRight, BarChart2, Lightbulb, MessageCircle, Info } from 'lucide-react';

interface Props {
  errors: MathError[];
}

const TopicAnalysis: React.FC<Props> = ({ errors }) => {
  const [selectedTopicName, setSelectedTopicName] = useState<string>('Tất cả');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const mainTopics: MathTopic[] = [
    'Oxyz', 'Xác suất', 'Tích phân cơ bản', 'Vận tốc, chuyển động', 
    'Tích phân S V', 'Hàm số', 'Ứng dụng hàm số', 'Cực trị hình học', 
    'Tìm đường ngắn nhất', 'Hình không gian', 'Khác'
  ];

  const topicData = useMemo(() => {
    if (!errors || !Array.isArray(errors)) return [];

    // Tính toán dữ liệu cho từng chủ đề
    const data = mainTopics.map(topic => {
      // FIX: Thêm kiểm tra e.topics là mảng trước khi dùng .includes
      const topicErrors = errors.filter(e => e && Array.isArray(e.topics) && e.topics.includes(topic));
      
      const subTypeCounts: Record<string, number> = {};
      const errorTypeCounts: Record<string, number> = {};
      
      topicErrors.forEach(e => {
        const sType = e.subType || 'Dạng bài chung';
        const eType = e.errorType || 'Lỗi chưa xác định';
        subTypeCounts[sType] = (subTypeCounts[sType] || 0) + 1;
        errorTypeCounts[eType] = (errorTypeCounts[eType] || 0) + 1;
      });

      const mostCommonSubType = Object.entries(subTypeCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
      const mostCommonError = Object.entries(errorTypeCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        name: topic,
        count: topicErrors.length,
        mostCommonSubType,
        mostCommonError,
        errors: topicErrors
      };
    }).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

    // Xác định 80/20
    const totalErrors = data.reduce((acc, curr) => acc + curr.count, 0) || 1; // FIX: Tránh chia cho 0
    let runningSum = 0;
    return data.map(t => {
      runningSum += t.count;
      return {
        ...t,
        isPriority: runningSum / totalErrors <= 0.8 || t === data[0]
      };
    });
  }, [errors]);

  const filteredTopics = selectedTopicName === 'Tất cả' 
    ? topicData 
    : topicData.filter(t => t.name === selectedTopicName);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Phân tích Chủ đề (80/20)</h2>
          <p className="text-slate-500 mt-1">Tập trung vào 20% chủ đề gây ra 80% lỗi sai của bạn.</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          <button 
            onClick={() => setSelectedTopicName('Tất cả')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedTopicName === 'Tất cả' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Tất cả
          </button>
          {topicData.map(t => (
            <button 
              key={t.name}
              onClick={() => setSelectedTopicName(t.name)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedTopicName === t.name ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredTopics.map((topic) => (
          <div 
            key={topic.name} 
            className={`bg-white rounded-[2.5rem] shadow-sm border transition-all ${topic.isPriority ? 'border-indigo-100 ring-1 ring-indigo-50' : 'border-slate-100'}`}
          >
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-2xl ${topic.isPriority ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <BarChart2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{topic.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{topic.count} câu làm sai</span>
                        {topic.isPriority && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-md uppercase">Mục tiêu 80/20</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp size={14} /> Dạng bài yếu nhất
                      </div>
                      <div className="text-base font-bold text-slate-800">{topic.mostCommonSubType}</div>
                    </div>
                    <div className="p-5 bg-rose-50/50 rounded-3xl border border-rose-100/50">
                      <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <AlertTriangle size={14} /> Lỗi tư duy chủ đạo
                      </div>
                      <div className="text-base font-bold text-slate-800">{topic.mostCommonError}</div>
                    </div>
                  </div>
                </div>

                <div className="md:w-64">
                  <button 
                    onClick={() => setExpandedTopic(expandedTopic === topic.name ? null : topic.name)}
                    className={`w-full py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 transition-all ${
                      expandedTopic === topic.name 
                        ? 'bg-slate-100 text-slate-600' 
                        : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:-translate-y-1'
                    }`}
                  >
                    {expandedTopic === topic.name ? 'Đóng phân tích' : 'Phân tích chi tiết'}
                    <ChevronRight size={18} className={`transition-transform duration-300 ${expandedTopic === topic.name ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {expandedTopic === topic.name && (
                <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                        <Lightbulb size={14} className="text-amber-500" /> Top 3 Giải pháp khắc phục
                      </h4>
                      <div className="space-y-3">
                        {topic.errors.slice(0, 3).map((err, i) => (
                          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-xs font-black">
                              {i + 1}
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{err.subType || 'Dạng bài chung'}</div>
                              <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{err.remedy || 'Đang cập nhật giải pháp...'}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Info size={14} /> Chiến thuật ôn tập AI
                      </h4>
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="w-1 bg-indigo-500 rounded-full"></div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            Chủ đề <span className="text-white font-bold">{topic.name}</span> đang chiếm 
                            <span className="text-indigo-400 font-bold ml-1">{errors.length > 0 ? Math.round((topic.count / errors.length) * 100) : 0}%</span> tổng số lỗi sai. 
                            Bạn nên dành <span className="text-white font-bold">45 phút</span> hôm nay để luyện tập hổi tưởng dạng bài 
                            <span className="text-white font-bold ml-1">{topic.mostCommonSubType}</span>.
                          </p>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                          <MessageCircle size={16} className="text-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Mẹo từ Gemini: Hãy vẽ sơ đồ tư duy cho phần này.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {topicData.length === 0 && (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart2 className="text-slate-200" size={48} />
            </div>
            <h4 className="text-slate-900 font-black text-xl">Hệ thống sẵn sàng</h4>
            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
              Hãy thêm các câu làm sai qua ảnh hoặc PDF để AI tiến hành phân tích chủ đề 80/20 cho bạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicAnalysis;
