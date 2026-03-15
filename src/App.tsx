import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
// MobileNav is integrated into the layout
import { LoginModal } from '@/components/auth/LoginModal';
import { TeacherEvaluation } from '@/components/before-class/TeacherEvaluation';
import { StudentEvaluation } from '@/components/before-class/StudentEvaluation';
import { TeacherObservation } from '@/components/during-class/TeacherObservation';
import { StudentRealtime } from '@/components/during-class/StudentRealtime';
import { StudentHomework } from '@/components/after-class/StudentHomework';
import { TeacherHomework } from '@/components/after-class/TeacherHomework'; // 新增导入
import { SummaryEvaluation } from '@/components/summary/SummaryEvaluation';
import { SummaryStudent } from '@/components/summary/SummaryStudent';
import { AdminPanel } from '@/components/admin/AdminPanel';
import type { MainTab, SubTab, ClassInfo } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import './App.css';

function App() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('before');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('teacher');
  const [expandedSections, setExpandedSections] = useState<Record<MainTab, boolean>>({
    before: true,
    during: false,
    after: false,
    summary: false,
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const { user, isLoggedIn, login, register, logout, switchClass, switchSubject, isAdmin, getCurrentSegment } = useAuth();

  // 检查登录状态
  useEffect(() => {
    console.log('登录状态变化:', { isLoggedIn, user, isAdmin: isAdmin() });
    
    if (!isLoggedIn) {
      setShowLogin(true);
      setShowAdminPanel(false);
    } else {
      setShowLogin(false);
      // 如果是管理员，自动显示管理员面板
      if (isAdmin()) {
        console.log('管理员登录，显示管理员面板');
        setShowAdminPanel(true);
      } else {
        setShowAdminPanel(false);
      }
    }
  }, [isLoggedIn, user, isAdmin]);

  // 处理登录
  const handleLogin = (username: string, password: string) => {
    console.log('App: 处理登录', { username });
    const result = login(username, password);
    console.log('App: 登录结果', result);
    
    if (result.success) {
      setShowLogin(false);
      // 从 result 中获取用户信息
      if (result.user && result.user.role === 'admin') {
        console.log('App: 管理员登录成功，显示管理员面板');
        setShowAdminPanel(true);
      } else {
        setShowAdminPanel(false);
      }
    }
    return result;
  };

  // 处理登录成功回调（从 LoginModal 传过来）
  const handleLoginSuccess = (user: any) => {
    console.log('App: 登录成功回调', user);
    setShowLogin(false);
    if (user.role === 'admin') {
      console.log('App: 管理员登录，显示管理员面板');
      setShowAdminPanel(true);
    } else {
      setShowAdminPanel(false);
    }
  };

  // ===== 添加的 Sidebar 回调函数 =====
  const handleMainTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
    setExpandedSections(prev => ({ ...prev, [tab]: true }));
    
    if (tab === 'before') {
      setActiveSubTab('teacher');
    } else if (tab === 'during') {
      setActiveSubTab('teacher');
    } else if (tab === 'after') {
      setActiveSubTab('student'); // 默认学生端
    } else if (tab === 'summary') {
      setActiveSubTab('teacher');
    }
  };

  const handleSubTabChange = (tab: SubTab) => {
    setActiveSubTab(tab);
  };

  const handleToggleSection = (tab: MainTab) => {
    setExpandedSections(prev => ({
      ...prev,
      [tab]: !prev[tab],
    }));
  };
  // ===== 添加结束 =====

  const handleRegister = (username: string, password: string, name: string, subject: string, classes: ClassInfo[]) => {
    return register(username, password, name, subject, classes);
  };

  const handleSwitchClass = (classInfo: ClassInfo) => {
    switchClass(classInfo);
  };

  const handleSwitchSubject = (subject: string) => {
    switchSubject(subject);
  };

  const handleLogout = () => {
    logout();
    setShowAdminPanel(false);
    setShowLogin(true);
  };

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
  };

  const renderContent = () => {
    if (!user) return null;

    // 管理员面板 - 如果是管理员且显示管理员面板
    if (isAdmin() && showAdminPanel) {
      console.log('渲染管理员面板');
      return <AdminPanel />;
    }

    const className = user.currentClass?.fullName || '';

    if (activeMainTab === 'before') {
      return activeSubTab === 'teacher' 
        ? <TeacherEvaluation selectedDate={selectedDate} teacherName={user.name} userId={user.id} /> 
        : <StudentEvaluation selectedDate={selectedDate} className={className} userId={user.id} isAdmin={isAdmin()} />;
    } else if (activeMainTab === 'during') {
      return activeSubTab === 'teacher' 
        ? <TeacherObservation selectedDate={selectedDate} /> 
        : <StudentRealtime selectedDate={selectedDate} segment={getCurrentSegment()} className={className} userId={user.id} />;
    } else if (activeMainTab === 'after') {
      return activeSubTab === 'teacher' 
        ? <TeacherHomework selectedDate={selectedDate} className={className} userId={user.id} />
        : <StudentHomework selectedDate={selectedDate} className={className} userId={user.id} />;
    } else if (activeMainTab === 'summary') {
      return activeSubTab === 'teacher'
        ? <SummaryEvaluation selectedDate={selectedDate} teacherName={user.name} userId={user.id} isAdmin={isAdmin()} />
        : <SummaryStudent selectedDate={selectedDate} className={className} userId={user.id} />;
    }
    return null;
  };

  const getPageTitle = () => {
    if (showAdminPanel && isAdmin()) return '管理员控制台';
    if (activeMainTab === 'before') {
      return activeSubTab === 'teacher' ? '课前评价 - 教师端' : '课前评价 - 学生端';
    } else if (activeMainTab === 'during') {
      return activeSubTab === 'teacher' ? '课中评价 - 教师端' : '课中评价 - 学生端';
    } else if (activeMainTab === 'after') {
      return activeSubTab === 'teacher' ? '课后评价 - 教师端' : '课后评价 - 学生端';
    } else if (activeMainTab === 'summary') {
      return activeSubTab === 'teacher' ? '总结性评价 - 教师端' : '总结性评价 - 学生端';
    }
    return '';
  };

  // 检查移动端
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 调试：打印当前状态
  useEffect(() => {
    console.log('当前状态:', { 
      isLoggedIn, 
      isAdmin: isAdmin(), 
      showAdminPanel,
      user: user?.name,
      role: user?.role
    });
  }, [isLoggedIn, isAdmin, showAdminPanel, user]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e8f5e9] via-[#f8fbf8] to-[#f0f7f0] flex items-center justify-center">
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)} 
          onLogin={handleLogin}
          onRegister={handleRegister}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbf8]">
      {/* Desktop Sidebar - 管理员模式下不显示 */}
      {!isMobile && !(isAdmin() && showAdminPanel) && (
        <Sidebar
          activeMainTab={activeMainTab}
          activeSubTab={activeSubTab}
          expandedSections={expandedSections}
          onMainTabChange={handleMainTabChange}
          onSubTabChange={handleSubTabChange}
          onToggleSection={handleToggleSection}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && mobileMenuOpen && !(isAdmin() && showAdminPanel) && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar
            activeMainTab={activeMainTab}
            activeSubTab={activeSubTab}
            expandedSections={expandedSections}
            onMainTabChange={handleMainTabChange}
            onSubTabChange={handleSubTabChange}
            onToggleSection={handleToggleSection}
            isMobile
            onClose={() => setMobileMenuOpen(false)}
          />
        </>
      )}

      {/* Header */}
      <Header 
        user={user} 
        onLogout={handleLogout}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onSwitchClass={handleSwitchClass}
        onSwitchSubject={handleSwitchSubject}
        isMobile={isMobile}
        onMenuClick={() => setMobileMenuOpen(true)}
        isAdminMode={isAdmin() && showAdminPanel}
      />

      {/* 管理员切换按钮 */}
      {isAdmin() && (
        <button
          onClick={toggleAdminPanel}
          className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-green-600 transition-all"
        >
          {showAdminPanel ? '返回教师端' : '管理员控制台'}
        </button>
      )}

      {/* Main Content */}
      <main className={`${!isMobile && !(isAdmin() && showAdminPanel) ? 'ml-64' : 'ml-0'} pt-16 md:pt-20 min-h-screen transition-all duration-300`}>
        <div className="p-4 md:p-6">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 md:mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#2c3e2c]">{getPageTitle()}</h2>
                <div className="w-16 md:w-20 h-1 md:h-1.5 bg-gradient-to-r from-[#4d8b4d] to-[#7bc47b] rounded-full mt-2"></div>
              </div>
              {/* Mobile Date Selector */}
              {isMobile && !(isAdmin() && showAdminPanel) && (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#d4e4d4]">
                  <span className="text-sm text-[#5a6b5a]">日期：</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-2 py-1 bg-[#f8fbf8] border border-[#d4e4d4] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4d8b4d]/20 focus:border-[#4d8b4d]"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeMainTab}-${activeSubTab}-${selectedDate}-${showAdminPanel}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;