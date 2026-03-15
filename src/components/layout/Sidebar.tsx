import { BookOpen, Users, GraduationCap, ChevronDown, ChevronRight, FileText, ClipboardList, Award, BarChart3 } from 'lucide-react';
import type { MainTab, SubTab } from '@/types';

interface SidebarProps {
  activeMainTab: MainTab;
  activeSubTab: SubTab;
  expandedSections: Record<MainTab, boolean>;
  onMainTabChange: (tab: MainTab) => void;
  onSubTabChange: (tab: SubTab) => void;
  onToggleSection: (tab: MainTab) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    id: 'before' as MainTab,
    label: '课前评价',
    icon: BookOpen,
    color: '#4d8b4d',
  },
  {
    id: 'during' as MainTab,
    label: '课中评价',
    icon: Users,
    color: '#4d8b4d',
  },
  {
    id: 'after' as MainTab,
    label: '课后评价',
    icon: GraduationCap,
    color: '#4d8b4d',
  },
  {
    id: 'summary' as MainTab,
    label: '总结性评价',
    icon: BarChart3,
    color: '#4d8b4d',
  },
];

const subMenuItems = {
  before: [
    { id: 'teacher' as SubTab, label: '教师端', icon: FileText },
    { id: 'student' as SubTab, label: '学生端', icon: ClipboardList },
  ],
  during: [
    { id: 'teacher' as SubTab, label: '教师端', icon: FileText },
    { id: 'student' as SubTab, label: '学生端', icon: Award },
  ],
  after: [
    { id: 'teacher' as SubTab, label: '教师端', icon: FileText },
    { id: 'student' as SubTab, label: '学生端', icon: ClipboardList },
  ],
  summary: [
    { id: 'teacher' as SubTab, label: '教师端', icon: FileText },
    { id: 'student' as SubTab, label: '学生端', icon: Award },
  ],
};

export function Sidebar({
  activeMainTab,
  activeSubTab,
  expandedSections,
  onMainTabChange,
  onSubTabChange,
  onToggleSection,
  isMobile,
  onClose,
}: SidebarProps) {
  const handleSubMenuClick = (mainTab: MainTab, subTab: SubTab) => {
    onMainTabChange(mainTab);
    onSubTabChange(subTab);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`${isMobile ? 'w-72' : 'w-64'} bg-white h-screen fixed left-0 top-0 border-r border-[#d4e4d4] flex flex-col z-50`}>
      {/* Logo Area */}
      <div className="p-5 border-b border-[#d4e4d4]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4d8b4d] to-[#6ab06a] flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#2c3e2c] leading-tight">生态课堂</h1>
            <p className="text-xs text-[#8a9a8a]">评价系统</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isExpanded = expandedSections[item.id];
            const isActive = activeMainTab === item.id;
            const hasSubMenu = subMenuItems[item.id].length > 0;

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => onToggleSection(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#e8f5e9] text-[#4d8b4d] border-l-4 border-[#4d8b4d]'
                      : 'text-[#5a6b5a] hover:bg-[#f0f7f0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-[#4d8b4d]' : 'text-[#8a9a8a]'}`} />
                    <span className="font-medium text-base">{item.label}</span>
                  </div>
                  {hasSubMenu && (
                    <span className="text-[#8a9a8a]">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  )}
                </button>

                {/* Submenu */}
                {hasSubMenu && isExpanded && (
                  <div className="ml-4 pl-4 border-l-2 border-[#e8f5e9] space-y-1 animate-fade-in-up">
                    {subMenuItems[item.id].map((subItem) => {
                      const isSubActive = activeSubTab === subItem.id && isActive;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleSubMenuClick(item.id, subItem.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            isSubActive
                              ? 'bg-[#f0f7f0] text-[#4d8b4d]'
                              : 'text-[#8a9a8a] hover:bg-[#f8fbf8] hover:text-[#5a6b5a]'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span className="text-sm">{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#d4e4d4]">
        <div className="bg-gradient-to-r from-[#e8f5e9] to-[#f0f7f0] rounded-xl p-4">
          <p className="text-sm text-[#5a6b5a] text-center font-medium">
            小学数学生态课堂评价系统
          </p>
          <p className="text-xs text-[#8a9a8a] text-center mt-1">
            教学评一体化 · 生态课堂四要素
          </p>
        </div>
      </div>
    </aside>
  );
}