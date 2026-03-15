import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { knowledgePoints } from '@/data/knowledgePoints';

// 临时定义 Mistake 类型
interface Mistake {
  id: string;
  date: string;
  className: string;
  studentId?: number;
  studentName?: string;
  questionText: string;
  correctAnswer: string;
  wrongAnswer: string;
  errorReason: string;
  customReason?: string;
  knowledgePoints: string[];
  imageUrl?: string;
  notes?: string;
  mastered: boolean;
  createdAt: string;
}

interface MistakeStatsProps {
  open: boolean;
  onClose: () => void;
  mistakes: Mistake[];
}

const COLORS = ['#4d8b4d', '#f4c430', '#e8913a', '#3498db', '#e74c3c', '#9b59b6'];

export function MistakeStats({ open, onClose, mistakes }: MistakeStatsProps) {
  const knowledgeStats = knowledgePoints.map(kp => {
    const count = mistakes.filter(m => m.knowledgePoints.includes(kp.id)).length;
    return { name: kp.name, count };
  }).filter(item => item.count > 0);

  const reasonStats = [
    { name: '审题不清', count: mistakes.filter(m => m.errorReason === '审题不清').length },
    { name: '计算错误', count: mistakes.filter(m => m.errorReason === '计算错误').length },
    { name: '概念不懂', count: mistakes.filter(m => m.errorReason === '概念不懂').length },
    { name: '方法不会', count: mistakes.filter(m => m.errorReason === '方法不会').length },
    { name: '粗心', count: mistakes.filter(m => m.errorReason === '粗心').length },
    { name: '自定义', count: mistakes.filter(m => m.errorReason === '自定义').length },
  ].filter(item => item.count > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const trendData = last7Days.map(date => {
    const count = mistakes.filter(m => m.date.startsWith(date)).length;
    return { date: date.slice(5), count };
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#2c3e2c]">错题数据分析</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="knowledge" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="knowledge">知识点分布</TabsTrigger>
            <TabsTrigger value="reason">错误原因分布</TabsTrigger>
            <TabsTrigger value="trend">近期趋势</TabsTrigger>
          </TabsList>
          <TabsContent value="knowledge">
            <div className="h-80 mt-4">
              {knowledgeStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={knowledgeStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4d8b4d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#8a9a8a]">暂无数据</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reason">
            <div className="h-80 mt-4">
              {reasonStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reasonStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#8a9a8a]">暂无数据</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="trend">
            <div className="h-80 mt-4">
              {trendData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#4d8b4d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#8a9a8a]">暂无趋势数据</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}