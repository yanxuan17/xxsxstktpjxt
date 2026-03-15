import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useStudents } from '@/hooks/useStudents';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SummaryStudentProps {
  selectedDate: string;
  className?: string;
  userId?: string;
}

interface StudentSummaryData {
  studentId: number;
  studentName: string;
  previewTotal: number;
  realtimeTotal: number;
  homeworkTotal: number;
  grandTotal: number;
  dailyData: { date: string; preview: number; realtime: number; homework: number; total: number }[];
}

export function SummaryStudent({ selectedDate, className }: SummaryStudentProps) {
  const { students } = useStudents(className ? { grade: className.split('(')[0], classNumber: parseInt(className.match(/\d+/)?.[0] || '1'), fullName: className } : undefined);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummaryData[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showTrendDialog, setShowTrendDialog] = useState(false);
  const [selectedStudentForTrend, setSelectedStudentForTrend] = useState<StudentSummaryData | null>(null);

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
    const loadStudentSummaries = () => {
      const summaries: StudentSummaryData[] = [];

      students.forEach(student => {
        let previewTotal = 0;
        let realtimeTotal = 0;
        let homeworkTotal = 0;
        const dailyData: { date: string; preview: number; realtime: number; homework: number; total: number }[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(selectedDate);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          let previewScore = 0;
          let realtimeScore = 0;
          let homeworkScore = 0;

          // Preview scores
          const previewData = localStorage.getItem(`preview_ratings_${dateStr}_${className}`);
          if (previewData) {
            const ratings = JSON.parse(previewData);
            if (ratings[student.id]) {
              const r = ratings[student.id];
              previewScore = Math.round(((r.completion || 0) + (r.neatness || 0) + (r.thinking || 0)) / 15 * 100);
              previewTotal += previewScore;
            }
          }

          // Realtime scores
          const realtimeData = localStorage.getItem(`realtime_scores_${dateStr}_${className}`);
          if (realtimeData) {
            const scores = JSON.parse(realtimeData);
            if (scores[student.id]) {
              realtimeScore = scores[student.id].totalScore || 0;
              realtimeTotal += realtimeScore;
            }
          }

          // Homework scores
          const homeworkData = localStorage.getItem(`homework_scores_${dateStr}_${className}`);
          if (homeworkData) {
            const scores = JSON.parse(homeworkData);
            if (scores[student.id]) {
              const s = scores[student.id];
              homeworkScore = (s.completionRate || 0) + (s.accuracy || 0) + (s.neatness || 0) + (s.thinking || 0);
              const customScore = Object.values(s.customScores || {}).reduce((sum: number, v: any) => sum + (v as number), 0);
              homeworkScore += customScore;
              homeworkTotal += homeworkScore;
            }
          }

          dailyData.push({
            date: dateStr.slice(5),
            preview: previewScore,
            realtime: realtimeScore,
            homework: homeworkScore,
            total: previewScore + realtimeScore + homeworkScore
          });
        }

        summaries.push({
          studentId: student.id,
          studentName: student.name,
          previewTotal,
          realtimeTotal,
          homeworkTotal,
          grandTotal: previewTotal + realtimeTotal + homeworkTotal,
          dailyData
        });
      });

      // Sort by grand total
      summaries.sort((a, b) => b.grandTotal - a.grandTotal);
      setStudentSummaries(summaries);
    };

    loadStudentSummaries();
  }, [students, selectedDate]);

  const getOverallRating = (total: number): { level: string; color: string } => {
    if (total >= 500) return { level: '优秀', color: '#4d8b4d' };
    if (total >= 350) return { level: '良好', color: '#e8913a' };
    if (total >= 200) return { level: '合格', color: '#3498db' };
    return { level: '待努力', color: '#e74c3c' };
  };

  const showTrend = (student: StudentSummaryData) => {
    setSelectedStudentForTrend(student);
    setShowTrendDialog(true);
  };

  const topStudents = studentSummaries.slice(0, 10);

  const chartData = topStudents.slice(0, 5).map(s => ({
    name: s.studentName,
    preview: s.previewTotal,
    realtime: s.realtimeTotal,
    homework: s.homeworkTotal,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="eco-card-shadow border-[#d4e4d4] bg-gradient-to-r from-[#f0f7f0] to-[#e8f5e9]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#2c3e2c]">学生综合评价汇总</h2>
              <p className="text-base text-[#5a6b5a] mt-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                统计周期：{dateRange.start} 至 {dateRange.end}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#8a9a8a]">评价学生数</p>
              <p className="text-3xl font-bold text-[#4d8b4d]">{studentSummaries.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Students Leaderboard */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardHeader>
          <CardTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#f4c430]" />
            综合积分排行榜 (Top 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topStudents.map((student, index) => {
              const rating = getOverallRating(student.grandTotal);
              return (
                <div
                  key={student.studentId}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    index === 0
                      ? 'bg-gradient-to-r from-[#fff8e1] to-[#fffef0] border border-[#f4c430]/30'
                      : index === 1
                      ? 'bg-gradient-to-r from-[#f5f5f5] to-[#fafafa] border border-[#c0c0c0]/30'
                      : index === 2
                      ? 'bg-gradient-to-r from-[#fff5e6] to-[#fffaf0] border border-[#cd7f32]/30'
                      : 'bg-[#f8fbf8]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
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
                    <span className="text-lg font-medium text-[#2c3e2c]">{student.studentName}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-[#8a9a8a]">课前</p>
                      <p className="text-base font-medium text-[#4d8b4d]">{student.previewTotal}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#8a9a8a]">课中</p>
                      <p className="text-base font-medium text-[#3498db]">{student.realtimeTotal}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#8a9a8a]">课后</p>
                      <p className="text-base font-medium text-[#e8913a]">{student.homeworkTotal}</p>
                    </div>
                    <div className="text-center px-4 border-l border-[#e8f5e9]">
                      <p className="text-xs text-[#8a9a8a]">总分</p>
                      <p className="text-2xl font-bold" style={{ color: rating.color }}>
                        {student.grandTotal}
                      </p>
                    </div>
                    <span 
                      className="px-4 py-1.5 rounded-full text-sm font-medium"
                      style={{ backgroundColor: `${rating.color}20`, color: rating.color }}
                    >
                      {rating.level}
                    </span>
                    <button
                      onClick={() => showTrend(student)}
                      className="p-2.5 rounded-xl hover:bg-[#e8f5e9] text-[#4d8b4d] transition-colors"
                    >
                      <TrendingUp className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution Chart */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardHeader>
          <CardTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#4d8b4d]" />
            前五名学生积分构成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                <XAxis dataKey="name" tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                <YAxis tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #d4e4d4', borderRadius: '8px' }}
                />
                <Bar dataKey="preview" name="课前评价" stackId="a" fill="#4d8b4d" radius={[0, 0, 4, 4]} />
                <Bar dataKey="realtime" name="课中评价" stackId="a" fill="#3498db" />
                <Bar dataKey="homework" name="课后评价" stackId="a" fill="#e8913a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* All Students Table */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardHeader>
          <CardTitle className="text-xl text-[#2c3e2c]">全班学生评价汇总</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f0f7f0]">
                  <th className="px-4 py-4 text-left text-base font-medium text-[#2e5c2e]">排名</th>
                  <th className="px-4 py-4 text-left text-base font-medium text-[#2e5c2e]">学号</th>
                  <th className="px-4 py-4 text-left text-base font-medium text-[#2e5c2e]">姓名</th>
                  <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">课前积分</th>
                  <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">课中积分</th>
                  <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">课后积分</th>
                  <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">总积分</th>
                  <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">等级</th>
                  <th className="px-4 py-4 text-center text-base font-medium text-[#2e5c2e]">趋势</th>
                </tr>
              </thead>
              <tbody>
                {studentSummaries.map((student, index) => {
                  const rating = getOverallRating(student.grandTotal);
                  return (
                    <tr
                      key={student.studentId}
                      className={`border-t border-[#e8f5e9] hover:bg-[#f8fbf8] transition-colors ${
                        index % 2 === 1 ? 'bg-[#fafcfa]' : ''
                      }`}
                    >
                      <td className="px-4 py-4 text-base font-medium text-[#4d8b4d]">{index + 1}</td>
                      <td className="px-4 py-4 text-base text-[#5a6b5a]">{student.studentId}</td>
                      <td className="px-4 py-4 text-base font-medium text-[#2c3e2c]">{student.studentName}</td>
                      <td className="px-4 py-4 text-center text-base text-[#4d8b4d]">{student.previewTotal}</td>
                      <td className="px-4 py-4 text-center text-base text-[#3498db]">{student.realtimeTotal}</td>
                      <td className="px-4 py-4 text-center text-base text-[#e8913a]">{student.homeworkTotal}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xl font-bold" style={{ color: rating.color }}>
                          {student.grandTotal}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span 
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: `${rating.color}20`, color: rating.color }}
                        >
                          {rating.level}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trend Dialog */}
      <Dialog open={showTrendDialog} onOpenChange={setShowTrendDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">
              {selectedStudentForTrend?.studentName} - 综合评价趋势
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedStudentForTrend?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f5e9" />
                  <XAxis dataKey="date" tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#5a6b5a', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #d4e4d4', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="preview" 
                    name="课前评价"
                    stroke="#4d8b4d" 
                    strokeWidth={2}
                    dot={{ fill: '#4d8b4d', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="realtime" 
                    name="课中评价"
                    stroke="#3498db" 
                    strokeWidth={2}
                    dot={{ fill: '#3498db', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="homework" 
                    name="课后评价"
                    stroke="#e8913a" 
                    strokeWidth={2}
                    dot={{ fill: '#e8913a', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="总积分"
                    stroke="#9c27b0" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#9c27b0', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-[#8a9a8a] text-center mt-4">
              显示最近7天的课前、课中、课后评价得分变化趋势
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
