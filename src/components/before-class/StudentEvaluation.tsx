import { useState, useEffect, useCallback, useMemo } from 'react';
import { Star, Save, Search, CheckCircle, Upload, TrendingUp, User, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStudents } from '@/hooks/useStudents';
import type { StudentInfo } from '@/types';

interface StudentRating {
  studentId: number;
  completion: number;
  neatness: number;
  thinking: number;
}

interface StudentEvaluationProps {
  selectedDate: string;
  className?: string;
  userId?: string;
  isAdmin?: boolean;
}

export function StudentEvaluation({ selectedDate, className, userId: _userId, isAdmin: _isAdmin }: StudentEvaluationProps) {
  // 使用 useMemo 缓存 classInfo，避免重复创建
  const classInfo = useMemo(() => {
    if (!className) return undefined;
    return {
      grade: className.split('(')[0],
      classNumber: parseInt(className.match(/\d+/)?.[0] || '1'),
      fullName: className,
    };
  }, [className]);

  const { students, importStudents } = useStudents(classInfo);

  const [ratings, setRatings] = useState<Record<number, StudentRating>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [savedStudents, setSavedStudents] = useState<Set<number>>(new Set());
  const [hoveredStar, setHoveredStar] = useState<{ studentId: number; category: string; star: number } | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTrendDialog, setShowTrendDialog] = useState(false);
  const [selectedStudentForTrend, setSelectedStudentForTrend] = useState<StudentInfo | null>(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // 使用 useMemo 缓存 storage key
  const storageKey = useMemo(() => {
    return `preview_ratings_${selectedDate}_${className}`;
  }, [selectedDate, className]);

  // Load saved ratings for selected date
  useEffect(() => {
    if (!className) return;
    
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setRatings(JSON.parse(saved));
      } catch (e) {
        console.error('解析保存数据失败:', e);
        setRatings({});
      }
    } else {
      setRatings({});
    }
    setSavedStudents(new Set());
  }, [storageKey, className]);

  // 使用 useMemo 缓存过滤后的学生列表
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.id.toString().includes(searchQuery);
      return matchesSearch;
    });
  }, [students, searchQuery]);

  const handleRating = (studentId: number, category: keyof StudentRating, value: number) => {
    setRatings(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        [category]: value,
      },
    }));
    setSavedStudents(prev => {
      const newSet = new Set(prev);
      newSet.delete(studentId);
      return newSet;
    });
  };

  const calculateTotal = (rating: StudentRating | undefined): number => {
    if (!rating) return 0;
    const total = (rating.completion || 0) + (rating.neatness || 0) + (rating.thinking || 0);
    return Math.round((total / 15) * 100);
  };

  const getStarLevel = (percentage: number): string => {
    if (percentage >= 90) return '五星';
    if (percentage >= 75) return '四星';
    if (percentage >= 60) return '三星';
    if (percentage >= 45) return '二星';
    return '一星';
  };

  const saveStudentRating = (studentId: number) => {
    setSavedStudents(prev => new Set(prev).add(studentId));
    localStorage.setItem(storageKey, JSON.stringify(ratings));
  };

  const saveAllRatings = () => {
    const ratedStudentIds = Object.keys(ratings).map(Number);
    setSavedStudents(new Set(ratedStudentIds));
    localStorage.setItem(storageKey, JSON.stringify(ratings));
  };

  // 处理文本导入
  const handleTextImport = useCallback(() => {
    try {
      const lines = importText.trim().split('\n');
      const newStudents: Array<{ id: number; name: string }> = [];
      
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return;
        
        const parts = trimmedLine.split(/[,，\s\t]+/);
        
        if (parts.length >= 2) {
          const id = parseInt(parts[0]);
          if (!isNaN(id)) {
            newStudents.push({
              id: id,
              name: parts.slice(1).join(' ').trim(),
            });
          } else {
            const possibleId = parseInt(parts[parts.length - 1]);
            if (!isNaN(possibleId)) {
              newStudents.push({
                id: possibleId,
                name: parts.slice(0, -1).join(' ').trim(),
              });
            }
          }
        }
      });
      
      if (newStudents.length > 0) {
        newStudents.sort((a, b) => a.id - b.id);
        
        if (!importStudents) {
          setImportError('❌ 导入功能未初始化，请刷新页面重试');
          return;
        }
        
        const success = importStudents(newStudents);
        if (success) {
          setShowImportDialog(false);
          setImportText('');
          setImportError('');
          alert(`✅ 成功导入 ${newStudents.length} 名学生`);
        } else {
          setImportError('❌ 导入失败，请检查班级信息或重试');
        }
      } else {
        setImportError('❌ 未找到有效的学生信息\n\n格式示例：\n1 张三\n2 李四\n3 王五');
      }
    } catch (error) {
      console.error('导入错误:', error);
      setImportError('❌ 导入格式错误，请使用"学号 姓名"格式，每行一个学生');
    }
  }, [importText, importStudents]);

  // 添加示例数据
  const addExampleData = useCallback(() => {
    const exampleText = `1 张三
2 李四
3 王五
4 赵六
5 孙七
6 周八
7 吴九
8 郑十`;
    setImportText(exampleText);
  }, []);

  // 清空输入
  const clearInput = useCallback(() => {
    setImportText('');
    setImportError('');
  }, []);

  const getStudentTrendData = useCallback((studentId: number) => {
    const dates: string[] = [];
    const scores: number[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const saved = localStorage.getItem(`preview_ratings_${dateStr}_${className}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data[studentId]) {
            dates.push(dateStr.slice(5));
            scores.push(calculateTotal(data[studentId]));
          }
        } catch (e) {
          console.error('解析趋势数据失败:', e);
        }
      }
    }
    
    if (dates.length === 0) {
      return [{ date: '暂无数据', score: 0 }];
    }
    
    return dates.map((date, i) => ({ date, score: scores[i] || 0 }));
  }, [className]);

  const showTrend = useCallback((student: StudentInfo) => {
    setSelectedStudentForTrend(student);
    setShowTrendDialog(true);
  }, []);

  const renderStarRating = useCallback((
    studentId: number,
    category: keyof StudentRating,
    value: number = 0
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isHovered = hoveredStar?.studentId === studentId &&
                           hoveredStar?.category === category &&
                           hoveredStar?.star >= star;
          const isFilled = value >= star;
          
          return (
            <button
              key={star}
              onClick={() => handleRating(studentId, category, star)}
              onMouseEnter={() => setHoveredStar({ studentId, category, star })}
              onMouseLeave={() => setHoveredStar(null)}
              className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
              type="button"
            >
              <Star
                className={`w-6 h-6 transition-all duration-200 ${
                  isHovered || isFilled
                    ? 'fill-[#f4c430] text-[#f4c430]'
                    : 'fill-transparent text-[#d4e4d4]'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  }, [hoveredStar]);

  const ratedCount = Object.keys(ratings).length;
  const savedCount = savedStudents.size;

  if (!className) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">请先选择班级</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - 保持不变 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8a9a8a]">总学生数</p>
                <p className="text-2xl md:text-3xl font-bold text-[#2c3e2c]">{students.length}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center">
                <User className="w-5 h-5 md:w-6 md:h-6 text-[#4d8b4d]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8a9a8a]">已评价</p>
                <p className="text-2xl md:text-3xl font-bold text-[#4d8b4d]">{ratedCount}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-[#4d8b4d]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8a9a8a]">已保存</p>
                <p className="text-2xl md:text-3xl font-bold text-[#3498db]">{savedCount}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#e3f2fd] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-[#3498db]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8a9a8a]">待评价</p>
                <p className="text-2xl md:text-3xl font-bold text-[#e8913a]">{students.length - ratedCount}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#fff8e1] flex items-center justify-center">
                <span className="text-xl md:text-2xl">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-[#8a9a8a]" />
              <input
                type="text"
                placeholder="搜索学号或姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 md:px-4 md:py-2.5 bg-[#f8fbf8] border border-[#d4e4d4] rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="border-[#4d8b4d] text-[#4d8b4d] hover:bg-[#e8f5e9] text-sm md:text-base"
            >
              <Upload className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">导入学生</span>
              <span className="sm:hidden">导入</span>
            </Button>
            <Button
              onClick={saveAllRatings}
              className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white text-sm md:text-base"
            >
              <Save className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">保存全部</span>
              <span className="sm:hidden">保存</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Table */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl text-[#2c3e2c]">课前预习单评价</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[#f0f7f0]">
                  <th className="px-3 py-3 text-left text-sm font-medium text-[#2e5c2e]">学号</th>
                  <th className="px-3 py-3 text-left text-sm font-medium text-[#2e5c2e]">姓名</th>
                  <th className="px-3 py-3 text-center text-sm font-medium text-[#2e5c2e]">完成情况</th>
                  <th className="px-3 py-3 text-center text-sm font-medium text-[#2e5c2e]">书写工整</th>
                  <th className="px-3 py-3 text-center text-sm font-medium text-[#2e5c2e]">思考深度</th>
                  <th className="px-3 py-3 text-center text-sm font-medium text-[#2e5c2e]">等级</th>
                  <th className="px-3 py-3 text-center text-sm font-medium text-[#2e5c2e]">趋势</th>
                  <th className="px-3 py-3 text-center text-sm font-medium text-[#2e5c2e]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => {
                  const rating = ratings[student.id];
                  const totalPercentage = calculateTotal(rating);
                  const isSaved = savedStudents.has(student.id);
                  
                  return (
                    <tr
                      key={student.id}
                      className={`border-t border-[#e8f5e9] hover:bg-[#f8fbf8] transition-colors ${
                        index % 2 === 1 ? 'bg-[#fafcfa]' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-sm text-[#5a6b5a]">{student.id}</td>
                      <td className="px-3 py-3 text-sm font-medium text-[#2c3e2c]">{student.name}</td>
                      <td className="px-3 py-3 text-center">
                        {renderStarRating(student.id, 'completion', rating?.completion)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {renderStarRating(student.id, 'neatness', rating?.neatness)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {renderStarRating(student.id, 'thinking', rating?.thinking)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {rating ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            totalPercentage >= 80 ? 'bg-[#e8f5e9] text-[#4d8b4d]' :
                            totalPercentage >= 60 ? 'bg-[#fff8e1] text-[#e8913a]' :
                            'bg-[#ffebee] text-[#e74c3c]'
                          }`}>
                            <Star className="w-3 h-3 fill-current" />
                            {getStarLevel(totalPercentage)}
                          </span>
                        ) : (
                          <span className="text-sm text-[#8a9a8a]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => showTrend(student)}
                          className="p-2 rounded-lg hover:bg-[#e8f5e9] text-[#4d8b4d] transition-colors"
                          type="button"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Button
                          size="sm"
                          onClick={() => saveStudentRating(student.id)}
                          disabled={!rating || isSaved}
                          className={`${
                            isSaved
                              ? 'bg-[#e8f5e9] text-[#4d8b4d] cursor-default'
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
          
          {filteredStudents.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-base md:text-lg text-[#8a9a8a]">没有找到匹配的学生</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">导入学生信息</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              每行一个学生，格式：学号 姓名（用空格或逗号分隔）
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-[#f8fbf8] rounded-xl border border-[#e8f5e9] p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-[#2c3e2c]">学生名单</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addExampleData}
                    className="text-xs border-[#4d8b4d] text-[#4d8b4d]"
                  >
                    示例数据
                  </Button>
                  {importText && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearInput}
                      className="text-xs border-gray-300 text-gray-600"
                    >
                      清空
                    </Button>
                  )}
                </div>
              </div>
              
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="例如：&#10;1 张三&#10;2 李四&#10;3 王五"
                className="w-full h-48 px-4 py-3 bg-white border border-[#d4e4d4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d] resize-none font-mono"
              />
              
              <p className="text-xs text-gray-400 mt-2">
                💡 支持格式：学号 姓名、学号,姓名、学号 姓 名
              </p>
            </div>

            {importError && (
              <div className="text-sm text-[#e74c3c] bg-[#ffebee] p-3 rounded-lg whitespace-pre-line">
                {importError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false);
                  setImportError('');
                  setImportText('');
                }}
                className="flex-1 border-[#d4e4d4] text-[#5a6b5a]"
              >
                取消
              </Button>
              <Button
                onClick={handleTextImport}
                disabled={!importText.trim()}
                className="flex-1 bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 mr-2" />
                确认导入
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trend Dialog */}
      <Dialog open={showTrendDialog} onOpenChange={setShowTrendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">
              {selectedStudentForTrend?.name} - 评价趋势
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedStudentForTrend ? getStudentTrendData(selectedStudentForTrend.id) : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                  <XAxis dataKey="date" tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #d4e4d4', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4d8b4d" 
                    strokeWidth={2}
                    dot={{ fill: '#4d8b4d', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-[#8a9a8a] text-center mt-4">
              显示最近7天的预习评价得分变化趋势
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}