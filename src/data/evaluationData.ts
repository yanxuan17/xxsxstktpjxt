// Lesson plan evaluation dimensions
export const lessonPlanDimensions = [
  {
    id: 'teaching-objectives',
    name: '教学目标设计',
    maxScore: 20,
    description: '目标明确、可测量，符合课程标准',
  },
  {
    id: 'three-sheets',
    name: '三单设计质量',
    maxScore: 30,
    description: '预习单、学习单、作业单设计合理',
  },
  {
    id: 'eco-elements',
    name: '生态课堂要素',
    maxScore: 30,
    description: '师生互动、环境适配、学生自主',
  },
  {
    id: 'teaching-evaluation',
    name: '教学评一体化',
    maxScore: 20,
    description: '评价任务贴合目标，过程性评价设计',
  },
];

// Concept lesson observation items
export const conceptLessonObservations = [
  {
    dimension: '生态课堂四要素',
    items: [
      { id: 'c1', point: '师生互动：教师引导学生操作、表达，学生主动提问、补充' },
      { id: 'c2', point: '环境适配：有无操作材料、小组合作空间，氛围宽松（情感动力）' },
      { id: 'c3', point: '知识呈现：结合生活情境（文化合力），从具体到抽象（思维张力）' },
      { id: 'c4', point: '学生自主：能自主尝试探究概念、动手操作验证，主动完成基础练习' },
    ],
  },
  {
    dimension: '教学评一体化',
    items: [
      { id: 'c5', point: '目标达成：评价任务贴合概念理解（如举例说明概念）' },
      { id: 'c6', point: '即时评价：教师是否嵌入过程性评价，反馈是否精准' },
      { id: 'c7', point: '学生参与评价：学生是否参与自评、互评（如判断同伴举例是否正确）' },
    ],
  },
  {
    dimension: '三力平衡',
    items: [
      { id: 'c8', point: '思维张力：学生能否从不同角度理解概念、举例验证' },
      { id: 'c9', point: '情感动力：学生参与操作、发言的积极性，是否有成功体验' },
      { id: 'c10', point: '文化合力：数学概念与生活、数学史的关联度，兼顾严谨性与趣味性' },
    ],
  },
];

// Problem solving lesson observation items
export const problemSolvingObservations = [
  {
    dimension: '生态课堂四要素',
    items: [
      { id: 'p1', point: '师生互动：教师引导学生分析题意、梳理思路，不直接给出答案' },
      { id: 'p2', point: '环境适配：小组合作探究解题策略，允许不同思路碰撞（生成资源）' },
      { id: 'p3', point: '知识应用：学生能否运用已有知识解决新问题（思维张力）' },
      { id: 'p4', point: '学生自主：能自主分析题意、尝试解题，主动梳理解题思路并总结' },
    ],
  },
  {
    dimension: '教学评一体化',
    items: [
      { id: 'p5', point: '目标达成：评价聚焦解题思路、策略选择，而非仅看答案对错' },
      { id: 'p6', point: '即时评价：教师针对解题过程反馈，引导学生优化思路' },
      { id: 'p7', point: '学生参与评价：学生能否互评解题思路，提出优化建议' },
    ],
  },
  {
    dimension: '三力平衡',
    items: [
      { id: 'p8', point: '思维张力：学生能否想出多种解题策略，对比最优解法' },
      { id: 'p9', point: '情感动力：学生面对难题的坚持度，解决问题后的成就感' },
      { id: 'p10', point: '文化合力：问题情境贴合生活实际，体现数学应用价值' },
    ],
  },
];

// Real-time evaluation dimensions by segment
export const lowSegmentDimensions = [
  {
    id: 'l1',
    name: '课堂参与度',
    description: '主动举手发言、参与小组活动，不沉默、不扰乱课堂',
    points: 1,
    maxPoints: 1,
  },
  {
    id: 'l2',
    name: '课堂习惯',
    description: '认真倾听老师、同学发言，按时完成课堂练习，书写工整',
    points: 1,
    maxPoints: 1,
  },
  {
    id: 'l3',
    name: '表达与操作',
    description: '能大胆说出自己的想法（哪怕不完整），积极参与动手操作',
    points: 1,
    maxPoints: 2,
  },
  {
    id: 'l4',
    name: '合作表现',
    description: '小组活动中能配合同伴，愿意分享自己的操作成果',
    points: 1,
    maxPoints: 1,
  },
];

export const middleSegmentDimensions = [
  {
    id: 'm1',
    name: '课堂参与与表达',
    description: '主动举手发言、补充他人观点，表达清晰、有条理',
    points: 1,
    maxPoints: 2,
  },
  {
    id: 'm2',
    name: '习惯培养',
    description: '倾听与笔记：专注倾听他人发言、主动回应，笔记条理清晰',
    points: 1,
    maxPoints: 1,
  },
  {
    id: 'm3',
    name: '解题规范',
    description: '解题思路基本清晰，步骤规范，列式、单位不遗漏',
    points: 1,
    maxPoints: 2,
  },
  {
    id: 'm4',
    name: '合作探究',
    description: '小组活动中主动分享想法、倾听同伴，能参与讨论并提出建议',
    points: 1,
    maxPoints: 1,
  },
  {
    id: 'm5',
    name: '纠错与反思',
    description: '能主动发现自身错误并改正，或倾听他人建议优化思路',
    points: 1,
    maxPoints: 1,
  },
];

export const highSegmentDimensions = [
  {
    id: 'h1',
    name: '思维表达',
    description: '主动发言，能清晰阐述解题思路、概念内涵，逻辑严谨',
    points: 1,
    maxPoints: 2,
  },
  {
    id: 'h2',
    name: '习惯培养',
    description: '倾听与笔记：专注倾听他人发言、主动回应，笔记条理清晰',
    points: 1,
    maxPoints: 1,
  },
  {
    id: 'h3',
    name: '解题创新',
    description: '能想出不同解题策略，或用简便方法解题，优化思路',
    points: 2,
    maxPoints: 2,
  },
  {
    id: 'h4',
    name: '质疑与探究',
    description: '能主动提出合理疑问，或结合生活实际拓展数学应用',
    points: 1,
    maxPoints: 2,
  },
  {
    id: 'h5',
    name: '合作与互评',
    description: '小组合作中能主导部分探究任务，准确互评同伴思路并提出优化建议',
    points: 1,
    maxPoints: 1,
  },
];

// Sample students data
export const sampleStudents = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `学生${i + 1}`,
  class: '六年级(1)班',
}));

// AI Teacher suggestions templates
export const aiSuggestions = {
  excellent: [
    '教学设计整体优秀，三单设计完整且层次清晰',
    '生态课堂四要素体现充分，建议继续保持',
    '教学评一体化设计到位，评价任务与目标高度匹配',
  ],
  good: [
    '教学设计整体良好，建议进一步优化三单设计的层次性',
    '生态课堂要素基本体现，可增加学生自主探究环节',
    '评价设计较合理，建议增加更多过程性评价点',
  ],
  average: [
    '教学目标需要更加明确和可测量',
    '三单设计需要重新梳理，预习单与课堂学习衔接需加强',
    '建议增加师生互动环节，提升学生参与度',
    '评价任务需要与教学目标更紧密对应',
  ],
};
