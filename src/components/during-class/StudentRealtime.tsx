import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Plus, Minus, RotateCcw, Users, TrendingUp, Info, Settings, X, Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStudents } from '@/hooks/useStudents';
import type { StudentInfo, EvaluationDimension, StudentSegment } from '@/types';

interface FloatingScore {
  id: number;
  studentId: number;
  points: number;
  dimensionName: string;
  isDeduction: boolean;
}

interface StudentScore {
  studentId: number;
  studentName: string;
  totalScore: number;
  recentAdditions: { dimensionId: string; points: number; timestamp: Date; isDeduction: boolean }[];
  date: string;
}

interface StudentRealtimeProps {
  selectedDate: string;
  segment: StudentSegment;
  className?: string;
  userId?: string;
}

// Default dimensions for each segment
const defaultDimensions: Record<StudentSegment, EvaluationDimension[]> = {
  low: [
    {
      id: 'l1',
      name: '课堂参与度',
      description: '主动举手发言、参与小组活动',
      detailedDescription: '评价学生是否积极参与课堂活动。加分：主动参与1次+1分；扣分：扰乱课堂-1分',
      addPoints: 1,
      deductPoints: 1
    },
    {
      id: 'l2',
      name: '课堂习惯',
      description: '认真倾听、按时完成练习',
      detailedDescription: '评价学生的课堂学习习惯。加分：表现优秀+1分；扣分：未按时完成-1分',
      addPoints: 1,
      deductPoints: 1
    },
    {
      id: 'l3',
      name: '表达与操作',
      description: '大胆表达、积极参与操作',
      detailedDescription: '评价学生的表达能力和动手操作能力。加分：表达完整+2分；扣分：拒绝参与-1分',
      addPoints: 2,
      deductPoints: 1
    },
    {
      id: 'l4',
      name: '合作表现',
      description: '配合同伴、分享成果',
      detailedDescription: '评价学生在小组合作中的表现。加分：合作优秀+1分；扣分：不配合-1分',
      addPoints: 1,
      deductPoints: 1
    },
  ],
  middle: [
    {
      id: 'm1',
      name: '课堂参与与表达',
      description: '主动发言、表达清晰有条理',
      detailedDescription: '评价学生的课堂参与度和表达能力。加分：有价值补充+2分；扣分：扰乱秩序-1分',
      addPoints: 2,
      deductPoints: 1
    },
    {
      id: 'm2',
      name: '习惯培养',
      description: '专注倾听、笔记条理清晰',
      detailedDescription: '评价学生的学习习惯。加分：习惯优秀+1分；扣分：注意力不集中-1分',
      addPoints: 1,
      deductPoints: 1
    },
    {
      id: 'm3',
      name: '解题规范',
      description: '思路清晰、步骤规范',
      detailedDescription: '评价学生的解题规范性。加分：思路清晰+2分；扣分：步骤混乱-1分',
      addPoints: 2,
      deductPoints: 1
    },
    {
      id: 'm4',
      name: '合作探究',
      description: '主动分享、参与讨论',
      detailedDescription: '评价学生在小组合作探究中的表现。加分：合作优秀+1分；扣分：不参与-1分',
      addPoints: 1,
      deductPoints: 1
    },
    {
      id: 'm5',
      name: '纠错与反思',
      description: '主动发现错误、优化思路',
      detailedDescription: '评价学生的纠错与反思能力。加分：主动纠错+1分；扣分：重复犯错-1分',
      addPoints: 1,
      deductPoints: 1
    },
  ],
  high: [
    {
      id: 'h1',
      name: '思维表达',
      description: '清晰阐述思路、逻辑严谨',
      detailedDescription: '评价学生的思维表达能力。加分：思路新颖+2分；扣分：逻辑混乱-1分',
      addPoints: 2,
      deductPoints: 1
    },
    {
      id: 'h2',
      name: '习惯培养',
      description: '专注倾听、笔记条理清晰',
      detailedDescription: '评价学生的学习习惯。加分：习惯优秀+1分；扣分：注意力不集中-1分',
      addPoints: 1,
      deductPoints: 1
    },
    {
      id: 'h3',
      name: '解题创新',
      description: '不同策略、简便方法',
      detailedDescription: '评价学生的解题创新能力。加分：创新解法+2分；扣分：固守旧法-1分',
      addPoints: 2,
      deductPoints: 1
    },
    {
      id: 'h4',
      name: '质疑与探究',
      description: '提出疑问、拓展应用',
      detailedDescription: '评价学生的质疑与探究能力。加分：有价值疑问+2分；扣分：不加思考-1分',
      addPoints: 2,
      deductPoints: 1
    },
    {
      id: 'h5',
      name: '合作与互评',
      description: '主导任务、准确互评',
      detailedDescription: '评价学生的合作与互评能力。加分：互评优秀+1分；扣分：互评敷衍-1分',
      addPoints: 1,
      deductPoints: 1
    },
  ],
};

