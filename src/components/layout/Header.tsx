import { Bell, User as UserIcon, LogOut, Calendar, ChevronDown, School, BookOpen, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User, ClassInfo } from '@/types';
import { useState } from 'react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSwitchClass: (classInfo: ClassInfo) => void;
  onSwitchSubject: (subject: string) => void;
  isMobile?: boolean;
  onMenuClick?: () => void;
}

const SUBJECTS = ['数学', '语文', '英语', '科学', '道德与法治', '音乐', '美术', '体育', '信息技术', '其他'];

export function Header({ 
  user, 
  onLogout, 
  selectedDate, 
  onDateChange, 
  onSwitchClass,
  onSwitchSubject,
  isMobile,
  onMenuClick
}: HeaderProps) {
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  return (
    <header className="h-16 md:h-20 bg-white border-b border-[#e8f5e9] fixed top-0 left-0 md:left-64 right-0 z-40 flex items-center justify-between px-3 md:px-6">
      {/* Mobile Menu Button */}
      {isMobile && onMenuClick && (
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-[#f0f7f0] mr-2"
        >
          <Menu className="w-6 h-6 text-[#5a6b5a]" />
        </button>
      )}

      {/* Title - Centered on desktop */}
      <div className={`${isMobile ? 'flex-1' : 'flex-1 flex justify-center'}`}>
        <div className={`${isMobile ? '' : 'text-center'}`}>
          <h1 className={`font-bold bg-gradient-to-r from-[#2e5c2e] via-[#4d8b4d] to-[#6ab06a] bg-clip-text text-transparent tracking-wider ${isMobile ? 'text-lg' : 'text-2xl'}`}
              style={{ fontFamily: '"Noto Serif SC", serif' }}>
            小学数学生态课堂评价系统
          </h1>
          {!isMobile && (
            <p className="text-sm text-[#8a9a8a] mt-0.5 tracking-wide">基于"教学评一体化"的课堂观察与评价工具</p>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Date Selector */}
        <div className="hidden md:flex items-center gap-2 bg-[#f8fbf8] px-3 py-2 rounded-xl border border-[#d4e4d4]">
          <Calendar className="w-4 h-4 text-[#4d8b4d]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-sm text-[#2c3e2c] focus:outline-none"
          />
        </div>

        {/* Subject Switcher */}
        {user && (
          <div className="relative">
            <button
              onClick={() => { setShowSubjectDropdown(!showSubjectDropdown); setShowClassDropdown(false); }}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-[#f8fbf8] rounded-xl border border-[#d4e4d4] hover:border-[#4d8b4d] transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#4d8b4d]" />
              <span className="text-sm text-[#2c3e2c] hidden sm:inline">{user.subject}</span>
              <ChevronDown className="w-4 h-4 text-[#8a9a8a]" />
            </button>
            
            {showSubjectDropdown && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl border border-[#d4e4d4] shadow-lg z-50">
                {SUBJECTS.map(subject => (
                  <button
                    key={subject}
                    onClick={() => { onSwitchSubject(subject); setShowSubjectDropdown(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#f0f7f0] first:rounded-t-xl last:rounded-b-xl ${
                      user.subject === subject ? 'bg-[#e8f5e9] text-[#4d8b4d]' : 'text-[#5a6b5a]'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Class Switcher */}
        {user && user.classes.length > 0 && (
          <div className="relative">
            <button
              onClick={() => { setShowClassDropdown(!showClassDropdown); setShowSubjectDropdown(false); }}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-[#f8fbf8] rounded-xl border border-[#d4e4d4] hover:border-[#4d8b4d] transition-colors"
            >
              <School className="w-4 h-4 text-[#4d8b4d]" />
              <span className="text-sm text-[#2c3e2c] hidden sm:inline">{user.currentClass?.fullName || '选择班级'}</span>
              <ChevronDown className="w-4 h-4 text-[#8a9a8a]" />
            </button>
            
            {showClassDropdown && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl border border-[#d4e4d4] shadow-lg z-50">
                {user.classes.map((cls, index) => (
                  <button
                    key={index}
                    onClick={() => { onSwitchClass(cls); setShowClassDropdown(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#f0f7f0] first:rounded-t-xl last:rounded-b-xl ${
                      user.currentClass?.fullName === cls.fullName ? 'bg-[#e8f5e9] text-[#4d8b4d]' : 'text-[#5a6b5a]'
                    }`}
                  >
                    {cls.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-[#f0f7f0] transition-colors">
          <Bell className="w-5 h-5 text-[#5a6b5a]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#e74c3c] rounded-full border-2 border-white"></span>
        </button>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-[#e8f5e9]">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-[#2c3e2c]">{user.name}</p>
              <p className="text-xs text-[#8a9a8a]">{user.role === 'admin' ? '管理员' : '教师'}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#4d8b4d] to-[#6ab06a] flex items-center justify-center">
              <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="hidden md:flex text-[#8a9a8a] hover:text-[#e74c3c] hover:bg-[#ffebee]"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
