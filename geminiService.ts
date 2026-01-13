
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MathError, MathTopic, RecallQuestion } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MATH_TOPICS: MathTopic[] = [
  'Oxyz', 'Xác suất', 'Tích phân cơ bản', 'Vận tốc, chuyển động', 
  'Tích phân S V', 'Hàm số', 'Ứng dụng hàm số', 'Cực trị hình học', 
  'Tìm đường ngắn nhất', 'Hình không gian', 'Khác'
];

// Hàm bổ trợ để đảm bảo dữ liệu sạch
const sanitizeMathError = (data: any): Partial<MathError> => {
  return {
    source: data.source || 'Đề chưa xác định',
    question: data.question || 'Nội dung câu hỏi đang được cập nhật...',
    difficulty: (['Dễ', 'Trung bình', 'Khó', 'Rất khó'].includes(data.difficulty) ? data.difficulty : 'Trung bình') as any,
    subType: data.subType || 'Dạng bài chung',
    errorType: data.errorType || 'Lỗi tư duy',
    part: (['I', 'II', 'III'].includes(data.part) ? data.part : 'I') as any,
    topics: Array.isArray(data.topics) && data.topics.length > 0 
      ? data.topics.filter((t: any) => MATH_TOPICS.includes(t)) 
      : ['Khác'],
    remedy: data.remedy || 'Hãy xem lại kiến thức cơ bản của chương này.'
  };
};

export const analyzeErrorImage = async (base64Image: string): Promise<Partial<MathError>> => {
  const prompt = `
    Phân tích câu hỏi toán THPTQG từ hình ảnh. 
    Yêu cầu: TRẢ VỀ JSON CHÍNH XÁC. KHÔNG ĐƯỢC ĐỂ TRỐNG CÁC TRƯỜNG.
    Đặc biệt chú ý tìm tên Trường/Sở ở phần đầu ảnh (nếu có).
    Nếu không biết, hãy ghi "Chưa xác định".
    - source: Tỉnh/Sở/Trường (ví dụ: THPT Chuyên Hùng Vương - Phú Thọ).
    - question: Nội dung text của câu hỏi.
    - difficulty: "Dễ", "Trung bình", "Khó", "Rất khó".
    - subType: Dạng bài chi tiết.
    - errorType: Nguyên nhân sai (tính toán/nhầm công thức/đọc đề).
    - part: "I", "II", "III".
    - topics: Mảng các chủ đề từ: ${MATH_TOPICS.join(', ')}.
    - remedy: Giải pháp khắc phục ngắn gọn.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING },
            question: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            subType: { type: Type.STRING },
            errorType: { type: Type.STRING },
            part: { type: Type.STRING },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
            remedy: { type: Type.STRING }
          },
          required: ["source", "question", "difficulty", "subType", "errorType", "part", "topics", "remedy"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return sanitizeMathError(parsed);
  } catch (e) {
    console.error("AI Analysis Error:", e);
    return sanitizeMathError({});
  }
};

export const analyzePdfErrors = async (base64Pdf: string, wrongQuestions: number[]): Promise<Partial<MathError>[]> => {
  const prompt = `
    Trích xuất các câu hỏi số: ${wrongQuestions.join(', ')} từ PDF.
    CHÚ Ý: Tìm nguồn đề (Tên Sở GD/Trường THPT) thường xuất hiện ở tiêu đề đầu trang PDF.
    Sử dụng nguồn đề đó cho toàn bộ các câu hỏi trích xuất được.
    Phân loại vào các chủ đề: ${MATH_TOPICS.join(', ')}.
    TRẢ VỀ MẢNG JSON. Đảm bảo mọi trường đều có giá trị chuỗi, không để null.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Pdf, mimeType: 'application/pdf' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              question: { type: Type.STRING },
              part: { type: Type.STRING },
              subType: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              errorType: { type: Type.STRING },
              topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              remedy: { type: Type.STRING }
            },
            required: ["source", "question", "part", "subType", "difficulty", "errorType", "topics", "remedy"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || '[]');
    return Array.isArray(results) ? results.map(sanitizeMathError) : [];
  } catch (e) {
    console.error("AI PDF Analysis Error:", e);
    return [];
  }
};

export const generateRecallQuestions = async (topics: MathTopic[]): Promise<RecallQuestion[]> => {
  const prompt = `
    Tạo câu hỏi Active Recall (Latex) cho các chủ đề: ${topics.join(', ')}. 
    Trả về JSON: [{topic, latex, explanation}].
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              latex: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["topic", "latex", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateStudyPlan = async (weakTopics: string[], dailySchedule: string): Promise<any> => {
  const prompt = `
    Tạo lịch trình học 24h dựa trên các chủ đề yếu: ${weakTopics.join(', ')} 
    và thời gian biểu: ${dailySchedule}.
    Trả về JSON { tasks: [{time, task, type}] }.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  task: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ["time", "task", "type"]
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{ "tasks": [] }');
  } catch (e) {
    return { tasks: [] };
  }
};
