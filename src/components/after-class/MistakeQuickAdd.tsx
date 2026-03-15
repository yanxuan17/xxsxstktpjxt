import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { knowledgePoints } from '@/data/knowledgePoints';
import { Camera, Upload, X } from 'lucide-react';

// 内部定义类型
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
  imageUrl?: string;   // 存储图片的 DataURL 或路径
  notes?: string;
  mastered: boolean;
  createdAt: string;
}

interface MistakeQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSave: (mistake: Mistake) => void;
  students: { id: number; name: string }[];
  className?: string;
}

export function MistakeQuickAdd({ open, onClose, onSave, students, className }: MistakeQuickAddProps) {
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [wrongAnswer, setWrongAnswer] = useState('');
  const [errorReason, setErrorReason] = useState<ErrorReason>('计算错误');
  const [customReason, setCustomReason] = useState('');
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);
  const [studentId, setStudentId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'manual' | 'photo'>('manual');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!questionText || !correctAnswer || !wrongAnswer || !errorReason || selectedKnowledge.length === 0) {
      alert('请填写完整信息');
      return;
    }
    const newMistake: Mistake = {
      id: `mistake_${Date.now()}`,
      date: new Date().toISOString(),
      className: className || '',
      studentId: studentId || undefined,
      studentName: studentId ? students.find(s => s.id === studentId)?.name : undefined,
      questionText,
      correctAnswer,
      wrongAnswer,
      errorReason,
      customReason: errorReason === '自定义' ? customReason : undefined,
      knowledgePoints: selectedKnowledge,
      imageUrl: image || undefined,
      notes,
      mastered: false,
      createdAt: new Date().toISOString(),
    };
    onSave(newMistake);
    // 重置表单
    setQuestionText('');
    setCorrectAnswer('');
    setWrongAnswer('');
    setErrorReason('计算错误');
    setCustomReason('');
    setSelectedKnowledge([]);
    setStudentId('');
    setNotes('');
    setImage(null);
    onClose();
  };

  const handlePhotoCapture = () => {
    // 模拟拍照识别（实际开发中应调用相机 API 或 OCR）
    alert('拍照识别功能演示（实际需调用设备相机并识别文字）');
    setQuestionText('小明有5个苹果，小红有3个苹果，他们一共有几个苹果？');
    setCorrectAnswer('8');
    setWrongAnswer('7');
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 限制文件大小（例如 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // 清空文件选择
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#2c3e2c]">快速录入错题</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* 输入方式选择 */}
          <div className="flex gap-4">
            <Button
              variant={inputMethod === 'manual' ? 'default' : 'outline'}
              onClick={() => setInputMethod('manual')}
              className={inputMethod === 'manual' ? 'bg-[#4d8b4d]' : ''}
            >
              手动录入
            </Button>
            <Button
              variant={inputMethod === 'photo' ? 'default' : 'outline'}
              onClick={() => {
                setInputMethod('photo');
                handlePhotoCapture();
              }}
              className={inputMethod === 'photo' ? 'bg-[#4d8b4d]' : ''}
            >
              <Camera className="w-4 h-4 mr-2" />
              拍照识别
            </Button>
          </div>

          {/* 学生选择 */}
          <div>
            <Label>学生（可选）</Label>
            <Select
              value={studentId === '' ? 'none' : studentId.toString()}
              onValueChange={(v) => {
                if (v === 'none') setStudentId('');
                else setStudentId(parseInt(v));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不指定学生</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.id} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 题目 */}
          <div>
            <Label>题目</Label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="请输入题目内容"
              rows={3}
            />
          </div>

          {/* 正确答案和错误答案 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>正确答案</Label>
              <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />
            </div>
            <div>
              <Label>错误答案</Label>
              <Input value={wrongAnswer} onChange={(e) => setWrongAnswer(e.target.value)} />
            </div>
          </div>

          {/* 错误原因 */}
          <div>
            <Label>错误原因</Label>
            <Select value={errorReason} onValueChange={(v: ErrorReason) => setErrorReason(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="审题不清">审题不清</SelectItem>
                <SelectItem value="计算错误">计算错误</SelectItem>
                <SelectItem value="概念不懂">概念不懂</SelectItem>
                <SelectItem value="方法不会">方法不会</SelectItem>
                <SelectItem value="粗心">粗心</SelectItem>
                <SelectItem value="自定义">自定义</SelectItem>
              </SelectContent>
            </Select>
            {errorReason === '自定义' && (
              <Input
                className="mt-2"
                placeholder="请输入自定义原因"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>

          {/* 知识点标签 */}
          <div>
            <Label>知识点</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {knowledgePoints.map((kp) => (
                <label key={kp.id} className="flex items-center space-x-2 text-sm">
                  <Checkbox
                    checked={selectedKnowledge.includes(kp.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedKnowledge([...selectedKnowledge, kp.id]);
                      } else {
                        setSelectedKnowledge(selectedKnowledge.filter((id) => id !== kp.id));
                      }
                    }}
                  />
                  <span>{kp.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 图片上传（真正实现） */}
          <div>
            <Label>错题图片（可选）</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {!image ? (
                <Button variant="outline" onClick={triggerFileInput}>
                  <Upload className="w-4 h-4 mr-2" />
                  选择图片
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative w-16 h-16 border rounded overflow-hidden">
                    <img src={image} alt="预览" className="w-full h-full object-cover" />
                  </div>
                  <Button variant="outline" size="sm" onClick={clearImage}>
                    <X className="w-4 h-4 mr-1" />
                    移除
                  </Button>
                </div>
              )}
              <span className="text-xs text-gray-400 ml-2">支持 jpg/png，不超过5MB</span>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <Label>备注</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：易错点提示"
              rows={2}
            />
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave} className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white">
              保存错题
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}