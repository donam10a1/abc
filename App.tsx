
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  History, 
  Calendar, 
  TrendingDown, 
  Upload,
  BrainCircuit,
  FileSpreadsheet,
  FileText,
  Plus,
  X,
  Check,
  Edit2,
  Save,
  AlertCircle,
  Shapes,
  AlertTriangle,
  FileEdit
} from 'lucide-react';
import { MathError, MathTopic, DailyTask } from './types';
import { analyzeErrorImage, analyzePdfErrors } from './geminiService';
import ErrorTable from './components/ErrorTable';
import Dashboard from './components/Dashboard';
import RecallSection from './components/RecallSection';
import PlannerSection from './components/PlannerSection';
import TopicAnalysis from './components/TopicAnalysis';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'errors' | 'topics' | 'recall' | 'plan'>('dashboard');
  const [errors, setErrors] = useState<MathError[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [studyPlan, setStudyPlan] = useState<DailyTask[]>([]);
  const [scheduleInput, setScheduleInput] = useState('Học trên lớp từ 7h đến 11h, chiều học thêm lúc 14h-16h.');

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentPdfBase64, setCurrentPdfBase64] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [reviewItems, setReviewItems] = useState<Partial<MathError>[]>([]);
  const [bulkSource, setBulkSource] = useState('');

  useEffect(() => {
    try {
      const savedErrors = localStorage.getItem('math_errors');
      if (savedErrors) {
        const parsed = JSON.parse(savedErrors);
        const cleaned = parsed.map((e: any) => ({
          ...e,
          id: e.id || Math.random().toString(36).substr(2, 9),
          source: e.source || 'Không rõ',
          question: e.question || 'Nội dung trống',
          difficulty: e.difficulty || 'Trung bình',
          errorType: e.errorType || 'Lỗi tư duy',
          subType: e.subType || 'Dạng bài chung',
          part: e.part || 'I',
          topics: Array.isArray(e.topics) ? e.topics : ['Khác'],
          remedy: e.remedy || 'Chưa có giải pháp.',
          timestamp: e.timestamp || Date.now()
        }));
        setErrors(cleaned);
      }
      const savedPlan = localStorage.getItem('math_study_plan');
      if (savedPlan) setStudyPlan(JSON.parse(savedPlan));
      const savedSchedule = localStorage.getItem('math_schedule_input');
      if (savedSchedule) setScheduleInput(savedSchedule);
    } catch (e) {
      console.error("Error loading data", e);
    }
  }, []);

  useEffect(() => {
    if (errors.length > 0) {
      localStorage.setItem('math_errors', JSON.stringify(errors));
    }
  }, [errors]);

  useEffect(() => {
    if (studyPlan.length > 0) {
      localStorage.setItem('math_study_plan', JSON.stringify(studyPlan));
    }
  }, [studyPlan]);

  useEffect(() => {
    localStorage.setItem('math_schedule_input', scheduleInput);
  }, [scheduleInput]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result?.toString().split(',')[1];
      if (base64) {
        try {
          const analysis = await analyzeErrorImage(base64);
          const newError: MathError = {
            id: Math.random().toString(36).substr(2, 9),
            source: analysis.source || 'Không rõ',
            question: analysis.question || 'Câu hỏi hình ảnh',
            difficulty: (analysis.difficulty as any) || 'Trung bình',
            errorType: analysis.errorType || 'Lỗi chưa xác định',
            subType: analysis.subType || 'Dạng bài chung',
            part: (analysis.part as any) || 'I',
            topics: Array.isArray(analysis.topics) ? analysis.topics as MathTopic[] : ['Khác'],
            timestamp: Date.now(),
            remedy: analysis.remedy || 'Đang cập nhật giải pháp...',
            imageUrl: event.target?.result?.toString()
          };
          setErrors(prev => [newError, ...prev]);
          setActiveTab('errors');
        } catch (error) {
          alert("Lỗi khi phân tích hình ảnh. Vui lòng thử lại.");
        }
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result?.toString().split(',')[1];
      if (base64) {
        setCurrentPdfBase64(base64);
        setPdfModalOpen(true);
        setSelectedQuestions([]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startPdfAnalysis = async () => {
    if (!currentPdfBase64 || selectedQuestions.length === 0) return;
    setLoading(true);
    setPdfModalOpen(false);
    try {
      const results = await analyzePdfErrors(currentPdfBase64, selectedQuestions);
      if (results && results.length > 0) {
        setReviewItems(results);
        setBulkSource(results[0].source || '');
        setReviewModalOpen(true);
      } else {
        alert("Không thể trích xuất dữ liệu từ các câu hỏi đã chọn.");
      }
    } catch (error) {
      alert("Lỗi trích xuất PDF.");
    } finally {
      setLoading(false);
    }
  };

  const applyBulkSource = () => {
    if (!bulkSource) return;
    setReviewItems(prev => prev.map(item => ({ ...item, source: bulkSource })));
  };

  const confirmAllErrors = () => {
    if (!reviewItems || reviewItems.length === 0) return;
    const newErrors: MathError[] = reviewItems.map(res => ({
      id: Math.random().toString(36).substr(2, 9),
      source: res.source || 'Đề PDF',
      question: res.question || 'Nội dung trích xuất',
      difficulty: (res.difficulty as any) || 'Trung bình',
      errorType: res.errorType || 'Lỗi trích xuất',
      subType: res.subType || 'Dạng bài chung',
      part: (res.part as any) || 'I',
      topics: Array.isArray(res.topics) && res.topics.length > 0 ? res.topics as MathTopic[] : ['Khác'],
      timestamp: Date.now(),
      remedy: res.remedy || 'Hãy xem lại lý thuyết phần này.'
    }));
    setErrors(prev => [...newErrors, ...prev]);
    setReviewModalOpen(false);
    setActiveTab('errors');
  };

  const updateReviewItem = (index: number, field: string, value: any) => {
    setReviewItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <nav className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <BrainCircuit size={32} />
            MathMentor
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">THPTQG 2026 Edition</p>
        </div>

        <div className="flex-1 px-4 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Tổng quan" />
          <NavItem active={activeTab === 'errors'} onClick={() => setActiveTab('errors')} icon={<History size={20} />} label="Nhật ký lỗi sai" />
          <NavItem active={activeTab === 'topics'} onClick={() => setActiveTab('topics')} icon={<Shapes size={20} />} label="Chủ đề (80/20)" />
          <NavItem active={activeTab === 'recall'} onClick={() => setActiveTab('recall')} icon={<TrendingDown size={20} />} label="Active Recall" />
          <NavItem active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} icon={<Calendar size={20} />} label="Lộ trình học" />
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <UploadButton icon={<Upload size={14} />} label="Phân tích Ảnh" color="indigo" onChange={handleFileUpload} accept="image/*" />
          <UploadButton icon={<FileText size={14} />} label="Trích xuất PDF" color="blue" onChange={handlePdfFileSelect} accept=".pdf" />
        </div>
      </nav>

      <main className="flex-1 ml-64 p-8 relative">
        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-slate-700 animate-pulse text-center px-4">Đang sử dụng "Mắt thần" Gemini...</p>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard errors={errors} onRecallClick={() => setActiveTab('recall')} />}
          {activeTab === 'errors' && <ErrorTable errors={errors} onDelete={(id) => setErrors(prev => prev.filter(e => e.id !== id))} />}
          {activeTab === 'topics' && <TopicAnalysis errors={errors} />}
          {activeTab === 'recall' && <RecallSection errors={errors} />}
          {activeTab === 'plan' && <PlannerSection errors={errors} tasks={studyPlan} setTasks={setStudyPlan} scheduleInput={scheduleInput} setScheduleInput={setScheduleInput} />}
        </div>
      </main>

      {/* PDF Modal */}
      {pdfModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><FileText className="text-blue-600" /> Chọn câu lỗi</h3>
              <button onClick={() => setPdfModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <QuestionGrid title="Phần I (1-12)" range={[1, 12]} selected={selectedQuestions} onToggle={(num) => setSelectedQuestions(p => p.includes(num) ? p.filter(n => n !== num) : [...p, num])} />
              <QuestionGrid title="Phần II (1-4)" range={[13, 16]} selected={selectedQuestions} onToggle={(num) => setSelectedQuestions(p => p.includes(num) ? p.filter(n => n !== num) : [...p, num])} />
              <QuestionGrid title="Phần III (1-6)" range={[17, 22]} selected={selectedQuestions} onToggle={(num) => setSelectedQuestions(p => p.includes(num) ? p.filter(n => n !== num) : [...p, num])} />
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={startPdfAnalysis} disabled={selectedQuestions.length === 0} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"><Check size={18} /> Tiến hành trích xuất</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Check className="text-emerald-600" /> Kiểm tra trích xuất</h3>
                <span className="text-xs text-slate-500 font-medium">Đảm bảo thông tin chính xác trước khi lưu</span>
              </div>
              <button onClick={() => setReviewModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            {/* Bulk Update Section */}
            <div className="px-8 py-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase shrink-0">
                <FileEdit size={16} /> Đổi nguồn nhanh (Bulk):
              </div>
              <div className="flex-1 w-full flex items-center gap-2">
                <input 
                  value={bulkSource} 
                  onChange={(e) => setBulkSource(e.target.value)} 
                  placeholder="Nhập tên trường, sở (ví dụ: Trường THPT Chuyên...)" 
                  className="flex-1 px-4 py-2 text-sm bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <button 
                  onClick={applyBulkSource}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition-all"
                >
                  Áp dụng cho tất cả
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {reviewItems.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-sm">
                  <div className="absolute top-4 right-4 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase">Câu {idx + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung câu hỏi</label>
                      <textarea 
                        value={item.question || ''} 
                        onChange={(e) => updateReviewItem(idx, 'question', e.target.value)} 
                        className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl h-32 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                        placeholder="Nội dung câu hỏi..."
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phần</label>
                          <select 
                            value={item.part || 'I'} 
                            onChange={(e) => updateReviewItem(idx, 'part', e.target.value)} 
                            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                          >
                            <option value="I">Phần I</option>
                            <option value="II">Phần II</option>
                            <option value="III">Phần III</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ khó</label>
                          <select 
                            value={item.difficulty || 'Trung bình'} 
                            onChange={(e) => updateReviewItem(idx, 'difficulty', e.target.value)} 
                            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                          >
                            <option value="Dễ">Dễ</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Khó">Khó</option>
                            <option value="Rất khó">Rất khó</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dạng bài chi tiết</label>
                        <input 
                          value={item.subType || ''} 
                          onChange={(e) => updateReviewItem(idx, 'subType', e.target.value)} 
                          placeholder="Ví dụ: Cực trị hàm số" 
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguồn đề (Trường/Tỉnh)</label>
                        <input 
                          value={item.source || ''} 
                          onChange={(e) => updateReviewItem(idx, 'source', e.target.value)} 
                          placeholder="Ví dụ: Sở GD Đắk Lắk" 
                          className="w-full p-2.5 text-xs bg-white border border-indigo-200 text-indigo-700 rounded-xl font-black outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <div className="flex items-center gap-2 mr-auto text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase">Vui lòng rà soát kỹ trước khi lưu</span>
              </div>
              <button 
                onClick={confirmAllErrors} 
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <Check size={18} /> Lưu vào Nhật ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionGrid = ({ title, range, selected, onToggle }: any) => (
  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{title}</h4>
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i).map(num => (
        <button 
          key={num} 
          onClick={() => onToggle(num)} 
          className={`h-11 rounded-xl font-black text-xs border-2 transition-all ${
            selected.includes(num) 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
              : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200'
          }`}
        >
          {num <= 12 ? num : (num <= 16 ? `II-${num-12}` : `III-${num-16}`)}
        </button>
      ))}
    </div>
  </div>
);

const UploadButton = ({ icon, label, color, onChange, accept }: any) => (
  <label className={`flex items-center justify-center w-full h-11 px-4 rounded-xl cursor-pointer border-2 transition-all group ${
    color === 'indigo' 
      ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600' 
      : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600'
  }`}>
    <span className="flex items-center space-x-2">
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-black text-[10px] uppercase tracking-wider">{label}</span>
    </span>
    <input type="file" className="hidden" onChange={onChange} accept={accept} />
  </label>
);

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${
      active 
        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 translate-x-1' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
    }`}
  >
    <span className={active ? 'text-indigo-400' : ''}>{icon}</span>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

export default App;
