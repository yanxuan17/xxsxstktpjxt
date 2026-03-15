import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

interface MistakePracticeProps {
  open: boolean;
  onClose: () => void;
  selectedMistakes: Set<string>;
  allMistakes: Mistake[];
}

export function MistakePractice({ open, onClose, selectedMistakes, allMistakes }: MistakePracticeProps) {
  const [practiceMistakes, setPracticeMistakes] = useState<Mistake[]>([]);

  useEffect(() => {
    if (open) {
      const selected = allMistakes.filter(m => selectedMistakes.has(m.id));
      setPracticeMistakes(selected);
    }
  }, [open, selectedMistakes, allMistakes]);

  const handleMarkMastered = (id: string) => {
    setPracticeMistakes(prev => prev.filter(m => m.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#2c3e2c]">生成练习卷</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {practiceMistakes.length === 0 ? (
            <p className="text-center text-[#8a9a8a] py-8">暂无错题可供练习</p>
          ) : (
            practiceMistakes.map((mistake, index) => (
              <div key={mistake.id} className="p-4 bg-[#f8fbf8] rounded-lg border border-[#e8f5e9]">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-[#2c3e2c]">第 {index + 1} 题</span>
                  <Button size="sm" variant="outline" onClick={() => handleMarkMastered(mistake.id)}>标记已掌握</Button>
                </div>
                <p className="mt-2 text-sm">{mistake.questionText}</p>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[#8a9a8a]">你的答案：</span>{mistake.wrongAnswer}</div>
                  <div><span className="text-[#8a9a8a]">正确答案：</span>{mistake.correctAnswer}</div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-[#8a9a8a]">错误原因：</span>{mistake.errorReason}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white">重做</Button>
                  <Button size="sm" variant="outline">订正</Button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>关闭</Button>
          {practiceMistakes.length > 0 && (
            <Button className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white">打印练习卷</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}