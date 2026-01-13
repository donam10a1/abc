
import React, { useMemo } from 'react';
import { MathError, MathTopic } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Target, AlertCircle, CheckCircle2, TrendingUp, Lightbulb } from 'lucide-react';

interface Props {
  errors: MathError[];
  onRecallClick: () => void;
}

const Dashboard: React.FC<Props> = ({ errors, onRecallClick }) => {
  const topicStats = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!errors) return [];
    errors.forEach(err => {
      // FIX: Thêm kiểm tra Array.isArray cho err.topics
      if (err && Array.isArray(err.topics)) {
        err.topics.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [errors]);

  const eightyTwentyTopics = useMemo(() => {
    const total = topicStats.reduce((acc, curr) => acc + curr.value, 0) || 1;
    let runningSum = 0;
    const targets: string[] = [];
    for (const stat of topicStats) {
      targets.push(stat.name);
      runningSum += stat.value;
      if (runningSum / total >= 0.8) break;
    }
    return targets;
  }, [topicStats]);

  // Lấy các Remedy tiêu biểu để hiển thị nhanh
  const keyRemedies = useMemo(() => {
    if (!errors) return [];
    return errors
      .filter(e => e && e.remedy)
      .slice(0, 3)
      .map(e => ({ 
        topic: (Array.isArray(e.topics) && e.topics[0]) || 'Chủ đề khác', 
        text: e.remedy 
      }));
  }, [errors]);

  const stats = [
    { label: 'Tổng lỗi sai', value: errors.length, icon: <AlertCircle className="text-rose-500" />, color: 'bg-rose-50' },
    { label: 'Chủ đề 80/20', value: eightyTwentyTopics.length, icon: <Target className="text-indigo-500" />, color: 'bg-indigo-50' },
    { label: 'Dạng bài khó', value: Array.from(new Set(errors.map(e => e.subType || 'Dạng bài chung'))).length, icon: <TrendingUp className="text-amber-500" />, color: 'bg-amber-50' },
    { label: 'Đề đã luyện', value: Array.from(new Set(errors.map(e => e.source || 'Không rõ'))).length, icon: <CheckCircle2 className="text-emerald-500" />, color: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Thống kê Chiến thuật</h2>
          <p className="text-slate-500 mt-1">Dựa trên dữ liệu {errors.length} lỗi sai đã ghi nhận.</p>
        </div>
        <button 
          onClick={onRecallClick}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Target size={20} />
          Bắt đầu Luyện tập Hồi tưởng
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${s.color} p-6 rounded-3xl border border-white shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-1.5 bg-white rounded-lg shadow-xs">{s.icon}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={22} className="text-indigo-600" />
              Bản đồ Lỗ hổng Kiến thức
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">Phân bổ lỗi theo chủ đề</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 10 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {topicStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 1 ? '#818cf8' : '#c7d2fe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target size={20} className="text-indigo-400" />
                Chiến thuật 80/20
              </h3>
              <div className="space-y-4">
                {eightyTwentyTopics.slice(0, 3).map((topic, i) => (
                  <div key={topic} className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <span className="text-sm font-bold">{topic}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500 rounded-full font-black uppercase">Ưu tiên {i+1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <h3 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
              <Lightbulb size={16} /> Nhắc nhở giải pháp (Remedy)
            </h3>
            <div className="space-y-4">
              {keyRemedies.map((r, i) => (
                <div key={i} className="text-xs">
                  <div className="font-bold text-amber-600 mb-1">{r.topic}</div>
                  <div className="text-slate-600 leading-relaxed italic">"{r.text?.slice(0, 80)}..."</div>
                </div>
              ))}
              {keyRemedies.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có gợi ý nào được ghi lại.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
