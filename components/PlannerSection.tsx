
import React, { useState } from 'react';
import { MathError, DailyTask } from '../types';
import { generateStudyPlan } from '../geminiService';
import { Calendar, CheckCircle2, Clock, Coffee, BookOpen, RefreshCw } from 'lucide-react';

interface Props {
  errors: MathError[];
  tasks: DailyTask[];
  setTasks: React.Dispatch<React.SetStateAction<DailyTask[]>>;
  scheduleInput: string;
  setScheduleInput: (val: string) => void;
}

const PlannerSection: React.FC<Props> = ({ errors, tasks, setTasks, scheduleInput, setScheduleInput }) => {
  const [loading, setLoading] = useState(false);

  const weakTopics = Array.from(new Set(errors.flatMap(e => e.topics))).slice(0, 5);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const res = await generateStudyPlan(weakTopics, scheduleInput);
      setTasks(res.tasks.map((t: any) => ({ ...t, completed: false })));
    } catch (e) {
      console.error(e);
      alert("Lỗi khi tạo lịch trình. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index: number) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Lịch trình 24h Tối ưu</h2>
        <button 
          onClick={handleGeneratePlan}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Đang tối ưu...' : 'Tạo Lịch trình Mới'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              Lịch trình cá nhân
            </h3>
            <textarea 
              value={scheduleInput}
              onChange={(e) => setScheduleInput(e.target.value)}
              placeholder="Ví dụ: Học trường sáng, chiều trống, tối 20h học toán..."
              className="w-full h-32 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-2 italic">
              AI sẽ dựa vào đây để lồng ghép các phiên ôn tập "Forgetting Curve".
            </p>
          </div>

          <div className="bg-indigo-900 p-6 rounded-2xl text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Mục tiêu hôm nay
            </h3>
            <div className="space-y-2">
              {weakTopics.map(topic => (
                <div key={topic} className="flex items-center gap-2 text-sm text-indigo-100">
                  <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                  {topic}
                </div>
              ))}
              {weakTopics.length === 0 && <p className="text-xs text-indigo-300 italic">Chưa có chủ đề mục tiêu</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <span className="font-bold text-slate-800">Tiến độ hoàn thành</span>
              <span className="text-indigo-600 font-bold">
                {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
              </span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {tasks.map((task, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-6 p-6 transition-colors ${task.completed ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
                >
                  <div className="text-slate-400 font-mono text-sm w-16">{task.time}</div>
                  
                  <div className="flex-1 flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      task.type === 'study' ? 'bg-blue-100 text-blue-600' :
                      task.type === 'recall' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {task.type === 'study' ? <BookOpen size={20} /> :
                       task.type === 'recall' ? <Brain size={20} /> :
                       <Coffee size={20} />}
                    </div>
                    <div>
                      <div className={`font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {task.task}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                        {task.type === 'study' ? 'Học mới' :
                         task.type === 'recall' ? 'Truy xuất kiến thức' :
                         'Nghỉ ngơi'}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleTask(idx)}
                    className={`p-2 rounded-full transition-all ${
                      task.completed ? 'text-emerald-500 bg-emerald-50' : 'text-slate-200 bg-slate-50 hover:text-indigo-500'
                    }`}
                  >
                    <CheckCircle2 size={24} fill={task.completed ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="p-20 text-center">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-slate-200" size={32} />
                  </div>
                  <h4 className="text-slate-800 font-bold">Chưa có lộ trình</h4>
                  <p className="text-slate-500 text-sm mt-1">Hãy nhấn nút "Tạo Lịch trình Mới" để bắt đầu ngày học tập hiệu quả</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Brain = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"/>
  </svg>
);

export default PlannerSection;
