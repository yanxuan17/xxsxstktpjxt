import { useState, useEffect } from 'react';
import { ClipboardList, Plus, FileText, BarChart3, User, X, CheckCircle, Star, Lightbulb, Share2, Copy, Check, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { conceptLessonObservations, problemSolvingObservations } from '@/data/evaluationData';
import type { LessonType, GradeLevel, ObserverEvaluation } from '@/types';

const gradeOptions: { value: GradeLevel; label: string; color: string }[] = [
  { value: 'excellent', label: '优', color: 'bg-[#e8f5e9] text-[#4d8b4d] border-[#4d8b4d]' },
  { value: 'good', label: '良', color: 'bg-[#fff8e1] text-[#e8913a] border-[#e8913a]' },
  { value: 'average', label: '一般', color: 'bg-[#ffebee] text-[#e74c3c] border-[#e74c3c]' },
];

// 扩展观察评价类型，增加授课主题字段（仅用于本地）
interface ExtendedObserverEvaluation extends ObserverEvaluation {
  lessonTitle?: string;
}

interface TeacherObservationProps {
  selectedDate: string;
}

export function TeacherObservation({ selectedDate }: TeacherObservationProps) {
  const [lessonType, setLessonType] = useState<LessonType>('concept');
  const [evaluations, setEvaluations] = useState<ExtendedObserverEvaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<Partial<ExtendedObserverEvaluation>>({
    observerName: '',
    teacherName: '',
    lessonTitle: '',
    lessonType: 'concept',
    items: [],
    summary: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  // 从课前教案中获取授课教师和教案名称选项
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [lessonOptions, setLessonOptions] = useState<Array<{ teacher: string; title: string }>>([]);

  useEffect(() => {
    // 加载观课评价
    const saved = localStorage.getItem(`observations_${selectedDate}`);
    if (saved) {
      setEvaluations(JSON.parse(saved));
    }

    // 加载课前教案数据，构建选项
    const teachers = new Set<string>();
    const lessons: Array<{ teacher: string; title: string }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('lesson_plan_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          if (data.teacherName && data.lessonTitle) {
            teachers.add(data.teacherName);
            lessons.push({ teacher: data.teacherName, title: data.lessonTitle });
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    setTeacherOptions(Array.from(teachers));
    setLessonOptions(lessons);
  }, [selectedDate]);

  // 根据当前选择的教师过滤教案选项
  const filteredLessonOptions = lessonOptions.filter(
    (item) => item.teacher === currentEvaluation.teacherName
  );

  const handleGradeSelect = (itemId: string, grade: GradeLevel) => {
    setCurrentEvaluation(prev => {
      const existingItems = prev.items || [];
      const updatedItems = existingItems.filter(item => {
        const itemKey = `${item.dimension}-${item.point}`;
        return itemKey !== itemId;
      });
      
      for (const dim of observationData) {
        for (const item of dim.items) {
          if (`${dim.dimension}-${item.point}` === itemId) {
            updatedItems.push({
              dimension: dim.dimension,
              point: item.point,
              grade,
              note: '',
            });
            break;
          }
        }
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  const getSelectedGrade = (itemId: string): GradeLevel | null => {
    const item = currentEvaluation.items?.find(i => `${i.dimension}-${i.point}` === itemId);
    return item?.grade || null;
  };

  const submitEvaluation = () => {
    if (!currentEvaluation.observerName || !currentEvaluation.teacherName || !currentEvaluation.lessonTitle || (currentEvaluation.items?.length || 0) === 0) {
      alert('请填写观课人姓名、选择授课教师、授课主题并完成评价');
      return;
    }

    const newEvaluation: ExtendedObserverEvaluation = {
      id: `obs_${Date.now()}`,
      observerName: currentEvaluation.observerName!,
      teacherName: currentEvaluation.teacherName!,
      lessonTitle: currentEvaluation.lessonTitle,
      lessonType: currentEvaluation.lessonType as LessonType,
      items: currentEvaluation.items || [],
      summary: currentEvaluation.summary || '',
      timestamp: Date.now(),
      date: selectedDate,
    };

    const updatedEvaluations = [...evaluations, newEvaluation];
    setEvaluations(updatedEvaluations);
    localStorage.setItem(`observations_${selectedDate}`, JSON.stringify(updatedEvaluations));
    
    setCurrentEvaluation({
      observerName: '',
      teacherName: '',
      lessonTitle: '',
      lessonType: 'concept',
      items: [],
      summary: '',
    });
    setIsDialogOpen(false);
  };

  const generateReport = () => {
    setShowReport(true);
  };

  const generateShareLink = () => {
    const token = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const link = `${window.location.origin}/mobile-evaluation?token=${token}&date=${selectedDate}`;
    setShareLink(link);
    setShareDialogOpen(true);
    
    // Store the share token
    localStorage.setItem(`share_token_${token}`, JSON.stringify({
      date: selectedDate,
      createdAt: new Date().toISOString(),
    }));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const observationData = lessonType === 'concept' ? conceptLessonObservations : problemSolvingObservations;

  const calculateStats = () => {
    const stats: Record<string, { excellent: number; good: number; average: number; total: number }> = {};
    
    evaluations.forEach(evaluation => {
      evaluation.items.forEach(item => {
        if (!item.grade) return;
        if (!stats[item.dimension]) {
          stats[item.dimension] = { excellent: 0, good: 0, average: 0, total: 0 };
        }
        stats[item.dimension][item.grade]++;
        stats[item.dimension].total++;
      });
    });

    return stats;
  };

  const generateHighlightsAndImprovements = () => {
    const stats = calculateStats();
    const highlights: string[] = [];
    const improvements: string[] = [];

    Object.entries(stats).forEach(([dimension, data]) => {
      const excellentRate = data.total > 0 ? (data.excellent / data.total) * 100 : 0;
      const averageRate = data.total > 0 ? (data.average / data.total) * 100 : 0;

      if (excellentRate >= 70) {
        highlights.push(`${dimension}表现优秀，${Math.round(excellentRate)}%的观察点达到优秀水平`);
      } else if (averageRate >= 40) {
        improvements.push(`${dimension}有待加强，${Math.round(averageRate)}%的观察点需要改进`);
      }
    });

    if (stats['生态课堂四要素']) {
      const ecoData = stats['生态课堂四要素'];
      if (ecoData.excellent / ecoData.total < 0.5) {
        improvements.push('建议加强师生互动设计，增加学生自主探究和小组合作环节');
      }
    }
    if (stats['教学评一体化']) {
      const evalData = stats['教学评一体化'];
      if (evalData.excellent / evalData.total < 0.5) {
        improvements.push('建议优化评价任务设计，使评价更加贴合教学目标，增加过程性评价');
      }
    }
    if (stats['三力平衡']) {
      const balanceData = stats['三力平衡'];
      if (balanceData.excellent / balanceData.total < 0.5) {
        improvements.push('建议关注学生思维张力的培养，设计更多开放性问题和探究活动');
      }
    }

    return { highlights, improvements };
  };

  const stats = calculateStats();
  const { highlights, improvements } = generateHighlightsAndImprovements();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#2c3e2c]">课堂观察量表</h2>
          <p className="text-sm md:text-base text-[#8a9a8a] mt-1">
            已收集 {evaluations.length} 位观课老师的评价
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            onClick={generateShareLink}
            className="border-[#3498db] text-[#3498db] hover:bg-[#e3f2fd]"
          >
            <Share2 className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">分享链接</span>
            <span className="sm:hidden">分享</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white text-sm md:text-base">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                添加观课评价
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl text-[#2c3e2c]">课堂观察评价</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Observer and Teacher Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#8a9a8a]" />
                    <span className="text-base text-[#5a6b5a] w-20">观课人：</span>
                    <input
                      type="text"
                      placeholder="请输入观课人姓名"
                      value={currentEvaluation.observerName || ''}
                      onChange={(e) => setCurrentEvaluation(prev => ({ ...prev, observerName: e.target.value }))}
                      className="flex-1 px-4 py-2.5 bg-[#f8fbf8] border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                    />
                  </div>
                  
                  {/* 授课人下拉选择 */}
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#8a9a8a]" />
                    <span className="text-base text-[#5a6b5a] w-20">授课人：</span>
                    <Select
                      value={currentEvaluation.teacherName || ''}
                      onValueChange={(value) => {
                        setCurrentEvaluation(prev => ({
                          ...prev,
                          teacherName: value,
                          lessonTitle: '', // 清空已选主题
                        }));
                      }}
                    >
                      <SelectTrigger className="flex-1 px-4 py-2.5 bg-[#f8fbf8] border border-[#d4e4d4] rounded-lg text-base">
                        <SelectValue placeholder="请选择授课教师" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherOptions.length > 0 ? (
                          teacherOptions.map((teacher) => (
                            <SelectItem key={teacher} value={teacher}>
                              {teacher}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no_teacher" disabled>
                            暂无教师数据
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 授课主题下拉选择 */}
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#8a9a8a]" />
                    <span className="text-base text-[#5a6b5a] w-20">授课主题：</span>
                    <Select
                      value={currentEvaluation.lessonTitle || ''}
                      onValueChange={(value) => setCurrentEvaluation(prev => ({ ...prev, lessonTitle: value }))}
                      disabled={!currentEvaluation.teacherName}
                    >
                      <SelectTrigger className="flex-1 px-4 py-2.5 bg-[#f8fbf8] border border-[#d4e4d4] rounded-lg text-base">
                        <SelectValue placeholder={currentEvaluation.teacherName ? "请选择授课主题" : "请先选择授课教师"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLessonOptions.length > 0 ? (
                          filteredLessonOptions.map((item, idx) => (
                            <SelectItem key={idx} value={item.title}>
                              {item.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no_lesson" disabled>
                            {currentEvaluation.teacherName ? '该教师暂无教案' : '暂无主题数据'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lesson Type */}
                <div className="flex items-center gap-4">
                  <span className="text-base text-[#5a6b5a]">课型：</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentEvaluation(prev => ({ ...prev, lessonType: 'concept', items: [] }));
                        setLessonType('concept');
                      }}
                      className={`px-5 py-2.5 rounded-lg text-base font-medium transition-all ${
                        lessonType === 'concept'
                          ? 'bg-[#4d8b4d] text-white'
                          : 'bg-[#f8fbf8] text-[#5a6b5a] border border-[#d4e4d4] hover:border-[#4d8b4d]'
                      }`}
                    >
                      概念课
                    </button>
                    <button
                      onClick={() => {
                        setCurrentEvaluation(prev => ({ ...prev, lessonType: 'problem-solving', items: [] }));
                        setLessonType('problem-solving');
                      }}
                      className={`px-5 py-2.5 rounded-lg text-base font-medium transition-all ${
                        lessonType === 'problem-solving'
                          ? 'bg-[#4d8b4d] text-white'
                          : 'bg-[#f8fbf8] text-[#5a6b5a] border border-[#d4e4d4] hover:border-[#4d8b4d]'
                      }`}
                    >
                      问题解决课
                    </button>
                  </div>
                </div>

                {/* Observation Items */}
                <div className="space-y-6">
                  {observationData.map((dimension, dimIndex) => (
                    <div key={dimIndex} className="border border-[#e8f5e9] rounded-xl overflow-hidden">
                      <div className="bg-[#f0f7f0] px-4 py-3">
                        <h4 className="font-medium text-[#2e5c2e] text-base">{dimension.dimension}</h4>
                      </div>
                      <div className="divide-y divide-[#e8f5e9]">
                        {dimension.items.map((item, itemIndex) => {
                          const itemId = `${dimension.dimension}-${item.point}`;
                          const selectedGrade = getSelectedGrade(itemId);
                          
                          return (
                            <div key={itemIndex} className="px-4 py-4">
                              <p className="text-base text-[#5a6b5a] mb-3">{item.point}</p>
                              <div className="flex gap-2">
                                {gradeOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleGradeSelect(itemId, option.value)}
                                    className={`px-5 py-2 rounded-lg text-base font-medium border transition-all ${
                                      selectedGrade === option.value
                                        ? option.color
                                        : 'bg-white text-[#8a9a8a] border-[#d4e4d4] hover:border-[#7bc47b]'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Input */}
                <div className="border border-[#e8f5e9] rounded-xl overflow-hidden">
                  <div className="bg-[#f0f7f0] px-4 py-3">
                    <h4 className="font-medium text-[#2e5c2e] text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      观课小结
                    </h4>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={currentEvaluation.summary || ''}
                      onChange={(e) => setCurrentEvaluation(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="请输入观课小结，包括课堂亮点、存在问题及改进建议..."
                      className="w-full h-32 px-4 py-3 bg-[#f8fbf8] border border-[#d4e4d4] rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d] resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-[#d4e4d4] text-[#5a6b5a] text-base px-5 py-2.5"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={submitEvaluation}
                    className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white text-base px-5 py-2.5"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    提交评价
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {evaluations.length > 0 && (
            <Button
              onClick={generateReport}
              variant="outline"
              className="border-[#4d8b4d] text-[#4d8b4d] hover:bg-[#e8f5e9] text-sm md:text-base"
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              生成报告
            </Button>
          )}
        </div>
      </div>

      {/* Evaluation List */}
      {evaluations.length > 0 && !showReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluations.map((evaluation, index) => (
            <Card key={index} className="eco-card-shadow border-[#d4e4d4]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-[#2c3e2c]">{evaluation.observerName}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    evaluation.lessonType === 'concept'
                      ? 'bg-[#e3f2fd] text-[#3498db]'
                      : 'bg-[#f3e5f5] text-[#9c27b0]'
                  }`}>
                    {evaluation.lessonType === 'concept' ? '概念课' : '问题解决课'}
                  </span>
                </div>
                <p className="text-xs text-[#8a9a8a]">授课人: {evaluation.teacherName}</p>
                {evaluation.lessonTitle && (
                  <p className="text-xs text-[#8a9a8a]">授课主题: {evaluation.lessonTitle}</p>
                )}
                <p className="text-xs text-[#8a9a8a]">
                  {new Date(evaluation.timestamp).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(new Set(evaluation.items.map(i => i.dimension))).map((dim, idx) => {
                    const dimItems = evaluation.items.filter(i => i.dimension === dim);
                    const excellentCount = dimItems.filter(i => i.grade === 'excellent').length;
                    const goodCount = dimItems.filter(i => i.grade === 'good').length;
                    const averageCount = dimItems.filter(i => i.grade === 'average').length;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-[#5a6b5a]">{dim}</span>
                        <div className="flex gap-1">
                          {excellentCount > 0 && (
                            <span className="px-2 py-0.5 bg-[#e8f5e9] text-[#4d8b4d] rounded text-xs">
                              优{excellentCount}
                            </span>
                          )}
                          {goodCount > 0 && (
                            <span className="px-2 py-0.5 bg-[#fff8e1] text-[#e8913a] rounded text-xs">
                              良{goodCount}
                            </span>
                          )}
                          {averageCount > 0 && (
                            <span className="px-2 py-0.5 bg-[#ffebee] text-[#e74c3c] rounded text-xs">
                              一般{averageCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {evaluation.summary && (
                  <div className="mt-3 pt-3 border-t border-[#e8f5e9]">
                    <p className="text-xs text-[#8a9a8a] line-clamp-2">{evaluation.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report View */}
      {showReport && evaluations.length > 0 && (
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#4d8b4d]" />
                观课评价汇总报告
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReport(false)}
                className="border-[#d4e4d4] text-[#5a6b5a]"
              >
                <X className="w-4 h-4 mr-1" />
                关闭报告
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="mb-6 p-5 bg-[#f0f7f0] rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-[#4d8b4d]">{evaluations.length}</p>
                  <p className="text-sm text-[#8a9a8a]">观课人数</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-[#4d8b4d]">
                    {Object.values(stats).reduce((sum, s) => sum + s.excellent, 0)}
                  </p>
                  <p className="text-sm text-[#8a9a8a]">优秀评价</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-[#e8913a]">
                    {Object.values(stats).reduce((sum, s) => sum + s.good, 0)}
                  </p>
                  <p className="text-sm text-[#8a9a8a]">良好评价</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-[#e74c3c]">
                    {Object.values(stats).reduce((sum, s) => sum + s.average, 0)}
                  </p>
                  <p className="text-sm text-[#8a9a8a]">一般评价</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-[#2c3e2c] mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#f4c430]" />
                  课堂亮点
                </h4>
                <div className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[#fff8e1] rounded-lg border border-[#f4c430]/30">
                      <span className="text-[#f4c430] mt-0.5">★</span>
                      <p className="text-base text-[#5a6b5a]">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {improvements.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-[#2c3e2c] mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#4d8b4d]" />
                  改进建议
                </h4>
                <div className="space-y-2">
                  {improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[#e8f5e9] rounded-lg border border-[#4d8b4d]/30">
                      <span className="text-[#4d8b4d] mt-0.5">→</span>
                      <p className="text-base text-[#5a6b5a]">{improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observer Summaries */}
            {evaluations.some(e => e.summary) && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-[#2c3e2c] mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#3498db]" />
                  观课小结
                </h4>
                <div className="space-y-3">
                  {evaluations.filter(e => e.summary).map((evaluation, index) => (
                    <div key={index} className="p-4 bg-[#f8fbf8] rounded-xl border border-[#e8f5e9]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-[#2c3e2c]">{evaluation.observerName}</span>
                        <span className="text-xs text-[#8a9a8a]">评价 {evaluation.teacherName}</span>
                      </div>
                      <p className="text-sm text-[#5a6b5a]">{evaluation.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dimension Stats */}
            <div className="space-y-5">
              <h4 className="text-lg font-medium text-[#2c3e2c] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#4d8b4d]" />
                各维度评价分布
              </h4>
              {Object.entries(stats).map(([dimension, data], index) => {
                const excellentPct = data.total > 0 ? Math.round((data.excellent / data.total) * 100) : 0;
                const goodPct = data.total > 0 ? Math.round((data.good / data.total) * 100) : 0;
                const averagePct = data.total > 0 ? Math.round((data.average / data.total) * 100) : 0;
                
                return (
                  <div key={index} className="border border-[#e8f5e9] rounded-xl p-4">
                    <h4 className="font-medium text-[#2c3e2c] mb-3 text-base">{dimension}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-10 bg-[#f8fbf8] rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-[#4d8b4d] flex items-center justify-center text-sm text-white font-medium"
                          style={{ width: `${excellentPct}%` }}
                        >
                          {excellentPct > 10 && `优 ${excellentPct}%`}
                        </div>
                        <div
                          className="h-full bg-[#e8913a] flex items-center justify-center text-sm text-white font-medium"
                          style={{ width: `${goodPct}%` }}
                        >
                          {goodPct > 10 && `良 ${goodPct}%`}
                        </div>
                        <div
                          className="h-full bg-[#e74c3c] flex items-center justify-center text-sm text-white font-medium"
                          style={{ width: `${averagePct}%` }}
                        >
                          {averagePct > 10 && `一般 ${averagePct}%`}
                        </div>
                      </div>
                      <div className="text-sm text-[#8a9a8a] w-20 text-right">
                        {data.total} 条评价
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {evaluations.length === 0 && (
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#f0f7f0] flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-[#8a9a8a]" />
            </div>
            <p className="text-lg text-[#5a6b5a] font-medium">暂无观课评价</p>
            <p className="text-base text-[#8a9a8a] mt-1">点击"添加观课评价"开始收集数据</p>
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#3498db]" />
              分享观课链接
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-[#5a6b5a]">
              将以下链接分享给其他观课老师，他们可以通过手机直接填写评价：
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-3 bg-[#f8fbf8] border border-[#d4e4d4] rounded-lg text-sm text-[#5a6b5a]"
              />
              <Button
                onClick={copyLink}
                className={copied ? 'bg-[#4d8b4d]' : 'bg-[#3498db]'}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="p-4 bg-[#e3f2fd] rounded-xl">
              <p className="text-sm text-[#3498db] flex items-center gap-2">
                <Phone className="w-4 h-4" />
                支持手机端访问，扫码或点击链接即可评价
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}