import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, RefreshCw, User, Info, ChevronDown, ChevronUp, Volume2, VolumeX, MessageCircle, Send, X, Save } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { lessonPlanDimensions } from '@/data/evaluationData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreResult {
  dimension: string;
  score: number;
  fullMark: number;
}

interface DetailedSuggestion {
  dimension: string;
  currentScore: number;
  maxScore: number;
  issues: string[];
  improvements: string[];
  positiveFeedback: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface TeacherEvaluationProps {
  selectedDate: string;
  teacherName?: string;
  userId?: string;
}

const dimensionDescriptions: Record<string, { description: string; criteria: string[] }> = {
  '教学目标设计': {
    description: '教学目标应明确、可测量，符合课程标准要求，体现学科核心素养',
    criteria: [
      '目标表述清晰，使用可观察、可测量的行为动词',
      '目标涵盖知识与技能、过程与方法、情感态度价值观三维目标',
      '目标难度适中，符合学生认知发展水平',
      '目标与课程标准、单元目标保持一致'
    ]
  },
  '三单设计质量': {
    description: '预习单、学习单、作业单设计合理，形成完整的学习支持体系',
    criteria: [
      '预习单：引导学生自主预习，激活已有知识，发现疑问',
      '学习单：支持课堂探究活动，提供学习支架和思考路径',
      '作业单：分层设计，既有基础巩固又有拓展提升',
      '三单之间逻辑衔接，形成完整的学习链条'
    ]
  },
  '生态课堂要素': {
    description: '体现生态课堂四要素：师生互动、环境适配、知识呈现、学生自主',
    criteria: [
      '师生互动：设计有效的师生对话和生生互动环节',
      '环境适配：考虑教学资源、空间布局、技术支撑',
      '知识呈现：从生活情境引入，体现数学与生活的联系',
      '学生自主：设计学生自主探究、合作学习的环节'
    ]
  },
  '教学评一体化': {
    description: '评价任务与教学目标一致，过程性评价贯穿教学全过程',
    criteria: [
      '评价任务与教学目标高度匹配',
      '设计多元化的评价方式（自评、互评、师评）',
      '过程性评价嵌入教学各环节',
      '评价标准明确，便于学生理解和执行'
    ]
  }
};

// AI Expert responses for chat
const aiResponses: Record<string, string[]> = {
  'default': [
    '您好！我是您的教学设计专家助手。我可以帮您分析教案、解答教学困惑。请问有什么问题？',
    '您的教案设计思路很好，建议再考虑一下学生的认知起点。',
    '生态课堂强调师生互动、环境适配、知识呈现和学生自主四个要素，您可以从这些方面优化设计。',
    '三单设计是课前预习单、课堂学习单和课后作业单，它们应该形成完整的学习链条。',
    '教学目标建议使用可测量的行为动词，如"理解、掌握、能够、会"等。',
    '评价任务要与教学目标一一对应，这样才能实现教学评一体化。',
  ],
  '目标': [
    '教学目标设计建议：使用ABCD法，即Audience（对象）、Behavior（行为）、Condition（条件）、Degree（标准）。',
    '好的教学目标应该具体、可测量、可达成、相关性强、有时限。',
    '三维目标要融合设计，不能只关注知识目标，还要关注过程方法和情感态度。',
  ],
  '三单': [
    '预习单设计要点：激活旧知、引出新知、发现疑问。可以设计"我知道、我疑问、我想学"三个板块。',
    '学习单要提供学习支架，如思考路径图、思维导图、操作指南等。',
    '作业单要分层设计，A层基础巩固、B层能力提升、C层拓展挑战。',
  ],
  '生态': [
    '生态课堂四要素：师生互动（对话质量）、环境适配（资源支持）、知识呈现（情境创设）、学生自主（探究空间）。',
    '师生互动要注重提问质量，多设计开放性问题，给学生思考时间。',
    '学生自主探究要有明确任务、充足时间、有效支架和及时反馈。',
  ],
  '评价': [
    '教学评一体化要求：目标-活动-评价三者一致。',
    '过程性评价要嵌入教学各环节，及时诊断、及时反馈、及时调整。',
    '评价方式要多元化：自评、互评、师评相结合。',
  ],
};

const generateDetailedSuggestions = (results: ScoreResult[]): DetailedSuggestion[] => {
  return results.map(result => {
    const percentage = result.score / result.fullMark;
    const issues: string[] = [];
    const improvements: string[] = [];
    const positiveFeedback: string[] = [];

    if (result.dimension === '教学目标设计') {
      if (percentage >= 0.8) {
        positiveFeedback.push('目标表述清晰，使用了恰当的行为动词');
        positiveFeedback.push('三维目标设计完整，层次清晰');
        positiveFeedback.push('目标难度适中，符合学生认知水平');
      }
      if (percentage < 1.0) {
        improvements.push('可以进一步细化目标，使其更加具体可测');
        improvements.push('建议增加情感态度价值观目标的具体体现');
      }
      if (percentage < 0.8) {
        issues.push('目标表述不够清晰，缺乏可测量的行为动词');
        issues.push('三维目标体现不够全面');
        improvements.push('使用"理解、掌握、能够、会"等可观察的行为动词');
        improvements.push('明确列出知识与技能、过程与方法、情感态度价值观目标');
        improvements.push('参考布鲁姆教育目标分类学，设计不同认知层次的目标');
      }
    } else if (result.dimension === '三单设计质量') {
      if (percentage >= 0.8) {
        positiveFeedback.push('三单设计完整，层次清晰');
        positiveFeedback.push('预习单、学习单、作业单之间衔接良好');
        positiveFeedback.push('学习单提供了有效的学习支架');
      }
      if (percentage < 1.0) {
        improvements.push('可以进一步优化作业单的分层设计');
        improvements.push('建议增加学习单中的思维可视化工具');
      }
      if (percentage < 0.8) {
        issues.push('三单之间的衔接不够紧密');
        issues.push('学习单对学生自主学习的支持不足');
        improvements.push('预习单设计"我知道、我疑问、我想学"三个板块');
        improvements.push('学习单提供思考路径图或思维导图支架');
        improvements.push('作业单分A、B、C三层，满足不同学生需求');
      }
    } else if (result.dimension === '生态课堂要素') {
      if (percentage >= 0.8) {
        positiveFeedback.push('师生互动设计充分，对话质量高');
        positiveFeedback.push('学生自主探究环节设计合理');
        positiveFeedback.push('知识呈现与生活情境联系紧密');
      }
      if (percentage < 1.0) {
        improvements.push('可以增加更多生生互动环节');
        improvements.push('建议优化小组合作的分工设计');
      }
      if (percentage < 0.8) {
        issues.push('学生自主探究环节设计不足');
        issues.push('师生互动形式单一');
        improvements.push('增加小组合作探究环节，明确分工和任务');
        improvements.push('设计开放性问题，鼓励学生提出不同解法');
        improvements.push('创设真实情境，让数学知识与生活实际相联系');
      }
    } else if (result.dimension === '教学评一体化') {
      if (percentage >= 0.8) {
        positiveFeedback.push('评价任务与教学目标高度匹配');
        positiveFeedback.push('过程性评价设计完整，嵌入教学各环节');
        positiveFeedback.push('评价方式多元化，自评互评师评结合');
      }
      if (percentage < 1.0) {
        improvements.push('可以增加更多即时评价点');
        improvements.push('建议优化评价标准的表述，让学生更易理解');
      }
      if (percentage < 0.8) {
        issues.push('评价任务与目标匹配度不够');
        issues.push('缺乏过程性评价设计');
        improvements.push('每个教学目标对应设计1-2个评价任务');
        improvements.push('设计学生自评表和小组互评表');
        improvements.push('在关键学习节点设置检查点，及时反馈');
      }
    }

    return {
      dimension: result.dimension,
      currentScore: result.score,
      maxScore: result.fullMark,
      issues,
      improvements,
      positiveFeedback
    };
  });
};

export function TeacherEvaluation({ selectedDate, teacherName, userId }: TeacherEvaluationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<ScoreResult[] | null>(null);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<DetailedSuggestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [lessonTeacher, setLessonTeacher] = useState(teacherName || '');
  const [lessonTitle, setLessonTitle] = useState('');
  const [titleConfirmed, setTitleConfirmed] = useState(false); // 新增：教案名称是否已确认保存
  
  // AI Voice & Chat states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '您好！我是您的教学设计专家助手。我可以帮您分析教案、解答教学困惑。请问有什么问题？', timestamp: Date.now() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // 用于触发文件选择

  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const speakText = (text: string) => {
    if (!speechSynthRef.current) return;
    
    // Cancel any ongoing speech
    speechSynthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('目标') || lowerInput.includes('教学目的')) {
      return aiResponses['目标'][Math.floor(Math.random() * aiResponses['目标'].length)];
    }
    if (lowerInput.includes('三单') || lowerInput.includes('预习') || lowerInput.includes('作业')) {
      return aiResponses['三单'][Math.floor(Math.random() * aiResponses['三单'].length)];
    }
    if (lowerInput.includes('生态') || lowerInput.includes('互动') || lowerInput.includes('自主')) {
      return aiResponses['生态'][Math.floor(Math.random() * aiResponses['生态'].length)];
    }
    if (lowerInput.includes('评价') || lowerInput.includes('评估')) {
      return aiResponses['评价'][Math.floor(Math.random() * aiResponses['评价'].length)];
    }
    
    return aiResponses['default'][Math.floor(Math.random() * aiResponses['default'].length)];
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    // Generate AI response
    setTimeout(() => {
      const response = generateAIResponse(userMessage.content);
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 500);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!titleConfirmed) {
      alert('请先填写教案名称并点击保存');
      return;
    }
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [titleConfirmed]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.type === 'application/pdf' ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.pdf')) {
      setUploadedFile(file);
    } else {
      alert('请上传 Word (.docx) 或 PDF 格式的文件');
    }
  };

  const handleTitleSave = () => {
    if (!lessonTitle.trim()) {
      alert('请填写教案名称');
      return;
    }
    setTitleConfirmed(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLessonTitle(e.target.value);
    setTitleConfirmed(false); // 名称变更后需要重新保存
  };

  const handleFileButtonClick = () => {
    if (!titleConfirmed) {
      alert('请先填写教案名称并点击保存');
      return;
    }
    fileInputRef.current?.click();
  };

  const startEvaluation = async () => {
    if (!uploadedFile) return;
    if (!lessonTeacher.trim()) {
      alert('请填写授课人姓名');
      return;
    }
    if (!lessonTitle.trim()) {
      alert('请填写教案名称');
      return;
    }
    if (!titleConfirmed) {
      alert('请先点击保存确认教案名称');
      return;
    }
    
    setIsEvaluating(true);
    
    // Simulate AI evaluation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate scores for demo
    const results: ScoreResult[] = lessonPlanDimensions.map(dim => ({
      dimension: dim.name,
      score: Math.floor(Math.random() * (dim.maxScore - 10)) + 10,
      fullMark: dim.maxScore,
    }));
    
    setEvaluationResult(results);
    
    // Generate detailed suggestions
    const suggestions = generateDetailedSuggestions(results);
    setIsEvaluating(false);
    
    // Start typing effect
    setIsTyping(true);
    setDisplayedSuggestions([]);
    for (let i = 0; i < suggestions.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setDisplayedSuggestions(prev => [...prev, suggestions[i]]);
    }
    setIsTyping(false);

    // Save to localStorage with user isolation
    const evaluationData = {
      teacherName: lessonTeacher,
      lessonTitle: lessonTitle,
      date: selectedDate,
      fileName: uploadedFile.name,
      scores: results,
      suggestions: suggestions,
      userId: userId,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`lesson_plan_${selectedDate}_${userId || 'default'}`, JSON.stringify(evaluationData));
  };

  const resetEvaluation = () => {
    setUploadedFile(null);
    setEvaluationResult(null);
    setDisplayedSuggestions([]);
    setLessonTeacher(teacherName || '');
    setLessonTitle('');
    setTitleConfirmed(false);
    stopSpeaking();
  };

  const totalScore = evaluationResult?.reduce((sum, r) => sum + r.score, 0) || 0;
  const maxScore = evaluationResult?.reduce((sum, r) => sum + r.fullMark, 0) || 100;
  const scorePercentage = Math.round((totalScore / maxScore) * 100);

  // Generate speech text from evaluation results
  const generateSpeechText = () => {
    if (!evaluationResult) return '';
    
    let text = `您好！我是您的教学设计评价助手。我已经分析了${lessonTeacher}老师的教案《${lessonTitle}》。总得分${totalScore}分，满分${maxScore}分。`;
    text += scorePercentage >= 85 ? '评价结果为优秀。' : scorePercentage >= 70 ? '评价结果为良好。' : '评价结果为待改进。';
    
    displayedSuggestions.forEach(s => {
      text += `${s.dimension}得分${s.currentScore}分。`;
      if (s.positiveFeedback.length > 0) {
        text += s.positiveFeedback[0] + '。';
      }
    });
    
    return text;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!evaluationResult && (
        <Card className="eco-card-shadow border-[#d4e4d4]">
          <CardHeader>
            <CardTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
              <Upload className="w-6 h-6 text-[#4d8b4d]" />
              上传教学设计
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Teacher Name Input */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#5a6b5a]">
                <User className="w-5 h-5" />
                <span className="text-base font-medium">授课人：</span>
              </div>
              <input
                type="text"
                placeholder="请输入授课教师姓名"
                value={lessonTeacher}
                onChange={(e) => setLessonTeacher(e.target.value)}
                className="flex-1 max-w-xs px-4 py-2.5 bg-[#f8fbf8] border border-[#d4e4d4] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
              />
            </div>

            {/* Lesson Title Input and Save Button */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#5a6b5a]">
                <FileText className="w-5 h-5" />
                <span className="text-base font-medium">教案名称：</span>
              </div>
              <input
                type="text"
                placeholder="例如：六年级下册《百分数的认识（二）》"
                value={lessonTitle}
                onChange={handleTitleChange}
                className="flex-1 max-w-xs px-4 py-2.5 bg-[#f8fbf8] border border-[#d4e4d4] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
              />
              <Button
                onClick={handleTitleSave}
                variant="outline"
                className="border-[#4d8b4d] text-[#4d8b4d] hover:bg-[#e8f5e9]"
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
              {titleConfirmed && (
                <span className="text-sm text-green-600">✓ 已保存</span>
              )}
            </div>

            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-[#4d8b4d] bg-[#e8f5e9]'
                    : 'border-[#d4e4d4] bg-[#f8fbf8] hover:border-[#7bc47b] hover:bg-[#f0f7f0]'
                }`}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                  <FileText className="w-10 h-10 text-[#4d8b4d]" />
                </div>
                <p className="text-lg text-[#2c3e2c] font-medium mb-2">拖拽文件到此处，或点击上传</p>
                <p className="text-base text-[#8a9a8a] mb-4">支持 Word (.docx) 和 PDF 格式</p>
                <input
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  onClick={handleFileButtonClick}
                  className="border-[#4d8b4d] text-[#4d8b4d] hover:bg-[#e8f5e9] cursor-pointer text-base px-6 py-2.5"
                >
                  选择文件
                </Button>
              </div>
            ) : (
              <div className="bg-[#f0f7f0] rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-[#4d8b4d] flex items-center justify-center">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-lg text-[#2c3e2c]">{uploadedFile.name}</p>
                      <p className="text-sm text-[#8a9a8a]">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-[#4d8b4d]" />
                    <span className="text-base text-[#4d8b4d] font-medium">已上传</span>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={startEvaluation}
                    disabled={isEvaluating}
                    className="bg-[#4d8b4d] hover:bg-[#3d7b3d] text-white text-base px-6 py-2.5"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        AI分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        开始智能评价
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetEvaluation}
                    className="border-[#d4e4d4] text-[#5a6b5a] text-base px-6 py-2.5"
                  >
                    重新上传
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evaluation Results */}
      {evaluationResult && (
        <div className="space-y-6 animate-fade-in-up">
          {/* AI Expert Feedback */}
          <Card className="eco-card-shadow border-[#d4e4d4]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#f4c430]" />
                AI专家评价报告
                <div className="flex-1"></div>
                {/* Voice Button */}
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakText(generateSpeechText())}
                  className={`p-2 rounded-lg transition-colors ${
                    isSpeaking ? 'bg-[#4d8b4d] text-white' : 'bg-[#e8f5e9] text-[#4d8b4d] hover:bg-[#4d8b4d] hover:text-white'
                  }`}
                  title={isSpeaking ? '停止朗读' : '朗读报告'}
                >
                  {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                {/* Chat Button */}
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-2 rounded-lg transition-colors ${
                    showChat ? 'bg-[#4d8b4d] text-white' : 'bg-[#e8f5e9] text-[#4d8b4d] hover:bg-[#4d8b4d] hover:text-white'
                  }`}
                  title="与AI专家对话"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 relative">
                  <img
                    src="/teacher-avatar.png"
                    alt="AI教师专家"
                    className="w-28 h-28 rounded-full animate-float"
                  />
                  {isSpeaking && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#4d8b4d] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-[#f0f7f0] rounded-xl p-5 relative">
                    <div className="absolute -left-2 top-6 w-4 h-4 bg-[#f0f7f0] transform rotate-45"></div>
                    <p className="text-base text-[#5a6b5a] mb-3">
                      您好！我是您的教学设计评价助手。我已经分析了<span className="font-medium text-[#4d8b4d]">{lessonTeacher}</span>老师的教案<span className="font-medium text-[#4d8b4d]">《{lessonTitle}》</span>，以下是详细评价结果：
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="text-4xl font-bold text-[#4d8b4d]">{totalScore}</div>
                      <div className="text-base text-[#8a9a8a]">/ {maxScore} 分</div>
                      <div className={`px-4 py-1.5 rounded-full text-base font-medium ${
                        scorePercentage >= 85 ? 'bg-[#e8f5e9] text-[#4d8b4d]' :
                        scorePercentage >= 70 ? 'bg-[#fff8e1] text-[#e8913a]' :
                        'bg-[#ffebee] text-[#e74c3c]'
                      }`}>
                        {scorePercentage >= 85 ? '优秀' : scorePercentage >= 70 ? '良好' : '待改进'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Chat Dialog */}
              {showChat && (
                <div className="mt-6 border border-[#d4e4d4] rounded-xl overflow-hidden">
                  <div className="bg-[#f0f7f0] px-4 py-3 flex items-center justify-between">
                    <span className="font-medium text-[#2c3e2c]">与AI专家对话</span>
                    <button 
                      onClick={() => setShowChat(false)}
                      className="p-1 hover:bg-[#e8f5e9] rounded-lg"
                    >
                      <X className="w-4 h-4 text-[#8a9a8a]" />
                    </button>
                  </div>
                  <div className="h-64 overflow-y-auto p-4 space-y-3 bg-white">
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                            msg.role === 'user' 
                              ? 'bg-[#4d8b4d] text-white rounded-br-none' 
                              : 'bg-[#f0f7f0] text-[#5a6b5a] rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 bg-[#f8fbf8] border-t border-[#e8f5e9] flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="输入您的问题..."
                      className="flex-1 px-4 py-2 bg-white border border-[#d4e4d4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                    />
                    <button
                      onClick={sendChatMessage}
                      className="px-4 py-2 bg-[#4d8b4d] text-white rounded-lg hover:bg-[#3d7b3d] transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Detailed Suggestions */}
              <div className="mt-6">
                <h4 className="text-lg font-medium text-[#2c3e2c] mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#4d8b4d]" />
                  详细优化建议
                </h4>
                <div className="space-y-4">
                  {displayedSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border border-[#e8f5e9] rounded-xl overflow-hidden animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div 
                        className="flex items-center justify-between p-4 bg-[#f8fbf8] cursor-pointer hover:bg-[#f0f7f0] transition-colors"
                        onClick={() => setExpandedDimension(expandedDimension === suggestion.dimension ? null : suggestion.dimension)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-[#2c3e2c]">{suggestion.dimension}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            suggestion.currentScore / suggestion.maxScore >= 0.8 
                              ? 'bg-[#e8f5e9] text-[#4d8b4d]' 
                              : suggestion.currentScore / suggestion.maxScore >= 0.6 
                              ? 'bg-[#fff8e1] text-[#e8913a]' 
                              : 'bg-[#ffebee] text-[#e74c3c]'
                          }`}>
                            {suggestion.currentScore}/{suggestion.maxScore}分
                          </span>
                        </div>
                        {expandedDimension === suggestion.dimension ? 
                          <ChevronUp className="w-5 h-5 text-[#8a9a8a]" /> : 
                          <ChevronDown className="w-5 h-5 text-[#8a9a8a]" />
                        }
                      </div>
                      
                      {expandedDimension === suggestion.dimension && (
                        <div className="p-4 border-t border-[#e8f5e9]">
                          {/* Positive Feedback - Always show */}
                          {suggestion.positiveFeedback.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-[#4d8b4d] mb-2">亮点点评：</p>
                              <ul className="space-y-1">
                                {suggestion.positiveFeedback.map((feedback, i) => (
                                  <li key={i} className="text-sm text-[#5a6b5a] flex items-start gap-2">
                                    <span className="text-[#4d8b4d] mt-1">★</span>
                                    {feedback}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Issues */}
                          {suggestion.issues.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-[#e74c3c] mb-2">存在问题：</p>
                              <ul className="space-y-1">
                                {suggestion.issues.map((issue, i) => (
                                  <li key={i} className="text-sm text-[#5a6b5a] flex items-start gap-2">
                                    <span className="text-[#e74c3c] mt-1">•</span>
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Improvements */}
                          {suggestion.improvements.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-[#3498db] mb-2">改进建议：</p>
                              <ul className="space-y-1">
                                {suggestion.improvements.map((improvement, i) => (
                                  <li key={i} className="text-sm text-[#5a6b5a] flex items-start gap-2">
                                    <span className="text-[#3498db] mt-1">→</span>
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 p-4">
                      <div className="w-2.5 h-2.5 bg-[#4d8b4d] rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-[#4d8b4d] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2.5 h-2.5 bg-[#4d8b4d] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                onClick={resetEvaluation}
                variant="outline"
                className="mt-6 w-full border-[#d4e4d4] text-[#5a6b5a] text-base py-2.5"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                评价新的教学设计
              </Button>
            </CardContent>
          </Card>

          {/* Radar Chart and Dimension Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="eco-card-shadow border-[#d4e4d4]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-[#2c3e2c]">各维度得分分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={evaluationResult}>
                      <PolarGrid stroke="#d4e4d4" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: '#5a6b5a', fontSize: 13 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 'dataMax']}
                        tick={{ fill: '#8a9a8a', fontSize: 11 }}
                      />
                      <Radar
                        name="得分"
                        dataKey="score"
                        stroke="#4d8b4d"
                        strokeWidth={2}
                        fill="#4d8b4d"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Score Details */}
                <div className="mt-4 space-y-3">
                  {evaluationResult.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[#f8fbf8] rounded-lg"
                    >
                      <span className="text-base text-[#5a6b5a]">{item.dimension}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-2.5 bg-[#e8f5e9] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4d8b4d] rounded-full transition-all duration-500"
                            style={{ width: `${(item.score / item.fullMark) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-base font-medium text-[#2c3e2c] w-16 text-right">
                          {item.score}/{item.fullMark}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dimension Descriptions */}
            <Card className="eco-card-shadow border-[#d4e4d4]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-[#2c3e2c] flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#4d8b4d]" />
                  评价维度说明
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {Object.entries(dimensionDescriptions).map(([dimension, info], index) => (
                    <div key={index} className="p-4 bg-[#f8fbf8] rounded-xl border border-[#e8f5e9]">
                      <h4 className="font-medium text-[#2c3e2c] mb-2 text-base">{dimension}</h4>
                      <p className="text-sm text-[#5a6b5a] mb-3">{info.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs text-[#8a9a8a] font-medium">评价要点：</p>
                        {info.criteria.map((criterion, i) => (
                          <p key={i} className="text-xs text-[#8a9a8a] flex items-start gap-1.5">
                            <span className="text-[#4d8b4d]">✓</span>
                            {criterion}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}