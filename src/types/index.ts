// Navigation types
export type MainTab = 'before' | 'during' | 'after' | 'summary';
export type SubTab = 'teacher' | 'student';

// User types
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'teacher' | 'admin';
  subject: string;
  classes: ClassInfo[];
  currentClass?: ClassInfo;
}

export interface ClassInfo {
  grade: string;
  classNumber: number;
  fullName: string;
}

// Preview dimension for admin config
export interface PreviewDimension {
  id: string;
  name: string;
  maxScore: number;
}

// Lesson plan evaluation types
export interface LessonPlanScore {
  dimension: string;
  score: number;
  maxScore: number;
}

export interface LessonPlanEvaluation {
  totalScore: number;
  maxScore: number;
  scores: LessonPlanScore[];
  suggestions: string[];
  teacherName: string;
  date: string;
  userId: string;
  fileName?: string;
}

// Student preview evaluation types
export interface PreviewEvaluation {
  studentId: number;
  studentName: string;
  scores: Record<string, number>;
  totalScore: number;
  date: string;
  userId: string;
  className: string;
}

// Classroom observation types
export type LessonType = 'concept' | 'problem-solving';
export type GradeLevel = 'excellent' | 'good' | 'average';

export interface ObservationItem {
  dimension: string;
  point: string;
  grade: GradeLevel | null;
  note?: string;
}

export interface ObserverEvaluation {
  id: string;
  observerName: string;
  teacherName: string;
  lessonType: LessonType;
  items: ObservationItem[];
  summary: string;
  timestamp: number;
  date: string;
  shareToken?: string;
  topic?: string;
}

// Real-time student evaluation types
export type StudentSegment = 'low' | 'middle' | 'high';

export interface EvaluationDimension {
  id: string;
  name: string;
  description: string;
  addPoints: number;
  deductPoints: number;
  detailedDescription: string;
}

export interface StudentScore {
  studentId: number;
  studentName: string;
  totalScore: number;
  recentAdditions: { dimensionId: string; points: number; timestamp: number; isDeduction: boolean }[];
  date: string;
  userId: string;
  className: string;
}

// After-class evaluation types
export interface HomeworkEvaluation {
  studentId: number;
  studentName: string;
  completionRate: number;
  accuracy: number;
  neatness: number;
  thinking: number;
  customScores: Record<string, number>;
  totalScore: number;
  date: string;
  userId: string;
  className: string;
}

export interface ErrorAnalysisEvaluation {
  studentId: number;
  studentName: string;
  collectionCompleteness: number;
  analysisDepth: number;
  improvementMeasures: number;
  totalScore: number;
  date: string;
  userId: string;
  className: string;
}

// Custom dimension for after-class
export interface CustomDimension {
  id: string;
  name: string;
  description: string;
  maxScore: number;
}

// Summary types
export interface TeacherSummary {
  userId: string;
  teacherName: string;
  date: string;
  lessonPlanScore: number;
  observationCount: number;
  excellentRate: number;
  goodRate: number;
  averageRate: number;
  overallRating: string;
  highlights: string[];
  improvements: string[];
}

export interface StudentSummary {
  studentId: number;
  studentName: string;
  previewScore: number;
  realtimeScore: number;
  homeworkScore: number;
  totalScore: number;
  dailyScores: { date: string; score: number }[];
  overallRating: string;
}

// Student info
export interface StudentInfo {
  id: number;
  name: string;
  className: string;
}

// Registered user for login
export interface RegisteredUser {
  username: string;
  password: string;
  name: string;
  role: 'teacher' | 'admin';
  subject: string;
  classes: ClassInfo[];
}

// ==================== 新增错题相关类型 ====================

// 知识点接口
export interface KnowledgePoint {
  id: string;
  name: string;
  category: '计算' | '几何' | '应用题' | '单位换算' | '其他';
}

// 错误原因预设
export type ErrorReason = '审题不清' | '计算错误' | '概念不懂' | '方法不会' | '粗心' | '自定义';

// 错题接口
export interface Mistake {
  id: string;
  date: string;               // 记录日期
  className: string;          // 班级
  studentId?: number;         // 学生ID（可选）
  studentName?: string;
  questionText: string;       // 题目文本
  correctAnswer: string;      // 正确答案
  wrongAnswer: string;        // 错误答案
  errorReason: ErrorReason;   // 错误原因
  customReason?: string;      // 自定义原因（当 errorReason 为 '自定义' 时使用）
  knowledgePoints: string[];  // 知识点ID列表
  imageUrl?: string;          // 错题图片（可选）
  notes?: string;             // 备注
  mastered: boolean;          // 是否已掌握
  createdAt: string;          // 创建时间
}