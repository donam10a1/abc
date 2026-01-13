
import React, { useState, useMemo } from 'react';
import { MathError, MathTopic, RecallQuestion } from '../types';
import { generateRecallQuestions } from '../geminiService';
import { Brain, Sparkles, Copy, FileCode, Download, CheckCircle2, FileText, ChevronRight } from 'lucide-react';

interface Props {
  errors: MathError[];
}

const RecallSection: React.FC<Props> = ({ errors }) => {
  const [questions, setQuestions] = useState<RecallQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lấy các chủ đề yếu dựa trên dữ liệu lỗi sai (ưu tiên 80/20)
  const weakTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    errors.forEach(e => {
      if (Array.isArray(e.topics)) {
        e.topics.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name as MathTopic)
      .slice(0, 5);
  }, [errors]);

  const handleGenerate = async () => {
    if (weakTopics.length === 0) {
      alert("Bạn chưa có dữ liệu lỗi sai để tạo tài liệu ôn tập!");
      return;
    }
    setLoading(true);
    try {
      const res = await generateRecallQuestions(weakTopics);
      setQuestions(res);
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi tạo câu hỏi. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm lắp ghép toàn bộ nội dung thành file LaTeX hoàn chỉnh
  const fullLatexCode = useMemo(() => {
    if (questions.length === 0) return "";

    const preamble = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{vietnam}
\\usepackage{amsmath, amssymb, amsfonts}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{xcolor}

\\title{\\textbf{TÀI LIỆU ÔN TẬP HỒI TƯỞNG (ACTIVE RECALL)\\\\KÌ THI THPTQG 2026}}
\\author{Hệ thống MathMentor AI}
\\date{\\today}

\\begin{document}
\\maketitle

\\section*{Lời giới thiệu}
Tài liệu này được tạo tự động dựa trên các lỗi sai bạn đã mắc phải. Hãy tự giải các câu hỏi này ra giấy mà không xem tài liệu để đạt hiệu quả ghi nhớ cao nhất.
\n`;

    // Nhóm câu hỏi theo chủ đề
    const grouped = questions.reduce((acc, q) => {
      if (!acc[q.topic]) acc[q.topic] = [];
      acc[q.topic].push(q);
      return acc;
    }, {} as Record<string, RecallQuestion[]>);

    let content = "";
    Object.entries(grouped).forEach(([topic, qs]) => {
      content += `\\section{Chủ đề: ${topic}}\n`;
      qs.forEach((q, idx) => {
        content += `\\subsection*{Câu hỏi ${idx + 1}}\n${q.latex}\n\n`;
        content += `\\textit{Gợi ý ôn tập: ${q.explanation}}\n\n`;
        content += `\\rule{\\textwidth}{0.4pt}\n\n`;
      });
    });

    const footer = `\n\\end{document}`;

    return preamble + content + footer;
  }, [questions]);

  const copyToClipboard = () => {
    if (!fullLatexCode) return;
    navigator.clipboard.writeText(fullLatexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([fullLatexCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Active_Recall_Math2026.tex";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Brain size={28} />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Trình tạo Tài liệu LaTeX</h2>
          </div>
          
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Hệ thống sẽ tổng hợp tất cả các chủ đề yếu của bạn thành một <span className="text-white font-bold">file LaTeX duy nhất</span>. 
            Bạn có thể dùng mã này để biên dịch thành PDF chuyên nghiệp hoặc in ấn để ôn tập.
          </p>

          <div className="mt-10 flex flex-col md:flex-row items-center gap-4">
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/40 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang biên soạn tài liệu...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Tạo Tài liệu Ôn tập 80/20
                </>
              )}
            </button>
            
            {weakTopics.length > 0 && (
              <div className="flex items-center gap-2 px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phân tích cho:</span>
                <div className="flex -space-x-2">
                  {weakTopics.map((t, i) => (
                    <div key={i} className="h-6 px-3 bg-slate-800 rounded-full border border-slate-700 text-[9px] font-black flex items-center justify-center whitespace-nowrap">
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
      </div>

      {questions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileCode size={16} className="text-indigo-500" /> Bản thảo LaTeX (.tex)
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm'
                  }`}
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copied ? 'Đã sao chép' : 'Sao chép Code'}
                </button>
                <button 
                  onClick={downloadFile}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100"
                >
                  <Download size={14} />
                  Tải file .tex
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden border border-slate-800 relative group">
              <div className="max-h-[600px] overflow-y-auto scrollbar-hide font-mono text-sm text-indigo-300/90 leading-relaxed custom-scrollbar">
                <pre className="whitespace-pre-wrap">{fullLatexCode}</pre>
              </div>
              <div className="absolute inset-0 pointer-events-none border-4 border-white/5 rounded-[2.5rem]"></div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" /> Cấu trúc tài liệu
              </h3>
              <div className="space-y-6">
                {Array.from(new Set(questions.map(q => q.topic))).map((topic, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {i + 1}
                      </div>
                      <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                    </div>
                    <div className="pb-6">
                      <h4 className="font-black text-slate-800 text-sm mb-1">{topic}</h4>
                      <p className="text-xs text-slate-400 font-medium">
                        Bao gồm {questions.filter(q => q.topic === topic).length} câu hỏi hồi tưởng dạng trắc nghiệm/tự luận ngắn.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-2 flex items-center gap-1">
                  <Sparkles size={12} /> Hướng dẫn biên dịch
                </h4>
                <p className="text-[11px] text-indigo-900/70 leading-relaxed font-medium italic">
                  "Sử dụng trình biên dịch Overleaf hoặc TeXstudio để chuyển mã này thành file PDF đẹp nhất cho kì thi THPTQG."
                </p>
              </div>
            </div>

            <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100">
              <h3 className="text-lg font-black mb-4">Lợi ích của 80/20</h3>
              <p className="text-emerald-100 text-sm leading-relaxed font-medium">
                Tài liệu này không bao quát toàn bộ kiến thức, mà chỉ tập trung vào <span className="text-white font-bold">các lỗ hổng thực sự</span> bạn đã mắc phải. Giải quyết xong file này nghĩa là bạn đã loại bỏ được 80% rủi ro mất điểm.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileCode className="text-slate-200" size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900">Sẵn sàng khởi tạo tài liệu</h3>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Dựa trên {errors.length} lỗi sai, Gemini sẽ biên soạn một tập tin LaTeX chất lượng cao dành riêng cho bạn.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecallSection;
