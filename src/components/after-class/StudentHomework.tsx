import { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, CheckCircle, Save, FileSpreadsheet, Plus, X, TrendingUp, Settings, Minus, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStudents } from '@/hooks/useStudents';
import type { StudentInfo, CustomDimension } from '@/types';
import * as XLSX from 'xlsx';

interface HomeworkScore {
  studentId: number;
  completionRate: number;
  accuracy: number;
  neatness: number;
  thinking: number;
  customScores: Record<string, number>;
}

interface ErrorAnalysisScore {
  studentId: number;
  collectionCompleteness: number;
  analysisDepth: number;
  improvementMeasures: number;
}

interface StudentHomeworkProps {
  selectedDate: string;
  className?: string;
  userId?: string;
}

// 默认维度（已移除完成速度）
const defaultCustomDimensions: CustomDimension[] = [
  { id: 'creativity', name: '创新思维', description: '解题方法有创意', maxScore: 10 },
];

export function StudentHomework({ selectedDate, className, userId }: StudentHomeworkProps) {
  // 根据 className 构建 classInfo
  const classInfo = useMemo(() => {
    if (!className) return undefined;
    return {
      grade: className.split('(')[0],
      classNumber: parseInt(className.match(/\d+/)?.[0] || '1'),
      fullName: className,
    };
  }, [className]);

  const { students } = useStudents(classInfo);

  // 按学号排序
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.id - b.id);
  }, [students]);

  const [homeworkScores, setHomeworkScores] = useState<Record<number, HomeworkScore>>({});
  const [errorScores, setErrorScores] = useState<Record<number, ErrorAnalysisScore>>({});
  const [savedStudents, setSavedStudents] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('homework');
  const [customDimensions, setCustomDimensions] = useState<CustomDimension[]>([]);
  const [showDimensionDialog, setShowDimensionDialog] = useState(false);
  const [newDimension, setNewDimension] = useState({ name: '', description: '', maxScore: 10 });
  const [showTrendDialog, setShowTrendDialog] = useState(false);
  const [selectedStudentForTrend, setSelectedStudentForTrend] = useState<StudentInfo | null>(null);

  // 文件导入相关
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom dimensions and scores
  useEffect(() => {
    // 处理自定义维度：移除旧的“完成速度”维度（id 为 'speed'）
    const savedDimensions = localStorage.getItem('custom_dimensions');
    if (savedDimensions) {
      try {
        const parsed = JSON.parse(savedDimensions);
        // 过滤掉 id 为 'speed' 的维度（旧版完成速度）
        const filtered = parsed.filter((d: CustomDimension) => d.id !== 'speed');
        setCustomDimensions(filtered);
        // 如果过滤掉了，更新 localStorage 以清理旧数据
        if (filtered.length !== parsed.length) {
          localStorage.setItem('custom_dimensions', JSON.stringify(filtered));
        }
      } catch (e) {
        // 解析失败，使用默认维度
        setCustomDimensions(defaultCustomDimensions);
        localStorage.setItem('custom_dimensions', JSON.stringify(defaultCustomDimensions));
      }
    } else {
      setCustomDimensions(defaultCustomDimensions);
      localStorage.setItem('custom_dimensions', JSON.stringify(defaultCustomDimensions));
    }

    const savedHomework = localStorage.getItem(`homework_scores_${selectedDate}`);
    if (savedHomework) {
      setHomeworkScores(JSON.parse(savedHomework));
    }

    const savedError = localStorage.getItem(`error_scores_${selectedDate}`);
    if (savedError) {
      setErrorScores(JSON.parse(savedError));
    }
    setSavedStudents(new Set());
  }, [selectedDate]);

  const updateHomeworkScore = (studentId: number, field: keyof HomeworkScore, value: number) => {
    setHomeworkScores(prev => {
      const updated = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          studentId,
          [field]: value,
          customScores: prev[studentId]?.customScores || {},
        },
      };
      return updated;
    });
    setSavedStudents(prev => {
      const newSet = new Set(prev);
      newSet.delete(studentId);
      return newSet;
    });
  };

  const updateCustomScore = (studentId: number, dimensionId: string, value: number) => {
    setHomeworkScores(prev => {
      const updated = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          studentId,
          customScores: {
            ...prev[studentId]?.customScores,
            [dimensionId]: value,
          },
        },
      };
      return updated;
    });
    setSavedStudents(prev => {
      const newSet = new Set(prev);
      newSet.delete(studentId);
      return newSet;
    });
  };

  const updateErrorScore = (studentId: number, field: keyof ErrorAnalysisScore, value: number) => {
    setErrorScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        [field]: value,
      },
    }));
    setSavedStudents(prev => {
      const newSet = new Set(prev);
      newSet.delete(studentId);
      return newSet;
    });
  };

  const calculateHomeworkTotal = (scores: HomeworkScore | undefined): number => {
    if (!scores) return 0;
    const baseScore = (scores.completionRate || 0) + (scores.accuracy || 0) + (scores.neatness || 0) + (scores.thinking || 0);
    const customScore = Object.values(scores.customScores || {}).reduce((sum, s) => sum + s, 0);
    return baseScore + customScore;
  };

  const calculateErrorTotal = (scores: ErrorAnalysisScore | undefined): number => {
    if (!scores) return 0;
    return (scores.collectionCompleteness || 0) + (scores.analysisDepth || 0) + (scores.improvementMeasures || 0);
  };

  const saveStudent = (studentId: number) => {
    setSavedStudents(prev => new Set(prev).add(studentId));
    if (activeTab === 'homework') {
      localStorage.setItem(`homework_scores_${selectedDate}`, JSON.stringify(homeworkScores));
    } else {
      localStorage.setItem(`error_scores_${selectedDate}`, JSON.stringify(errorScores));
    }
  };

  const saveAll = () => {
    const allIds = activeTab === 'homework' 
      ? Object.keys(homeworkScores).map(Number)
      : Object.keys(errorScores).map(Number);
    setSavedStudents(new Set(allIds));
    if (activeTab === 'homework') {
      localStorage.setItem(`homework_scores_${selectedDate}`, JSON.stringify(homeworkScores));
    } else {
      localStorage.setItem(`error_scores_${selectedDate}`, JSON.stringify(errorScores));
    }
  };

  const addCustomDimension = () => {
    if (!newDimension.name.trim()) return;
    const dimension: CustomDimension = {
      id: `custom_${Date.now()}`,
      name: newDimension.name,
      description: newDimension.description,
      maxScore: newDimension.maxScore,
    };
    const updated = [...customDimensions, dimension];
    setCustomDimensions(updated);
    localStorage.setItem('custom_dimensions', JSON.stringify(updated));
    setNewDimension({ name: '', description: '', maxScore: 10 });
  };

  const removeCustomDimension = (id: string) => {
    const updated = customDimensions.filter(d => d.id !== id);
    setCustomDimensions(updated);
    localStorage.setItem('custom_dimensions', JSON.stringify(updated));
  };

  const getStudentTrendData = (studentId: number) => {
    const dates: string[] = [];
    const homeworkScores_data: number[] = [];
    const errorScores_data: number[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const homeworkSaved = localStorage.getItem(`homework_scores_${dateStr}`);
      const errorSaved = localStorage.getItem(`error_scores_${dateStr}`);
      
      if (homeworkSaved || errorSaved) {
        dates.push(dateStr.slice(5));
        const hw = homeworkSaved ? JSON.parse(homeworkSaved)[studentId] : null;
        const er = errorSaved ? JSON.parse(errorSaved)[studentId] : null;
        homeworkScores_data.push(hw ? calculateHomeworkTotal(hw) : 0);
        errorScores_data.push(er ? calculateErrorTotal(er) : 0);
      }
    }
    
    return dates.map((date, i) => ({ 
      date, 
      homework: homeworkScores_data[i] || 0, 
      error: errorScores_data[i] || 0 
    }));
  };

  const showTrend = (student: StudentInfo) => {
    setSelectedStudentForTrend(student);
    setShowTrendDialog(true);
  };

  const ratedCount = activeTab === 'homework' 
    ? Object.keys(homeworkScores).length 
    : Object.keys(errorScores).length;

  // 计算基础总分上限
  const baseMaxScore = 100; // completionRate(20)+accuracy(40)+neatness(20)+thinking(20)
  const customMaxScore = customDimensions.reduce((sum, d) => sum + d.maxScore, 0);
  const homeworkMaxTotal = baseMaxScore + customMaxScore;

  // 判断是否为创新维度（用于增量控制）
  const isInnovativeDimension = (name: string) => name.includes('创新');

  // 下载模板
  const handleDownloadTemplate = () => {
    const headers = ['学号', '姓名'];
    if (activeTab === 'homework') {
      headers.push('完成率(20)', '正确率(40)', '书写(20)', '思路(20)');
      customDimensions.forEach(dim => headers.push(`${dim.name}(${dim.maxScore})`));
    } else {
      headers.push('收集完整性(30)', '分析深度(40)', '改进措施(30)');
    }
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '模板');
    XLSX.writeFile(wb, `课后评价_${activeTab === 'homework' ? '作业质量' : '错题整理'}_模板.xlsx`);
  };

  // 处理Excel导入
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          alert('Excel文件至少需要两行（表头和数据）');
          return;
        }

        const headers = jsonData[0] as string[];
        // 找到学号所在的列索引
        const idIndex = headers.findIndex(h => h.includes('学号') || h.includes('id') || h.includes('ID'));
        if (idIndex === -1) {
          alert('Excel中未找到“学号”列');
          return;
        }

        if (activeTab === 'homework') {
          // 作业质量评价导入
          const newScores = { ...homeworkScores };
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const studentId = Number(row[idIndex]);
            if (isNaN(studentId)) continue;

            // 尝试解析各个固定维度
            const completionRate = row[headers.indexOf('完成率(20)')] !== undefined ? Number(row[headers.indexOf('完成率(20)')]) : 0;
            const accuracy = row[headers.indexOf('正确率(40)')] !== undefined ? Number(row[headers.indexOf('正确率(40)')]) : 0;
            const neatness = row[headers.indexOf('书写(20)')] !== undefined ? Number(row[headers.indexOf('书写(20)')]) : 0;
            const thinking = row[headers.indexOf('思路(20)')] !== undefined ? Number(row[headers.indexOf('思路(20)')]) : 0;

            // 解析自定义维度
            const customScores: Record<string, number> = {};
            customDimensions.forEach(dim => {
              const colIndex = headers.indexOf(`${dim.name}(${dim.maxScore})`);
              if (colIndex !== -1) {
                customScores[dim.id] = Number(row[colIndex]) || 0;
              }
            });

            newScores[studentId] = {
              studentId,
              completionRate: Math.min(20, Math.max(0, completionRate)),
              accuracy: Math.min(40, Math.max(0, accuracy)),
              neatness: Math.min(20, Math.max(0, neatness)),
              thinking: Math.min(20, Math.max(0, thinking)),
              customScores,
            };
          }
          setHomeworkScores(newScores);
          localStorage.setItem(`homework_scores_${selectedDate}`, JSON.stringify(newScores));
        } else {
          // 错题整理评价导入
          const newScores = { ...errorScores };
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const studentId = Number(row[idIndex]);
            if (isNaN(studentId)) continue;

            const collectionCompleteness = row[headers.indexOf('收集完整性(30)')] !== undefined ? Number(row[headers.indexOf('收集完整性(30)')]) : 0;
            const analysisDepth = row[headers.indexOf('分析深度(40)')] !== undefined ? Number(row[headers.indexOf('分析深度(40)')]) : 0;
            const improvementMeasures = row[headers.indexOf('改进措施(30)')] !== undefined ? Number(row[headers.indexOf('改进措施(30)')]) : 0;

            newScores[studentId] = {
              studentId,
              collectionCompleteness: Math.min(30, Math.max(0, collectionCompleteness)),
              analysisDepth: Math.min(40, Math.max(0, analysisDepth)),
              improvementMeasures: Math.min(30, Math.max(0, improvementMeasures)),
            };
          }
          setErrorScores(newScores);
          localStorage.setItem(`error_scores_${selectedDate}`, JSON.stringify(newScores));
        }

        alert('导入成功！');
        setSavedStudents(new Set()); // 清空保存状态，因为数据已更新
      } catch (error) {
        console.error('导入失败', error);
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
    // 清空 input 以便重新选择同一文件
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {className && (
          <Card className="eco-card-shadow border-[#d4e4d4]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8a9a8a]">当前班级</p>
                  <p className="text-xl font-bold text-[#2c3e2c]">{className}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#4d8b4d]" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a9a8a]">总学生数</p>
                <p className="text-3xl font-bold text-[#2c3e2c]">{sortedStudents.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#4d8b4d]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a9a8a]">已评价</p>
                <p className="text-3xl font-bold text-[#4d8b4d]">{ratedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#4d8b4d]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a9a8a]">已保存</p>
                <p className="text-3xl font-bold text-[#3498db]">{savedStudents.size}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#e3f2fd] flex items-center justify-center">
                <Save className="w-6 h-6 text-[#3498db]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8a9a8a]">自定义维度</p>
                <p className="text-3xl font-bold text-[#e8913a]">{customDimensions.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fff8e1] flex items-center justify-center">
                <Settings className="w-6 h-6 text-[#e8913a]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-[#f0f7f0]">
            <TabsTrigger 
              value="homework" 
              className="data-[state=active]:bg-[#4d8b4d] data-[state=active]:text-white text-base px-5 py-2.5"
            >
              作业质量评价
            </TabsTrigger>
            <TabsTrigger 
              value="error"
              className="data-[state=active]:bg-[#4d8b4d] data-[state=active]:text-white text-base px-5 py-2.5"
            >
              错题整理评价
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {activeTab === 'homework' && (
              <Button
                variant="outline"
                onClick={() => setShowDimensionDialog(true)}
                className="border-[#4d8b4d] text-[#4d8b4d] hover:bg-[#e8f5e9]"
              >
                <Settings className="w-4 h-4 mr-2" />
                管理维度
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="border-[#d4e4d4] text-[#5a6b5a]"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              下载模板
            </Button>
            <Button
              variant="outline"
              onClick={handleImportClick}
              className="border-[#d4e4d4] text-[#5a6b5a]"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              上传文件
            </Button>
            <Button
              onClick={saveAll}
              className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              保存全部
            </Button>
          </div>
        </div>

        <TabsContent value="homework">
          <Card className="eco-card-shadow border-[#d4e4d4]">
            <CardHeader>
              <CardTitle className="text-xl text-[#2c3e2c]">
                作业质量评价 
                <span className="text-sm text-[#8a9a8a] font-normal ml-2">
                  (基础100分 + 自定义维度)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#f0f7f0] z-10">
                    <tr>
                      <th className="px-4 py-4 text-left text-base font-medium text-[#2e5c2e]">学号</th>
                      <th className="px-4 py-4 text-left text-base font-medium text-[#2e5c2e]">姓名</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">完成率(20)</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">正确率(40)</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">书写(20)</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">思路(20)</th>
                      {customDimensions.map(dim => (
                        <th key={dim.id} className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">
                          {dim.name}({dim.maxScore})
                        </th>
                      ))}
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">总分</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">趋势</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student, index) => {
                      const scores = homeworkScores[student.id];
                      const total = calculateHomeworkTotal(scores);
                      const isSaved = savedStudents.has(student.id);
                      
                      return (
                        <tr
                          key={student.id}
                          className={`border-t border-[#e8f5e9] hover:bg-[#f8fbf8] transition-colors ${
                            index % 2 === 1 ? 'bg-[#fafcfa]' : ''
                          }`}
                        >
                          <td className="px-4 py-4 text-base text-[#5a6b5a]">{student.id}</td>
                          <td className="px-4 py-4 text-base font-medium text-[#2c3e2c]">{student.name}</td>
                          
                          {/* 固定维度：完成率 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.completionRate || 0;
                                  updateHomeworkScore(student.id, 'completionRate', current - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{scores?.completionRate || 0}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.completionRate || 0;
                                  updateHomeworkScore(student.id, 'completionRate', Math.min(20, current + 1));
                                }}
                              >
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          {/* 固定维度：正确率 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.accuracy || 0;
                                  updateHomeworkScore(student.id, 'accuracy', current - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{scores?.accuracy || 0}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.accuracy || 0;
                                  updateHomeworkScore(student.id, 'accuracy', Math.min(40, current + 1));
                                }}
                              >
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          {/* 固定维度：书写 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.neatness || 0;
                                  updateHomeworkScore(student.id, 'neatness', current - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{scores?.neatness || 0}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.neatness || 0;
                                  updateHomeworkScore(student.id, 'neatness', Math.min(20, current + 1));
                                }}
                              >
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          {/* 固定维度：思路 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.thinking || 0;
                                  updateHomeworkScore(student.id, 'thinking', current - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{scores?.thinking || 0}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.thinking || 0;
                                  updateHomeworkScore(student.id, 'thinking', Math.min(20, current + 1));
                                }}
                              >
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          {/* 自定义维度：仅剩创新思维 */}
                          {customDimensions.map(dim => {
                            const currentVal = scores?.customScores?.[dim.id] || 0;
                            const max = dim.maxScore;
                            const increment = isInnovativeDimension(dim.name) ? 2 : 1;
                            return (
                              <td key={dim.id} className="px-4 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => {
                                      updateCustomScore(student.id, dim.id, currentVal - increment);
                                    }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">{currentVal}</span>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => {
                                      updateCustomScore(student.id, dim.id, Math.min(max, currentVal + increment));
                                    }}
                                  >
                                    <PlusCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            );
                          })}
                          
                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold text-lg ${
                              total >= homeworkMaxTotal * 0.8 ? 'text-[#4d8b4d]' : 
                              total >= homeworkMaxTotal * 0.6 ? 'text-[#e8913a]' : 
                              'text-[#e74c3c]'
                            }`}>
                              {total}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => showTrend(student)}
                              className="p-2 rounded-lg hover:bg-[#e8f5e9] text-[#4d8b4d] transition-colors"
                            >
                              <TrendingUp className="w-5 h-5" />
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Button
                              size="sm"
                              onClick={() => saveStudent(student.id)}
                              disabled={!scores || isSaved}
                              className={`${
                                isSaved 
                                  ? 'bg-[#e8f5e9] text-[#4d8b4d] cursor-default hover:bg-[#e8f5e9]' 
                                  : 'bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white'
                              }`}
                            >
                              {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="error">
          <Card className="eco-card-shadow border-[#d4e4d4]">
            <CardHeader>
              <CardTitle className="text-xl text-[#2c3e2c]">错题整理评价 (满分100分)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#f0f7f0] z-10">
                    <tr>
                      <th className="px-4 py-4 text-left text-base font-medium text-[#2e5c2e]">学号</th>
                      <th className="px-4 py-4 text-left text-base font-medium text-[#2e5c2e]">姓名</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">收集完整性(30)</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">分析深度(40)</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">改进措施(30)</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">总分</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">趋势</th>
                      <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student, index) => {
                      const scores = errorScores[student.id];
                      const total = calculateErrorTotal(scores);
                      const isSaved = savedStudents.has(student.id);
                      
                      return (
                        <tr
                          key={student.id}
                          className={`border-t border-[#e8f5e9] hover:bg-[#f8fbf8] transition-colors ${
                            index % 2 === 1 ? 'bg-[#fafcfa]' : ''
                          }`}
                        >
                          <td className="px-4 py-4 text-base text-[#5a6b5a]">{student.id}</td>
                          <td className="px-4 py-4 text-base font-medium text-[#2c3e2c]">{student.name}</td>
                          
                          {/* 收集完整性 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.collectionCompleteness || 0;
                                  updateErrorScore(student.id, 'collectionCompleteness', current - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{scores?.collectionCompleteness || 0}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.collectionCompleteness || 0;
                                  updateErrorScore(student.id, 'collectionCompleteness', Math.min(30, current + 1));
                                }}
                              >
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          {/* 分析深度 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.analysisDepth || 0;
                                  updateErrorScore(student.id, 'analysisDepth', current - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{scores?.analysisDepth || 0}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.analysisDepth || 0;
                                  updateErrorScore(student.id, 'analysisDepth', Math.min(40, current + 1));
                                }}
                              >
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          {/* 改进措施 */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.improvementMeasures || 0;
                                  updateErrorScore(student.id, 'improvementMeasures', current - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{scores?.improvementMeasures || 0}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  const current = scores?.improvementMeasures || 0;
                                  updateErrorScore(student.id, 'improvementMeasures', Math.min(30, current + 1));
                                }}
                              >
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          
                          <td className="px-4 py-4 text-center">
                            <span className={`font-bold text-lg ${total >= 80 ? 'text-[#4d8b4d]' : total >= 60 ? 'text-[#e8913a]' : 'text-[#e74c3c]'}`}>
                              {total}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => showTrend(student)}
                              className="p-2 rounded-lg hover:bg-[#e8f5e9] text-[#4d8b4d] transition-colors"
                            >
                              <TrendingUp className="w-5 h-5" />
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Button
                              size="sm"
                              onClick={() => saveStudent(student.id)}
                              disabled={!scores || isSaved}
                              className={`${
                                isSaved 
                                  ? 'bg-[#e8f5e9] text-[#4d8b4d] cursor-default hover:bg-[#e8f5e9]' 
                                  : 'bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white'
                              }`}
                            >
                              {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Dimension Dialog */}
      <Dialog open={showDimensionDialog} onOpenChange={setShowDimensionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">管理自定义评价维度</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Add New Dimension */}
            <div className="p-4 bg-[#f8fbf8] rounded-xl border border-[#e8f5e9]">
              <h4 className="font-medium text-[#2c3e2c] mb-3">添加新维度</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="维度名称"
                  value={newDimension.name}
                  onChange={(e) => setNewDimension(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                />
                <input
                  type="text"
                  placeholder="维度描述"
                  value={newDimension.description}
                  onChange={(e) => setNewDimension(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="满分"
                    value={newDimension.maxScore}
                    onChange={(e) => setNewDimension(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 10 }))}
                    className="w-24 px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                  />
                  <Button
                    onClick={addCustomDimension}
                    className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    添加
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Dimensions */}
            <div className="space-y-2">
              <h4 className="font-medium text-[#2c3e2c]">已有维度</h4>
              {customDimensions.map((dim) => (
                <div key={dim.id} className="flex items-center justify-between p-3 bg-[#f8fbf8] rounded-lg">
                  <div>
                    <span className="font-medium text-[#2c3e2c]">{dim.name}</span>
                    <span className="text-sm text-[#8a9a8a] ml-2">({dim.maxScore}分)</span>
                  </div>
                  <button
                    onClick={() => removeCustomDimension(dim.id)}
                    className="p-2 rounded-lg hover:bg-[#ffebee] text-[#e74c3c] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trend Dialog */}
      <Dialog open={showTrendDialog} onOpenChange={setShowTrendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">
              {selectedStudentForTrend?.name} - 课后评价趋势
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedStudentForTrend ? getStudentTrendData(selectedStudentForTrend.id) : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                  <XAxis dataKey="date" tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #d4e4d4', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="homework" 
                    name="作业质量"
                    stroke="#4d8b4d" 
                    strokeWidth={2}
                    dot={{ fill: '#4d8b4d', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="error" 
                    name="错题整理"
                    stroke="#3498db" 
                    strokeWidth={2}
                    dot={{ fill: '#3498db', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-[#8a9a8a] text-center mt-4">
              显示最近7天的课后评价得分变化趋势
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}