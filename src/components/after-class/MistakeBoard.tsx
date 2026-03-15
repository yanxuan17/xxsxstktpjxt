import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Download, BarChart2, BookOpen } from 'lucide-react';
import { knowledgePoints } from '@/data/knowledgePoints';
import { useStudents } from '@/hooks/useStudents';
import { format } from 'date-fns';
import { MistakeQuickAdd } from './MistakeQuickAdd';
import { MistakeStats } from './MistakeStats';
import { MistakeExport } from './MistakeExport';
import { MistakePractice } from './MistakePractice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ErrorReason = '审题不清' | '计算错误' | '概念不懂' | '方法不会' | '粗心' | '自定义';
interface Mistake {
  id: string;
  date: string;
  className: string;
  studentId?: number;
  studentName?: string;
  questionText: string;
  correctAnswer: string;
  wrongAnswer: string;
  errorReason: ErrorReason;
  customReason?: string;
  knowledgePoints: string[];
  imageUrl?: string;
  notes?: string;
  mastered: boolean;
  createdAt: string;
}

interface MistakeBoardProps {
  className?: string;
}

export function MistakeBoard({ className }: MistakeBoardProps) {
  const { students } = useStudents(className ? { grade: className.split('(')[0], classNumber: parseInt(className.match(/\d+/)?.[0] || '1'), fullName: className } : undefined);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [filteredMistakes, setFilteredMistakes] = useState<Mistake[]>([]);
  const [selectedMistakes, setSelectedMistakes] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);

  const [knowledgeFilter, setKnowledgeFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`mistakes_${className}`);
    if (saved) {
      setMistakes(JSON.parse(saved));
    } else {
      setMistakes([]);
    }
  }, [className]);

  const saveMistakes = (newMistakes: Mistake[]) => {
    localStorage.setItem(`mistakes_${className}`, JSON.stringify(newMistakes));
    setMistakes(newMistakes);
  };

  useEffect(() => {
    let filtered = mistakes;
    if (knowledgeFilter !== 'all') {
      filtered = filtered.filter(m => m.knowledgePoints.includes(knowledgeFilter));
    }
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(m => m.errorReason === reasonFilter);
    }
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(m => new Date(m.date) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(m => new Date(m.date) >= monthAgo);
    }
    if (searchText) {
      filtered = filtered.filter(m => 
        m.questionText.includes(searchText) || 
        m.studentName?.includes(searchText)
      );
    }
    setFilteredMistakes(filtered);
  }, [mistakes, knowledgeFilter, reasonFilter, timeRange, searchText]);

  const handleAddMistake = (newMistake: Mistake) => {
    const updated = [...mistakes, newMistake];
    saveMistakes(updated);
  };

  const handleDeleteMistake = (id: string) => {
    const updated = mistakes.filter(m => m.id !== id);
    saveMistakes(updated);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedMistakes);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedMistakes(newSet);
  };

  const selectAll = () => {
    if (selectedMistakes.size === filteredMistakes.length) {
      setSelectedMistakes(new Set());
    } else {
      setSelectedMistakes(new Set(filteredMistakes.map(m => m.id)));
    }
  };

  const handleGeneratePractice = () => setShowPracticeDialog(true);
  const handleExport = () => setShowExportDialog(true);

  return (
    <Card className="eco-card-shadow border-[#d4e4d4]">
      <CardHeader>
        <CardTitle className="text-lg text-[#2c3e2c]">错题本管理</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 工具栏 */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> 快速录入
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowStats(true)}>
              <BarChart2 className="w-4 h-4 mr-1" /> 数据分析
            </Button>
            <Button size="sm" variant="outline" onClick={handleGeneratePractice}>
              <BookOpen className="w-4 h-4 mr-1" /> 生成练习卷
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" /> 导出
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              placeholder="搜索题目/学生"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-48 h-8"
            />
            <Select value={knowledgeFilter} onValueChange={setKnowledgeFilter}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue placeholder="知识点" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部知识点</SelectItem>
                {knowledgePoints.map(kp => (
                  <SelectItem key={kp.id} value={kp.id}>{kp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="错误原因" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部原因</SelectItem>
                <SelectItem value="审题不清">审题不清</SelectItem>
                <SelectItem value="计算错误">计算错误</SelectItem>
                <SelectItem value="概念不懂">概念不懂</SelectItem>
                <SelectItem value="方法不会">方法不会</SelectItem>
                <SelectItem value="粗心">粗心</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="week">最近一周</SelectItem>
                <SelectItem value="month">最近一月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 错题列表 */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f0f7f0]">
              <tr>
                <th className="w-8 px-2 py-2">
                  <Checkbox 
                    checked={selectedMistakes.size === filteredMistakes.length && filteredMistakes.length > 0} 
                    onCheckedChange={selectAll} 
                  />
                </th>
                <th className="text-left px-4 py-2 text-sm font-medium text-[#2e5c2e]">学生</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-[#2e5c2e]">题目</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-[#2e5c2e]">知识点</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-[#2e5c2e]">错误原因</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-[#2e5c2e]">日期</th>
                <th className="w-20 px-4 py-2 text-sm font-medium text-[#2e5c2e]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMistakes.map(mistake => (
                <tr key={mistake.id} className="border-t border-[#e8f5e9] hover:bg-[#f8fbf8]">
                  <td className="px-2 py-2 text-center">
                    <Checkbox 
                      checked={selectedMistakes.has(mistake.id)} 
                      onCheckedChange={() => toggleSelect(mistake.id)} 
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-[#5a6b5a]">{mistake.studentName || '-'}</td>
                  <td className="px-4 py-2 text-sm text-[#2c3e2c] max-w-xs truncate">{mistake.questionText}</td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {mistake.knowledgePoints.map(kpId => {
                        const kp = knowledgePoints.find(k => k.id === kpId);
                        return kp ? (
                          <Badge key={kpId} variant="outline" className="bg-[#e8f5e9] text-[#4d8b4d] border-0">
                            {kp.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-[#5a6b5a]">{mistake.errorReason}</td>
                  <td className="px-4 py-2 text-sm text-[#8a9a8a]">{format(new Date(mistake.date), 'yyyy-MM-dd')}</td>
                  <td className="px-4 py-2 text-sm">
                    <button onClick={() => handleDeleteMistake(mistake.id)} className="text-red-500 hover:text-red-700">
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMistakes.length === 0 && (
            <div className="py-12 text-center text-[#8a9a8a]">暂无错题</div>
          )}
        </div>

        {/* 子对话框 */}
        {showAddDialog && (
          <MistakeQuickAdd
            open={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            onSave={handleAddMistake}
            students={students}
            className={className}
          />
        )}
        {showStats && (
          <MistakeStats
            open={showStats}
            onClose={() => setShowStats(false)}
            mistakes={mistakes}
          />
        )}
        {showExportDialog && (
          <MistakeExport
            open={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            selectedMistakes={selectedMistakes}
            allMistakes={mistakes}
          />
        )}
        {showPracticeDialog && (
          <MistakePractice
            open={showPracticeDialog}
            onClose={() => setShowPracticeDialog(false)}
            selectedMistakes={selectedMistakes}
            allMistakes={mistakes}
          />
        )}
      </CardContent>
    </Card>
  );
}