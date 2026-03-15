import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface MistakeExportProps {
  open: boolean;
  onClose: () => void;
  selectedMistakes: Set<string>;
  allMistakes: Mistake[];
}

export function MistakeExport({ open, onClose, selectedMistakes, allMistakes }: MistakeExportProps) {
  const [exportType, setExportType] = useState<'selected' | 'all'>('selected');
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeReasons, setIncludeReasons] = useState(true);

  const handleExport = () => {
    const mistakesToExport = exportType === 'selected'
      ? allMistakes.filter(m => selectedMistakes.has(m.id))
      : allMistakes;

    if (mistakesToExport.length === 0) {
      alert('没有可导出的错题');
      return;
    }

    const doc = new jsPDF();
    doc.text('错题本', 14, 16);

    const tableColumn = ['题目', '正确答案', '错误答案', '错误原因', '日期'];
    const tableRows = mistakesToExport.map(m => [
      m.questionText,
      includeAnswers ? m.correctAnswer : '-',
      includeAnswers ? m.wrongAnswer : '-',
      includeReasons ? m.errorReason : '-',
      new Date(m.date).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save('错题本.pdf');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#2c3e2c]">导出错题</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>导出范围</Label>
            <RadioGroup value={exportType} onValueChange={(v: any) => setExportType(v)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected">仅选中的错题 ({selectedMistakes.size}题)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">全部错题 ({allMistakes.length}题)</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>包含内容</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="answers" checked={includeAnswers} onCheckedChange={(c) => setIncludeAnswers(!!c)} />
              <Label htmlFor="answers">包含答案</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="reasons" checked={includeReasons} onCheckedChange={(c) => setIncludeReasons(!!c)} />
              <Label htmlFor="reasons">包含错误原因</Label>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">取消</Button>
            <Button onClick={handleExport} className="flex-1 bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white">导出 PDF</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}