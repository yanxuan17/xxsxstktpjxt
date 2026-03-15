import { useState, useEffect } from 'react';
import { User, Lock, LogIn, UserPlus, X, School, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (username: string, password: string) => { success: boolean; message: string; user?: any };
  onRegister?: (username: string, password: string, name: string, subject: string, classes: any[]) => { success: boolean; message: string };
  onLoginSuccess?: (user: any) => void;
}

interface ClassInfo {
  grade: string;
  classNumber: number;
  fullName: string;
}

export function LoginModal({ isOpen, onClose, onLogin, onRegister, onLoginSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);
  
  // 登录表单
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // 注册表单
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSubject, setRegSubject] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]); // 存储格式: "1-3" 表示一年级3班
  
  // 班级选择
  const [currentGrade, setCurrentGrade] = useState('');
  const [currentClassNum, setCurrentClassNum] = useState(1);
  
  const [message, setMessage] = useState('');
  const [regData, setRegData] = useState<any>({});

  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
  const subjects = ['数学', '语文', '英语', '科学', '其他'];

  // 验证中文姓名
  const isValidChineseName = (name: string) => {
    return /^[\u4e00-\u9fa5]{2,3}$/.test(name);
  };

  // 处理登录
  const handleLogin = () => {
    const username = loginUsername.trim();
    const password = loginPassword;
    
    if (!username || !password) {
      setMessage('请填写账号和密码');
      return;
    }

    // 如果传入了 onLogin 属性，使用它
    if (onLogin) {
      const result = onLogin(username, password);
      setMessage(result.message);
      
      if (result.success) {
        // 调用登录成功回调
        if (onLoginSuccess && result.user) {
          onLoginSuccess(result.user);
        }
        
        setTimeout(() => {
          onClose();
        }, 1000);
      }
      return;
    }

    // 否则使用本地登录逻辑（备用）
    try {
      const users = JSON.parse(localStorage.getItem('eco_registered_users') || '[]');
      const user = users.find((u: any) => 
        u.username === username && u.password === password
      );

      if (!user) {
        setMessage('账号或密码错误');
        return;
      }

      // 保存当前用户
      localStorage.setItem('eco_current_user', JSON.stringify(user));
      setMessage('登录成功！');
      
      // 调用回调函数传递用户信息
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('登录错误:', error);
      setMessage('登录失败，请重试');
    }
  };

  // 处理注册
  const handleRegister = () => {
    if (!regName || !regPassword || !regConfirmPassword) {
      setMessage('请填写完整信息');
      return;
    }

    if (!isValidChineseName(regName)) {
      setMessage('姓名必须为2-3个汉字');
      return;
    }

    if (regPassword.length < 6) {
      setMessage('密码至少需要6位');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setMessage('两次密码不一致');
      return;
    }

    if (selectedClasses.length === 0) {
      setMessage('请至少选择一个班级');
      return;
    }

    if (!regSubject) {
      setMessage('请选择学科');
      return;
    }

    // 转换班级格式
    const classes = selectedClasses.map(c => {
      const [gradeNum, classNum] = c.split('-');
      const gradeMap: {[key: string]: string} = {
        '1': '一年级',
        '2': '二年级',
        '3': '三年级',
        '4': '四年级',
        '5': '五年级',
        '6': '六年级'
      };
      return {
        grade: gradeMap[gradeNum],
        classNumber: parseInt(classNum),
        fullName: `${gradeMap[gradeNum]}(${classNum})班`
      };
    });

    // 如果传入了 onRegister 属性，使用它
    if (onRegister) {
      const result = onRegister(regName, regPassword, regName, regSubject, classes);
      setMessage(result.message);
      
      if (result.success) {
        setTimeout(() => {
          setMode('login');
          resetForm();
        }, 2000);
      }
      return;
    }

    // 否则使用本地注册逻辑（备用）
    try {
      const users = JSON.parse(localStorage.getItem('eco_registered_users') || '[]');
      
      const newUser = {
        username: regName,
        password: regPassword,
        name: regName,
        role: 'teacher',
        subject: regSubject,
        classes: classes,
      };

      users.push(newUser);
      localStorage.setItem('eco_registered_users', JSON.stringify(users));
      
      setMessage('注册成功，等待管理员审核');
      
      setTimeout(() => {
        setMode('login');
        resetForm();
      }, 2000);
      
    } catch (e) {
      console.error('注册失败:', e);
      setMessage('注册失败，请重试');
    }
  };

  // 下一步
  const nextRegStep = (nextStep: number) => {
    if (nextStep === 2) {
      const name = regName.trim();
      const pass = regPassword;
      const pass2 = regConfirmPassword;
      
      if (!name || !pass) {
        setMessage('请填写完整信息');
        return;
      }
      
      if (!isValidChineseName(name)) {
        setMessage('姓名必须为2-3个汉字');
        return;
      }
      
      if (pass.length < 6) {
        setMessage('密码至少需要6位');
        return;
      }
      if (pass !== pass2) {
        setMessage('两次密码不一致');
        return;
      }
      
      setStep(2);
      setMessage('');
    } else if (nextStep === 3) {
      if (selectedClasses.length === 0) {
        setMessage('请至少选择一个班级');
        return;
      }
      setStep(3);
      setMessage('');
    }
  };

  // 上一步
  const prevRegStep = (prevStep: number) => {
    setStep(prevStep);
    setMessage('');
  };

  // 添加班级
  const addSelectedClass = () => {
    if (!currentGrade) {
      setMessage('请选择年级');
      return;
    }
    
    // 转换年级为数字（一年级 -> 1）
    const gradeMap: {[key: string]: string} = {
      '一年级': '1',
      '二年级': '2',
      '三年级': '3',
      '四年级': '4',
      '五年级': '5',
      '六年级': '6'
    };
    
    const gradeNum = gradeMap[currentGrade];
    const classValue = gradeNum + '-' + currentClassNum;
    
    if (!selectedClasses.includes(classValue)) {
      setSelectedClasses([...selectedClasses, classValue]);
      setMessage('');
    } else {
      setMessage('该班级已添加');
    }
  };

  // 移除班级
  const removeSelectedClass = (classValue: string) => {
    setSelectedClasses(selectedClasses.filter(c => c !== classValue));
  };

  // 重置表单
  const resetForm = () => {
    setLoginUsername('');
    setLoginPassword('');
    setRegName('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegSubject('');
    setSelectedClasses([]);
    setCurrentGrade('');
    setCurrentClassNum(1);
    setStep(1);
    setMessage('');
    setRegData({});
  };

  // 关闭时重置
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setMode('login');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-[360px] overflow-hidden bg-transparent border-0 shadow-none">
        {/* 登录页 - 使用纯白色背景 */}
        <div className="min-h-[600px] flex items-center justify-center p-5 bg-white rounded-2xl">
          <div className="w-full max-w-[360px]">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-4xl" style={{
              background: 'linear-gradient(135deg, #10b981, #059669)'
            }}>
              🌿
            </div>
            
            {/* 标题 */}
            <h1 className="text-xl text-center mb-2 text-gray-800">生态课堂评价系统</h1>
            <p className="text-xs text-center text-gray-500 mb-6">教学评一体化 · 赋能专业成长</p>

            {/* 消息提示 */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* 登录模式 */}
            {mode === 'login' && (
              <>
                <div className="space-y-4">
                  <div className="input-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">账号</label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="请输入账号"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div className="input-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  
                  <button
                    onClick={handleLogin}
                    className="w-full py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90" style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)'
                    }}
                  >
                    登 录
                  </button>
                  
                  <button
                    onClick={() => {
                      setMode('register');
                      setStep(1);
                      resetForm();
                    }}
                    className="w-full py-3.5 rounded-xl text-base font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  >
                    教师注册
                  </button>
                  
                  <p className="text-xs text-gray-400 text-center mt-4">
                    新教师请先注册，审核通过后即可登录
                  </p>
                </div>
              </>
            )}

            {/* 注册模式 */}
            {mode === 'register' && (
              <>
                <div className="text-center mb-5">
                  <h2 className="text-lg font-medium text-gray-800">教师注册</h2>
                </div>
                
                {/* 步骤指示器 */}
                <div className="step-indicator flex justify-center gap-2 mb-5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`step-dot h-2 rounded-full transition-all ${
                        s === step 
                          ? 'w-6 bg-green-500' 
                          : s < step 
                            ? 'w-2 bg-green-300' 
                            : 'w-2 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* 步骤1：基本信息 */}
                {step === 1 && (
                  <div id="regStep1" className="space-y-4">
                    <div className="input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="请输入真实姓名（2-3个汉字）"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        密码 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="6位以上密码"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        确认密码 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="再次输入密码"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <button
                      onClick={() => nextRegStep(2)}
                      className="w-full py-3.5 rounded-xl text-base font-semibold text-white" style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)'
                      }}
                    >
                      下一步
                    </button>
                  </div>
                )}

                {/* 步骤2：选择班级 */}
                {step === 2 && (
                  <div id="regStep2" className="space-y-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">选择任教班级</p>
                    
                    <div className="input-group">
                      <label className="block text-sm text-gray-600 mb-1">年级 <span className="text-red-500">*</span></label>
                      <select
                        value={currentGrade}
                        onChange={(e) => {
                          setCurrentGrade(e.target.value);
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500"
                      >
                        <option value="">请选择年级</option>
                        {grades.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label className="block text-sm text-gray-600 mb-1">班级 <span className="text-red-500">*</span></label>
                      <select
                        value={currentClassNum}
                        onChange={(e) => setCurrentClassNum(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500"
                        disabled={!currentGrade}
                      >
                        <option value="">请选择班级</option>
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}班</option>
                        ))}
                      </select>
                    </div>

                    {/* 添加班级按钮 */}
                    <button
                      onClick={addSelectedClass}
                      disabled={!currentGrade || !currentClassNum}
                      className="w-full py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      添加班级
                    </button>

                    {/* 已选班级 */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-600 mb-2">已选班级（点击×移除）：</label>
                      <div className="selected-classes flex flex-wrap gap-2 min-h-[40px]">
                        {selectedClasses.length === 0 ? (
                          <span className="text-sm text-gray-400">尚未选择班级</span>
                        ) : (
                          selectedClasses.map((classValue, index) => {
                            const parts = classValue.split('-');
                            const gradeNum = parts[0];
                            const classNum = parts[1];
                            const gradeName = 
                              gradeNum === '1' ? '一年级' :
                              gradeNum === '2' ? '二年级' :
                              gradeNum === '3' ? '三年级' :
                              gradeNum === '4' ? '四年级' :
                              gradeNum === '5' ? '五年级' : '六年级';
                            return (
                              <span
                                key={index}
                                className="class-tag inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm"
                              >
                                {gradeName}{classNum}班
                                <button
                                  onClick={() => removeSelectedClass(classValue)}
                                  className="hover:bg-green-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => prevRegStep(1)}
                        className="flex-1 py-3.5 rounded-xl text-base font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        上一步
                      </button>
                      <button
                        onClick={() => nextRegStep(3)}
                        className="flex-1 py-3.5 rounded-xl text-base font-semibold text-white" style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)'
                        }}
                      >
                        下一步
                      </button>
                    </div>
                  </div>
                )}

                {/* 步骤3：选择学科 */}
                {step === 3 && (
                  <div id="regStep3" className="space-y-4">
                    <div className="input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        学科 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={regSubject}
                        onChange={(e) => setRegSubject(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-green-500"
                      >
                        <option value="">请选择学科</option>
                        {subjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    {/* 信息预览 */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">注册信息预览：</p>
                      <div className="text-sm space-y-1">
                        <div>姓名：<span className="text-gray-900 font-medium">{regName}</span></div>
                        <div>任教班级：<span className="text-gray-900 font-medium">
                          {selectedClasses.map(c => {
                            const parts = c.split('-');
                            const gradeNum = parts[0];
                            const classNum = parts[1];
                            const gradeName = 
                              gradeNum === '1' ? '一年级' :
                              gradeNum === '2' ? '二年级' :
                              gradeNum === '3' ? '三年级' :
                              gradeNum === '4' ? '四年级' :
                              gradeNum === '5' ? '五年级' : '六年级';
                            return gradeName + classNum + '班';
                          }).join('、')}
                        </span></div>
                        <div>学科：<span className="text-gray-900 font-medium">{regSubject || '未选择'}</span></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => prevRegStep(2)}
                        className="flex-1 py-3.5 rounded-xl text-base font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        上一步
                      </button>
                      <button
                        onClick={handleRegister}
                        className="flex-1 py-3.5 rounded-xl text-base font-semibold text-white" style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)'
                        }}
                      >
                        提交注册
                      </button>
                    </div>
                  </div>
                )}

                {/* 返回登录 */}
                <button
                  onClick={() => {
                    setMode('login');
                    resetForm();
                  }}
                  className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  返回登录
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
