
export type MathTopic = 
  | 'Oxyz' 
  | 'Xác suất' 
  | 'Tích phân cơ bản' 
  | 'Vận tốc, chuyển động' 
  | 'Tích phân S V' 
  | 'Hàm số' 
  | 'Ứng dụng hàm số' 
  | 'Cực trị hình học' 
  | 'Tìm đường ngắn nhất' 
  | 'Hình không gian' 
  | 'Khác';

export interface MathError {
  id: string;
  source: string; // Tỉnh/Sở
  question: string;
  timestamp: number;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó' | 'Rất khó';
  errorType: string;
  subType: string; // Dạng bài chi tiết
  part: 'I' | 'II' | 'III'; 
  topics: MathTopic[];
  imageUrl?: string;
  remedy?: string;
}

export interface RecallQuestion {
  topic: MathTopic;
  latex: string;
  explanation: string;
}

export interface DailyTask {
  time: string;
  task: string;
  type: 'study' | 'rest' | 'recall';
  completed: boolean;
}

export interface StudyPlan {
  date: string;
  tasks: DailyTask[];
}