export function StudentRealtime({ selectedDate, segment, className }: StudentRealtimeProps) {
  // 使用 useMemo 缓存 classInfo
  const classInfo = useMemo(() => {
    if (!className) return undefined;
    return {
      grade: className.split('(')[0],
      classNumber: parseInt(className.match(/\d+/)?.[0] || '1'),
      fullName: className,
    };
  }, [className]);

  const { students } = useStudents(classInfo);
  const [dimensions, setDimensions] = useState<EvaluationDimension[]>([]);
  const [studentScores, setStudentScores] = useState<Record<number, StudentScore>>({});
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showDimensionInfo, setShowDimensionInfo] = useState(false);
  const [showDimensionEdit, setShowDimensionEdit] = useState(false);
  const [showTrendDialog, setShowTrendDialog] = useState(false);
  const [selectedStudentForTrend, setSelectedStudentForTrend] = useState<StudentInfo | null>(null);
  const [trendData, setTrendData] = useState<Array<{ date: string; score: number }>>([]);
  const [editingDimension, setEditingDimension] = useState<EvaluationDimension | null>(null);
  const [newDimension, setNewDimension] = useState<Partial<EvaluationDimension>>({
    name: '',
    description: '',
    detailedDescription: '',
    addPoints: 1,
    deductPoints: 1,
  });

  const storageKey = `dimensions_${segment}`;

  // Load dimensions and scores
  useEffect(() => {
    const savedDimensions = localStorage.getItem(storageKey);
    if (savedDimensions) {
      setDimensions(JSON.parse(savedDimensions));
    } else {
      setDimensions(defaultDimensions[segment]);
      localStorage.setItem(storageKey, JSON.stringify(defaultDimensions[segment]));
    }

    const savedScores = localStorage.getItem(`realtime_scores_${selectedDate}_${className}`);
    if (savedScores) {
      setStudentScores(JSON.parse(savedScores));
    } else {
      setStudentScores({});
    }
  }, [segment, storageKey, selectedDate, className]);

  const saveDimensions = useCallback((newDims: EvaluationDimension[]) => {
    setDimensions(newDims);
    localStorage.setItem(storageKey, JSON.stringify(newDims));
  }, [storageKey]);

  const addScore = useCallback((studentId: number, dimensionId: string, points: number, dimensionName: string, isDeduction: boolean = false) => {
    setStudentScores(prev => {
      const current = prev[studentId] || {
        studentId,
        studentName: students.find(s => s.id === studentId)?.name || `学生${studentId}`,
        totalScore: 0,
        recentAdditions: [],
        date: selectedDate,
      };
      
      const newScore = isDeduction 
        ? Math.max(0, current.totalScore - points)
        : current.totalScore + points;
      
      const updated = {
        ...prev,
        [studentId]: {
          ...current,
          totalScore: newScore,
          recentAdditions: [
            ...current.recentAdditions,
            { dimensionId, points, timestamp: new Date(), isDeduction },
          ].slice(-5),
        },
      };
      
      localStorage.setItem(`realtime_scores_${selectedDate}_${className}`, JSON.stringify(updated));
      return updated;
    });

    const newFloatingScore: FloatingScore = {
      id: Date.now(),
      studentId,
      points,
      dimensionName,
      isDeduction,
    };
    setFloatingScores(prev => [...prev, newFloatingScore]);
    
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(fs => fs.id !== newFloatingScore.id));
    }, 1000);

    setLastUpdated(new Date());
  }, [students, selectedDate, className]);

  const resetStudentScore = useCallback((studentId: number) => {
    setStudentScores(prev => {
      const newScores = { ...prev };
      delete newScores[studentId];
      localStorage.setItem(`realtime_scores_${selectedDate}_${className}`, JSON.stringify(newScores));
      return newScores;
    });
  }, [selectedDate, className]);

  const resetAllScores = useCallback(() => {
    setStudentScores({});
    localStorage.removeItem(`realtime_scores_${selectedDate}_${className}`);
  }, [selectedDate, className]);

  const addDimension = useCallback(() => {
    if (!newDimension.name?.trim()) return;
    const dimension: EvaluationDimension = {
      id: `custom_${Date.now()}`,
      name: newDimension.name,
      description: newDimension.description || '',
      detailedDescription: newDimension.detailedDescription || '',
      addPoints: newDimension.addPoints || 1,
      deductPoints: newDimension.deductPoints || 1,
    };
    saveDimensions([...dimensions, dimension]);
    setNewDimension({ name: '', description: '', detailedDescription: '', addPoints: 1, deductPoints: 1 });
  }, [newDimension, dimensions, saveDimensions]);

  const updateDimension = useCallback(() => {
    if (!editingDimension) return;
    const updated = dimensions.map(d => 
      d.id === editingDimension.id ? editingDimension : d
    );
    saveDimensions(updated);
    setEditingDimension(null);
  }, [editingDimension, dimensions, saveDimensions]);

  const deleteDimension = useCallback((id: string) => {
    const updated = dimensions.filter(d => d.id !== id);
    saveDimensions(updated);
  }, [dimensions, saveDimensions]);

  const leaderboard = useMemo(() => {
    return Object.values(studentScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }, [studentScores]);

  const getStudentRank = useCallback((studentId: number): number => {
    const index = leaderboard.findIndex(s => s.studentId === studentId);
    return index >= 0 ? index + 1 : 0;
  }, [leaderboard]);

  const getSegmentLabel = useCallback((s: StudentSegment): string => {
    switch (s) {
      case 'low': return '低段 (1-2年级)';
      case 'middle': return '中段 (3-4年级)';
      case 'high': return '高段 (5-6年级)';
    }
  }, []);

  // 获取学生趋势数据
  const getStudentTrendData = useCallback((studentId: number) => {
    const trendPoints: Array<{ date: string; score: number }> = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = dateStr.slice(5); // MM-DD
      
      const saved = localStorage.getItem(`realtime_scores_${dateStr}_${className}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data[studentId]) {
            trendPoints.push({
              date: displayDate,
              score: data[studentId].totalScore
            });
          } else {
            trendPoints.push({
              date: displayDate,
              score: 0
            });
          }
        } catch (e) {
          trendPoints.push({
            date: displayDate,
            score: 0
          });
        }
      } else {
        trendPoints.push({
          date: displayDate,
          score: 0
        });
      }
    }
    
    return trendPoints;
  }, [className]);

  // 显示趋势对话框
  const showTrend = useCallback((student: StudentInfo) => {
    console.log('双击学生:', student);
    if (!student) return;
    
    setSelectedStudentForTrend(student);
    const data = getStudentTrendData(student.id);
    console.log('趋势数据:', data);
    setTrendData(data);
    setShowTrendDialog(true);
  }, [getStudentTrendData]);

  const ratedCount = Object.keys(studentScores).length;

  return (
    <div className="space-y-6">
      {/* Segment Display */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-base text-[#5a6b5a]">当前学段：</span>
              <span className="px-4 py-2 bg-[#4d8b4d] text-white rounded-xl text-base font-medium">
                {getSegmentLabel(segment)}
              </span>
              <span className="text-sm text-[#8a9a8a]">
                (根据年级自动识别)
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDimensionInfo(true)}
                className="border-[#4d8b4d] text-[#4d8b4d] hover:bg-[#e8f5e9]"
              >
                <Info className="w-4 h-4 mr-2" />
                维度说明
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDimensionEdit(true)}
                className="border-[#3498db] text-[#3498db] hover:bg-[#e3f2fd]"
              >
                <Settings className="w-4 h-4 mr-2" />
                自定义维度
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllScores}
                className="border-[#d4e4d4] text-[#8a9a8a]"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dimensions Panel */}
        <Card className="eco-card-shadow border-[#d4e4d4] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-[#2c3e2c]">评价维度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dimensions.map((dim) => (
                <div
                  key={dim.id}
                  className="p-4 bg-[#f8fbf8] rounded-xl border border-[#e8f5e9] hover:border-[#4d8b4d] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-base text-[#2c3e2c]">{dim.name}</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-0.5 bg-[#e8f5e9] text-[#4d8b4d] rounded text-xs">+{dim.addPoints}</span>
                      <span className="px-2 py-0.5 bg-[#ffebee] text-[#e74c3c] rounded text-xs">-{dim.deductPoints}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#8a9a8a]">{dim.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        <Card className="eco-card-shadow border-[#d4e4d4] lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[#2c3e2c] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4d8b4d]" />
                学生列表
              </CardTitle>
              <span className="text-xs text-[#8a9a8a]">单击选择 | 双击趋势</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {students.map((student) => {
                const score = studentScores[student.id]?.totalScore || 0;
                const isSelected = selectedStudent === student.id;
                const rank = getStudentRank(student.id);
                
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    onDoubleClick={() => showTrend(student)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-[#4d8b4d] text-white ring-1 ring-[#4d8b4d]'
                        : score > 0
                        ? 'bg-[#e8f5e9] text-[#4d8b4d] hover:bg-[#d4e8d4]'
                        : 'hover:bg-[#f0f7f0] text-[#5a6b5a]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-mono ${
                        isSelected ? 'text-white/80' : 'text-[#8a9a8a]'
                      }`}>
                        #{String(student.id).padStart(2, '0')}
                      </span>
                      <span className={`text-sm truncate ${
                        isSelected ? 'font-medium' : ''
                      }`}>
                        {student.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {score > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-[#4d8b4d]'
                        }`}>
                          {score}分
                        </span>
                      )}
                      {rank > 0 && rank <= 3 && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          rank === 1
                            ? 'bg-[#f4c430] text-white'
                            : rank === 2
                            ? 'bg-[#c0c0c0] text-white'
                            : 'bg-[#cd7f32] text-white'
                        }`}>
                          {rank}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {students.length === 0 && (
              <div className="py-8 text-center text-[#8a9a8a] text-sm">
                暂无学生数据
              </div>
            )}
            
            <p className="text-xs text-[#8a9a8a] text-center mt-3 border-t border-[#e8f5e9] pt-3">
              {students.length} 名学生 · 单击选择 · 双击查看趋势
            </p>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="eco-card-shadow border-[#d4e4d4] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-[#2c3e2c] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#f4c430]" />
              实时排行榜
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((student, index) => (
                  <div
                    key={student.studentId}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      index === 0
                        ? 'bg-gradient-to-r from-[#fff8e1] to-[#fffef0] border border-[#f4c430]/30'
                        : index === 1
                        ? 'bg-gradient-to-r from-[#f5f5f5] to-[#fafafa] border border-[#c0c0c0]/30'
                        : index === 2
                        ? 'bg-gradient-to-r from-[#fff5e6] to-[#fffaf0] border border-[#cd7f32]/30'
                        : 'bg-[#f8fbf8]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-[#f4c430] text-white'
                        : index === 1
                        ? 'bg-[#c0c0c0] text-white'
                        : index === 2
                        ? 'bg-[#cd7f32] text-white'
                        : 'bg-[#e8f5e9] text-[#4d8b4d]'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className="text-base font-medium text-[#2c3e2c]">
                        {student.studentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-[#4d8b4d]" />
                      <span className="text-xl font-bold text-[#4d8b4d]">{student.totalScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[#8a9a8a]">暂无评分数据</p>
                <p className="text-xs text-[#8a9a8a] mt-1">选择学生并点击加分按钮</p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-[#e8f5e9]">
              <p className="text-sm text-[#8a9a8a] text-center">
                最后更新: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Student Actions */}
      {selectedStudent && (
        <Card className="eco-card-shadow border-[#4d8b4d] animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-xl text-[#2c3e2c]">
                为 {students.find(s => s.id === selectedStudent)?.name} 评分
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-base text-[#8a9a8a]">当前得分:</span>
                <span className="text-2xl font-bold text-[#4d8b4d]">
                  {studentScores[selectedStudent]?.totalScore || 0}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetStudentScore(selectedStudent)}
                  className="border-[#d4e4d4] text-[#8a9a8a]"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  重置
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {dimensions.map((dim) => (
                <div key={dim.id} className="space-y-3">
                  <p className="text-sm text-[#5a6b5a] text-center font-medium">{dim.name}</p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => addScore(selectedStudent, dim.id, dim.addPoints, dim.name, false)}
                      className="w-12 h-12 rounded-xl bg-[#e8f5e9] hover:bg-[#4d8b4d] text-[#4d8b4d] hover:text-white transition-all flex items-center justify-center"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => addScore(selectedStudent, dim.id, dim.deductPoints, dim.name, true)}
                      className="w-12 h-12 rounded-xl bg-[#ffebee] hover:bg-[#e74c3c] text-[#e74c3c] hover:text-white transition-all flex items-center justify-center"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dimension Info Dialog */}
      <Dialog open={showDimensionInfo} onOpenChange={setShowDimensionInfo}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">
              {getSegmentLabel(segment)} - 评价维度详细说明
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {dimensions.map((dim) => (
              <div key={dim.id} className="p-4 bg-[#f8fbf8] rounded-xl border border-[#e8f5e9]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-lg text-[#2c3e2c]">{dim.name}</h4>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-[#e8f5e9] text-[#4d8b4d] rounded-full text-sm font-medium">
                      加分 +{dim.addPoints}
                    </span>
                    <span className="px-3 py-1 bg-[#ffebee] text-[#e74c3c] rounded-full text-sm font-medium">
                      扣分 -{dim.deductPoints}
                    </span>
                  </div>
                </div>
                <p className="text-base text-[#5a6b5a]">{dim.detailedDescription}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dimension Edit Dialog */}
      <Dialog open={showDimensionEdit} onOpenChange={setShowDimensionEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">自定义评价维度</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Add New Dimension */}
            <div className="p-4 bg-[#f0f7f0] rounded-xl border border-[#e8f5e9]">
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
                  placeholder="简短描述"
                  value={newDimension.description}
                  onChange={(e) => setNewDimension(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                />
                <textarea
                  placeholder="详细说明（加分/扣分规则）"
                  value={newDimension.detailedDescription}
                  onChange={(e) => setNewDimension(prev => ({ ...prev, detailedDescription: e.target.value }))}
                  className="w-full h-20 px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d] resize-none"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-[#5a6b5a]">加分分值</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newDimension.addPoints}
                      onChange={(e) => setNewDimension(prev => ({ ...prev, addPoints: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-[#5a6b5a]">扣分分值</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newDimension.deductPoints}
                      onChange={(e) => setNewDimension(prev => ({ ...prev, deductPoints: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={addDimension}
                      className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Dimensions */}
            <div className="space-y-2">
              <h4 className="font-medium text-[#2c3e2c]">已有维度</h4>
              {dimensions.map((dim) => (
                <div key={dim.id} className="flex items-center justify-between p-3 bg-[#f8fbf8] rounded-lg">
                  {editingDimension?.id === dim.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editingDimension.name}
                        onChange={(e) => setEditingDimension({ ...editingDimension, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#d4e4d4] rounded text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingDimension.addPoints}
                          onChange={(e) => setEditingDimension({ ...editingDimension, addPoints: parseInt(e.target.value) || 1 })}
                          className="w-16 px-2 py-1 bg-white border border-[#d4e4d4] rounded text-sm"
                        />
                        <input
                          type="number"
                          value={editingDimension.deductPoints}
                          onChange={(e) => setEditingDimension({ ...editingDimension, deductPoints: parseInt(e.target.value) || 1 })}
                          className="w-16 px-2 py-1 bg-white border border-[#d4e4d4] rounded text-sm"
                        />
                        <Button size="sm" onClick={updateDimension} className="bg-[#4d8b4d] text-white">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingDimension(null)}>
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="font-medium text-[#2c3e2c]">{dim.name}</span>
                        <span className="text-sm text-[#8a9a8a] ml-2">
                          +{dim.addPoints}/-{dim.deductPoints}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingDimension(dim)}
                          className="p-2 rounded-lg hover:bg-[#e3f2fd] text-[#3498db] transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDimension(dim.id)}
                          className="p-2 rounded-lg hover:bg-[#ffebee] text-[#e74c3c] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
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
              {selectedStudentForTrend?.name || '学生'} - 课堂表现趋势
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="h-72">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                    <XAxis dataKey="date" tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                    <YAxis domain={[0, 'auto']} tick={{ fill: '#5a6b5a', fontSize: 12 }} />
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
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[#8a9a8a]">暂无趋势数据</p>
                </div>
              )}
            </div>
            <p className="text-sm text-[#8a9a8a] text-center mt-4">
              显示最近7天的课堂即时评价得分变化趋势
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Scores */}
      {floatingScores.map((fs) => (
        <div
          key={fs.id}
          className="fixed pointer-events-none z-50 animate-score-pop"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className={`text-5xl font-bold ${fs.isDeduction ? 'text-[#e74c3c]' : 'text-[#4d8b4d]'}`}>
            {fs.isDeduction ? '-' : '+'}{fs.points}
          </div>
        </div>
      ))}
    </div>
  );
}