import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Upload, Save } from 'lucide-react';
import { knowledgePoints } from '@/data/knowledgePoints';
import { Mistake, ErrorReason } from '@/types';

// 模拟 API 保存函数（实际应调用后端）
async function saveMistakeToServer(mistake: Mistake): Promise<boolean> {
  console.log('保存错题到服务器', mistake);
  // 模拟异步保存
  return new Promise(resolve => setTimeout(() => resolve(true), 500));
}

export default function MobileMistakeEntry() {
  const [searchParams] = useSearchParams();
  const className = searchParams.get('class') || '未知班级';

  // 表单状态
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [wrongAnswer, setWrongAnswer] = useState('');
  const [errorReason, setErrorReason] = useState<ErrorReason>('计算错误');
  const [customReason, setCustomReason] = useState('');
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);
  const [studentName, setStudentName] = useState('');
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 模拟拍照识别
  const handlePhotoCapture = () => {
    // 这里可以调用相机API，为了演示，直接填充模拟数据
    alert('演示：拍照识别功能');
    setQuestionText('小明有5个苹果，小红有3个苹果，他们一共有几个苹果？');
    setCorrectAnswer('8');
    setWrongAnswer('7');
    // 自动匹配知识点（简单规则）
    if (questionText.includes('苹果')) {
      setSelectedKnowledge(['calc1']);
    }
  };

  // 自动打知识点标签（简易实现）
  useEffect(() => {
    if (questionText) {
      const matched: string[] = [];
      knowledgePoints.forEach(kp => {
        if (questionText.includes(kp.name) || 
            (kp.id === 'calc1' && (questionText.includes('加减') || questionText.includes('苹果')))) {
          matched.push(kp.id);
        }
      });
      if (matched.length > 0) {
        setSelectedKnowledge(matched);
      }
    }
  }, [questionText]);

  const handleSave = async () => {
    if (!questionText || !correctAnswer || !wrongAnswer || selectedKnowledge.length === 0) {
      alert('请填写完整信息');
      return;
    }

    const newMistake: Mistake = {
      id: `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      className,
      studentName: studentName || undefined,
      questionText,
      correctAnswer,
      wrongAnswer,
      errorReason,
      customReason: errorReason === '自定义' ? customReason : undefined,
      knowledgePoints: selectedKnowledge,
      imageUrl: imagePreview || undefined,
      notes,
      mastered: false,
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      await saveMistakeToServer(newMistake);
      setSaved(true);
      // 重置表单
      setQuestionText('');
      setCorrectAnswer('');
      setWrongAnswer('');
      setErrorReason('计算错误');
      setCustomReason('');
      setSelectedKnowledge([]);
      setStudentName('');
      setNotes('');
      setImagePreview(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbf8] p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-[#2c3e2c]">手机错题录入</CardTitle>
          <p className="text-sm text-[#8a9a8a]">班级：{className}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {saved && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center">
              错题已保存，感谢您的贡献！
            </div>
          )}

          <Button onClick={handlePhotoCapture} className="w-full bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white">
            <Camera className="w-4 h-4 mr-2" />
            拍照识别
          </Button>

          <div>
            <Label>学生姓名（可选）</Label>
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="例如：张三" />
          </div>

          <div>
            <Label>题目</Label>
            <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>正确答案</Label>
              <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />
            </div>
            <div>
              <Label>错误答案</Label>
              <Input value={wrongAnswer} onChange={(e) => setWrongAnswer(e.target.value)} />
            </div>
          </div>

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
              <Input className="mt-2" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="请输入自定义原因" />
            )}
          </div>

          <div>
            <Label>知识点（自动匹配后可手动调整）</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
              {knowledgePoints.map(kp => (
                <label key={kp.id} className="flex items-center space-x-2 text-sm">
                  <Checkbox
                    checked={selectedKnowledge.includes(kp.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedKnowledge([...selectedKnowledge, kp.id]);
                      else setSelectedKnowledge(selectedKnowledge.filter(id => id !== kp.id));
                    }}
                  />
                  <span>{kp.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>图片（可选）</Label>
            <Button variant="outline" className="w-full" onClick={() => {
              // 模拟上传图片
              setImagePreview('mock-image.jpg');
              alert('演示：图片上传');
            }}>
              <Upload className="w-4 h-4 mr-2" /> 上传图片
            </Button>
          </div>

          <div>
            <Label>备注</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white">
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存错题'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}