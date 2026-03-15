import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Star, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudents } from '@/hooks/useStudents';
import type { StudentInfo } from '@/types';
import { MistakeBoard } from './MistakeBoard';

interface Homework {
  id: string;
  date: string;
  className: string;
  title: string;
  fileUrl?: string;
  answerUrl?: string;
  excellentWorks: ExcellentWork[];
  typicalMistakes: TypicalMistake[];
}

interface ExcellentWork {
  id: string;
  studentId: number;
  studentName: string;
  fileUrl?: string;
  description: string;
  createdAt: string;
}

interface TypicalMistake {
  id: string;
  description: string;
  imageUrl?: string;
  analysis: string;
  suggestion: string;
  createdAt: string;
}

interface TeacherHomeworkProps {
  selectedDate: string;
  className?: string;
  userId?: string;
}

export function TeacherHomework({ selectedDate, className, userId }: TeacherHomeworkProps) {
  const { students } = useStudents(className ? { grade: className.split('(')[0], classNumber: parseInt(className.match(/\d+/)?.[0] || '1'), fullName: className } : undefined);
  
  const [homework, setHomework] = useState<Homework | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExcellentDialog, setShowExcellentDialog] = useState(false);
  const [showMistakeDialog, setShowMistakeDialog] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [excellentDescription, setExcellentDescription] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [mistakeDesc, setMistakeDesc] = useState('');
  const [mistakeAnalysis, setMistakeAnalysis] = useState('');
  const [mistakeSuggestion, setMistakeSuggestion] = useState('');

  const storageKey = `teacher_homework_${selectedDate}_${className}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setHomework(JSON.parse(saved));
    } else {
      setHomework({
        id: `hw_${Date.now()}`,
        date: selectedDate,
        className: className || '',
        title: '',
        excellentWorks: [],
        typicalMistakes: [],
      });
    }
  }, [storageKey, selectedDate, className]);

  const saveHomework = useCallback((updated: Homework) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setHomework(updated);
  }, [storageKey]);

  const handleUploadHomework = () => {
    if (!homework) {
      alert('作业信息加载失败，请刷新页面后重试');
      return;
    }
    if (!homeworkTitle.trim()) {
      alert('请输入作业标题');
      return;
    }
    try {
      const updated = {
        ...homework,
        title: homeworkTitle.trim(),
        fileUrl: 'homework.pdf',
        answerUrl: 'answer.pdf',
      };
      saveHomework(updated);
      setShowUploadDialog(false);
      setHomeworkTitle('');
      alert('作业已保存成功！');
    } catch (error) {
      console.error('保存作业失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  const handleAddExcellentWork = () => {
    if (!selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const newWork: ExcellentWork = {
      id: `ex_${Date.now()}`,
      studentId: selectedStudentId,
      studentName: student.name,
      fileUrl: 'excellent.jpg',
      description: excellentDescription,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...homework!,
      excellentWorks: [...homework!.excellentWorks, newWork],
    };
    saveHomework(updated);
    setShowExcellentDialog(false);
    setSelectedStudentId(null);
    setExcellentDescription('');
  };

  const handleAddMistake = () => {
    if (!mistakeDesc.trim()) return;
    const newMistake: TypicalMistake = {
      id: `mis_${Date.now()}`,
      description: mistakeDesc,
      imageUrl: 'mistake.jpg',
      analysis: mistakeAnalysis,
      suggestion: mistakeSuggestion,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...homework!,
      typicalMistakes: [...homework!.typicalMistakes, newMistake],
    };
    saveHomework(updated);
    setShowMistakeDialog(false);
    setMistakeDesc('');
    setMistakeAnalysis('');
    setMistakeSuggestion('');
  };

  const deleteExcellentWork = (id: string) => {
    const updated = {
      ...homework!,
      excellentWorks: homework!.excellentWorks.filter(w => w.id !== id),
    };
    saveHomework(updated);
  };

  const deleteMistake = (id: string) => {
    const updated = {
      ...homework!,
      typicalMistakes: homework!.typicalMistakes.filter(m => m.id !== id),
    };
    saveHomework(updated);
  };

  if (!homework) return null;

  return (
    <div className="space-y-6">
      {/* 作业信息卡片 */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#2c3e2c] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4d8b4d]" />
              课后作业管理
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {homework.fileUrl ? (
                <div className="space-y-1">
                  <p className="text-sm text-[#5a6b5a]">
                    已上传作业：<span className="text-[#2c3e2c] font-medium">{homework.title || '未命名'}</span>
                  </p>
                  <p className="text-xs text-[#8a9a8a]">答案文件已上传</p>
                </div>
              ) : (
                <p className="text-sm text-[#8a9a8a]">尚未上传作业与答案</p>
              )}
            </div>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {homework.fileUrl ? '更新作业' : '上传作业'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 优秀作业区 */}
      <Card className="eco-card-shadow border-[#d4e4d4]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#2c3e2c] flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              优秀作业案例
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowExcellentDialog(true)}
              className="border-[#4d8b4d] text-[#4d8b4d]"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加优秀作业
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {homework.excellentWorks.length === 0 ? (
            <p className="text-sm text-[#8a9a8a] text-center py-4">暂无优秀作业</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homework.excellentWorks.map(work => (
                <div key={work.id} className="p-3 bg-[#f8fbf8] rounded-lg border border-[#e8f5e9] relative group">
                  <button
                    onClick={() => deleteExcellentWork(work.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#2c3e2c]">{work.studentName}</p>
                      <p className="text-sm text-[#5a6b5a] mt-1">{work.description}</p>
                      <p className="text-xs text-[#8a9a8a] mt-1">
                        {new Date(work.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 错题本管理（替代典型错题集） */}
      <MistakeBoard className={className} />

      {/* 上传作业对话框 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">上传课后作业</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作业标题</label>
              <input
                type="text"
                value={homeworkTitle}
                onChange={(e) => setHomeworkTitle(e.target.value)}
                placeholder="例如：第3单元练习"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上传作业文件</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <p className="text-xs text-gray-400 mt-1">支持 PDF、Word、TXT 格式</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上传答案文件</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleUploadHomework} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加优秀作业对话框 */}
      <Dialog open={showExcellentDialog} onOpenChange={setShowExcellentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">添加优秀作业</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择学生</label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">请选择学生</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上传作业图片/文件</label>
              <input type="file" accept="image/*,.pdf" className="block w-full text-sm text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
              <textarea
                value={excellentDescription}
                onChange={(e) => setExcellentDescription(e.target.value)}
                rows={3}
                placeholder="例如：解题思路清晰，书写工整"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowExcellentDialog(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleAddExcellentWork} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加错题对话框 */}
      <Dialog open={showMistakeDialog} onOpenChange={setShowMistakeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2c3e2c]">添加典型错题</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">错题描述</label>
              <textarea
                value={mistakeDesc}
                onChange={(e) => setMistakeDesc(e.target.value)}
                rows={2}
                placeholder="例如：第3题计算错误，混淆了乘法分配律"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上传错题截图</label>
              <input type="file" accept="image/*" className="block w-full text-sm text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">错误分析</label>
              <textarea
                value={mistakeAnalysis}
                onChange={(e) => setMistakeAnalysis(e.target.value)}
                rows={2}
                placeholder="分析错误原因..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">改进建议</label>
              <textarea
                value={mistakeSuggestion}
                onChange={(e) => setMistakeSuggestion(e.target.value)}
                rows={2}
                placeholder="如何避免此类错误..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowMistakeDialog(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleAddMistake} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}