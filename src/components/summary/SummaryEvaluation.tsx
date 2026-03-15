import { useState, useEffect } from 'react';
import { BarChart3, Star, Lightbulb, TrendingUp, CheckCircle, FileText, Calendar, Users, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SummaryEvaluationProps {
  selectedDate: string;
  teacherName?: string;
  userId?: string;
  isAdmin?: boolean;
}

interface TeacherSummaryData {
  userId: string;
  teacherName: string;
  lessonPlanScore: number;
  observationScore: number;        // 观课平均得分（新增）
  observationCount: number;         // 保留原字段，用于优秀率计算（不改）
  excellentRate: number;
  goodRate: number;
  averageRate: number;
  overallRating: string;
  highlights: string[];
  improvements: string[];
}

export function SummaryEvaluation({ selectedDate, userId }: SummaryEvaluationProps) {
  const [mySummary, setMySummary] = useState<TeacherSummaryData | null>(null);
  const [allTeachersSummary, setAllTeachersSummary] = useState<TeacherSummaryData[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState('my');

  useEffect(() => {
    const end = new Date(selectedDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: selectedDate
    });
  }, [selectedDate]);

  useEffect(() => {
    // Load all teachers' data
    const loadAllTeachersData = () => {
      const allTeachers: TeacherSummaryData[] = [];
      const teacherIds = new Set<string>();

      // Collect all unique teacher IDs from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('lesson_plan_')) {
          const parts = key.split('_');
          const teacherId = parts[parts.length - 1];
          if (teacherId && teacherId !== 'default') {
            teacherIds.add(teacherId);
          }
        }
      }

      // Also add current user
      if (userId) {
        teacherIds.add(userId);
      }

      // 定义等级到分数的映射（用于计算平均分）
      const gradeToScore = {
        'excellent': 3,
        'good': 2,
        'average': 1
      };

      // Load data for each teacher
      teacherIds.forEach(teacherId => {
        let totalLessonPlanScore = 0;
        let lessonPlanCount = 0;
        let totalObservations = 0;
        let excellentCount = 0;
        let goodCount = 0;
        let averageCount = 0;
        // 新增：用于计算观课平均得分
        let totalObservationScore = 0;
        let observationRecordCount = 0;

        const highlights: string[] = [];
        const improvements: string[] = [];
        let teacherName = '未知教师';

        for (let i = 0; i < 7; i++) {
          const date = new Date(selectedDate);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const lessonPlanData = localStorage.getItem(`lesson_plan_${dateStr}_${teacherId}`);
          if (lessonPlanData) {
            const data = JSON.parse(lessonPlanData);
            teacherName = data.teacherName || teacherName;
            if (data.scores) {
              const score = data.scores.reduce((sum: number, s: any) => sum + s.score, 0);
              totalLessonPlanScore += score;
              lessonPlanCount++;
            }
          }

          const observationData = localStorage.getItem(`observations_${dateStr}`);
          if (observationData) {
            const observations = JSON.parse(observationData);
            observations.forEach((obs: any) => {
              // 只统计目标教师自己的观课记录
              if (obs.teacherName === teacherName) {
                totalObservations++;
                let obsScore = 0;
                obs.items.forEach((item: any) => {
                  const grade = item.grade;
                  if (grade === 'excellent') {
                    excellentCount++;
                    obsScore += gradeToScore.excellent;
                  } else if (grade === 'good') {
                    goodCount++;
                    obsScore += gradeToScore.good;
                  } else if (grade === 'average') {
                    averageCount++;
                    obsScore += gradeToScore.average;
                  }
                });
                totalObservationScore += obsScore;
                observationRecordCount++;
              }
            });
          }
        }

        const totalGrades = excellentCount + goodCount + averageCount;
        const avgLessonPlanScore = lessonPlanCount > 0 ? Math.round(totalLessonPlanScore / lessonPlanCount) : 0;
        const excellentRate = totalGrades > 0 ? Math.round((excellentCount / totalGrades) * 100) : 0;
        const goodRate = totalGrades > 0 ? Math.round((goodCount / totalGrades) * 100) : 0;
        const averageRate = totalGrades > 0 ? Math.round((averageCount / totalGrades) * 100) : 0;
        // 计算观课平均得分（保留一位小数）
        const avgObservationScore = observationRecordCount > 0 
          ? Math.round((totalObservationScore / observationRecordCount) * 10) / 10 
          : 0;

        // Generate highlights and improvements
        if (excellentRate >= 70) {
          highlights.push('课堂观察中优秀评价占比较高，教学实施效果良好');
        }
        if (avgLessonPlanScore > 80) {
          highlights.push('教学设计整体质量较高，目标明确，三单设计合理');
        }
        if (averageRate >= 40) {
          improvements.push('部分教学环节需要改进，建议关注学生参与度和互动效果');
        }

        const overallRating = excellentRate >= 50 ? '优秀' : goodRate >= 40 ? '良好' : '待改进';

        allTeachers.push({
          userId: teacherId,
          teacherName,
          lessonPlanScore: avgLessonPlanScore,
          observationScore: avgObservationScore,   // 新增字段
          observationCount: totalObservations,      // 保留原字段（用于优秀率计算）
          excellentRate,
          goodRate,
          averageRate,
          overallRating,
          highlights,
          improvements,
        });
      });

      // Sort by lesson plan score
      allTeachers.sort((a, b) => b.lessonPlanScore - a.lessonPlanScore);
      
      setAllTeachersSummary(allTeachers);
      
      // Find current user's summary
      const myData = allTeachers.find(t => t.userId === userId);
      if (myData) {
        setMySummary(myData);
      }
    };

    loadAllTeachersData();
  }, [selectedDate, userId]);

  const chartData = (summary: TeacherSummaryData) => [
    { name: '优秀', value: summary.excellentRate, color: '#4d8b4d' },
    { name: '良好', value: summary.goodRate, color: '#e8913a' },
    { name: '一般', value: summary.averageRate, color: '#e74c3c' },
  ];

  const renderSummaryCard = (summary: TeacherSummaryData, isMySummary: boolean = false) => (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`eco-card-shadow border-[#d4e4d4] ${isMySummary ? 'bg-gradient-to-r from-[#f0f7f0] to-[#e8f5e9]' : ''}`}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#2c3e2c]">
                {summary.teacherName} 的总结性评价报告
              </h2>
              <p className="text-sm md:text-base text-[#5a6b5a] mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                统计周期：{dateRange.start} 至 {dateRange.end}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-[#8a9a8a]">综合评价</p>
              <p className={`text-2xl md:text-3xl font-bold ${
                summary.excellentRate >= 50 ? 'text-[#4d8b4d]' : 
                summary.goodRate >= 40 ? 'text-[#e8913a]' : 'text-[#e74c3c]'
              }`}>
                {summary.overallRating}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8a9a8a]">平均教案得分</p>
                <p className="text-2xl md:text-3xl font-bold text-[#4d8b4d]">{summary.lessonPlanScore}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#e8f5e9] flex items-center justify-center">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#4d8b4d]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8a9a8a]">观课平均得分</p> {/* 标题修改 */}
                <p className="text-2xl md:text-3xl font-bold text-[#3498db]">{summary.observationScore.toFixed(1)}</p> {/* 显示一位小数 */}
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#e3f2fd] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-[#3498db]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-[#8a9a8a]">优秀率</p>
                <p className="text-2xl md:text-3xl font-bold text-[#4d8b4d]">{summary.excellentRate}%</p>
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
                <p className="text-xs md:text-sm text-[#8a9a8a]">良好率</p>
                <p className="text-2xl md:text-3xl font-bold text-[#e8913a]">{summary.goodRate}%</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#fff8e1] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-[#e8913a]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Chart */}
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg md:text-xl text-[#2c3e2c]">课堂观察评价分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData(summary)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                  <XAxis dataKey="name" tick={{ fill: '#5a6b5a', fontSize: 14 }} />
                  <YAxis tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #d4e4d4', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData(summary).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Highlights */}
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg md:text-xl text-[#2c3e2c] flex items-center gap-2">
              <Star className="w-5 h-5 text-[#f4c430]" />
              教学亮点
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.highlights.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {summary.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-[#fff8e1] rounded-lg border border-[#f4c430]/30">
                    <span className="text-[#f4c430] text-lg">★</span>
                    <p className="text-sm md:text-base text-[#5a6b5a]">{highlight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#8a9a8a] py-8">暂无亮点记录</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Improvements */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg md:text-xl text-[#2c3e2c] flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#4d8b4d]" />
            改进建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.improvements.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {summary.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-[#e8f5e9] rounded-lg border border-[#4d8b4d]/30">
                  <span className="text-[#4d8b4d] text-lg">→</span>
                  <p className="text-sm md:text-base text-[#5a6b5a]">{improvement}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#e8f5e9] rounded-lg border border-[#4d8b4d]/30">
                <span className="text-[#4d8b4d] text-lg">→</span>
                <p className="text-sm md:text-base text-[#5a6b5a]">继续保持良好的教学状态，关注每一位学生的学习情况</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#e8f5e9] rounded-lg border border-[#4d8b4d]/30">
                <span className="text-[#4d8b4d] text-lg">→</span>
                <p className="text-sm md:text-base text-[#5a6b5a]">建议多设计开放性问题和探究活动，培养学生的创新思维</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f0f7f0] w-full md:w-auto">
          <TabsTrigger 
            value="my" 
            className="data-[state=active]:bg-[#4d8b4d] data-[state=active]:text-white flex-1 md:flex-none"
          >
            <FileText className="w-4 h-4 mr-2" />
            我的评价
          </TabsTrigger>
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-[#4d8b4d] data-[state=active]:text-white flex-1 md:flex-none"
          >
            <Users className="w-4 h-4 mr-2" />
            教师排名
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-4">
          {mySummary ? (
            renderSummaryCard(mySummary, true)
          ) : (
            <Card className="eco-card-shadow border-[#d4e4d4]">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#f0f7f0] flex items-center justify-center">
                  <BarChart3 className="w-10 h-10 text-[#8a9a8a]" />
                </div>
                <p className="text-lg text-[#5a6b5a] font-medium">暂无评价数据</p>
                <p className="text-base text-[#8a9a8a] mt-1">请先完成课前和课中评价</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {allTeachersSummary.length > 0 ? (
            <div className="space-y-4">
              <Card className="eco-card-shadow border-[#d4e4d4]">
                <CardHeader>
                  <CardTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-[#f4c430]" />
                    教师评价排名
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#f0f7f0]">
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#2e5c2e]">排名</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#2e5c2e]">教师</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-[#2e5c2e]">教案得分</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-[#2e5c2e]">观课平均得分</th> {/* 列标题修改 */}
                          <th className="px-4 py-3 text-center text-sm font-medium text-[#2e5c2e]">优秀率</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-[#2e5c2e]">综合评价</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTeachersSummary.map((teacher, index) => (
                          <tr
                            key={teacher.userId}
                            className={`border-t border-[#e8f5e9] hover:bg-[#f8fbf8] transition-colors ${
                              teacher.userId === userId ? 'bg-[#f0f7f0]' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                index === 0 ? 'bg-[#f4c430] text-white' :
                                index === 1 ? 'bg-[#c0c0c0] text-white' :
                                index === 2 ? 'bg-[#cd7f32] text-white' :
                                'bg-[#e8f5e9] text-[#4d8b4d]'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-[#2c3e2c]">
                                {teacher.teacherName}
                                {teacher.userId === userId && (
                                  <span className="ml-2 text-xs text-[#4d8b4d]">(我)</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-bold text-[#4d8b4d]">{teacher.lessonPlanScore}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-[#3498db]">{teacher.observationScore.toFixed(1)}</span> {/* 显示一位小数 */}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-[#4d8b4d]">{teacher.excellentRate}%</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                teacher.overallRating === '优秀' ? 'bg-[#e8f5e9] text-[#4d8b4d]' :
                                teacher.overallRating === '良好' ? 'bg-[#fff8e1] text-[#e8913a]' :
                                'bg-[#ffebee] text-[#e74c3c]'
                              }`}>
                                {teacher.overallRating}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="eco-card-shadow border-[#d4e4d4]">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#f0f7f0] flex items-center justify-center">
                  <Users className="w-10 h-10 text-[#8a9a8a]" />
                </div>
                <p className="text-lg text-[#5a6b5a] font-medium">暂无教师评价数据</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}