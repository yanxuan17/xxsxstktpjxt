// 直接在文件中定义类型，避免导入问题
export interface KnowledgePoint {
  id: string;
  name: string;
  category: '计算' | '几何' | '应用题' | '单位换算' | '其他';
}

export const knowledgePoints: KnowledgePoint[] = [
  { id: 'calc1', name: '整数加减法', category: '计算' },
  { id: 'calc2', name: '整数乘除法', category: '计算' },
  { id: 'calc3', name: '分数加减法', category: '计算' },
  { id: 'calc4', name: '分数乘除法', category: '计算' },
  { id: 'calc5', name: '小数加减法', category: '计算' },
  { id: 'calc6', name: '小数乘除法', category: '计算' },
  { id: 'calc7', name: '四则混合运算', category: '计算' },
  { id: 'geo1', name: '周长与面积', category: '几何' },
  { id: 'geo2', name: '体积与表面积', category: '几何' },
  { id: 'geo3', name: '角度认识', category: '几何' },
  { id: 'geo4', name: '图形分类', category: '几何' },
  { id: 'app1', name: '植树问题', category: '应用题' },
  { id: 'app2', name: '行程问题', category: '应用题' },
  { id: 'app3', name: '工程问题', category: '应用题' },
  { id: 'app4', name: '鸡兔同笼', category: '应用题' },
  { id: 'unit1', name: '长度单位换算', category: '单位换算' },
  { id: 'unit2', name: '重量单位换算', category: '单位换算' },
  { id: 'unit3', name: '时间单位换算', category: '单位换算' },
  { id: 'other1', name: '找规律', category: '其他' },
];