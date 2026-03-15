import { BookOpen, Users, GraduationCap, BarChart3 } from 'lucide-react';
import type { MainTab, SubTab } from '@/types';

interface MobileNavProps {
  activeMainTab: MainTab;
  activeSubTab: SubTab;
  onMainTabChange: (tab: MainTab) => void;
  onSubTabChange: (tab: SubTab) => void;
}

const navItems = [
  { id: 'before' as MainTab, label: '课前', icon: BookOpen },
  { id: 'during' as MainTab, label: '课中', icon: Users },
  { id: 'after' as MainTab, label: '课后', icon: GraduationCap },
  { id: 'summary' as MainTab, label: '总结', icon: BarChart3 },
];

export function MobileNav({ activeMainTab, activeSubTab: _activeSubTab, onMainTabChange, onSubTabChange }: MobileNavProps) {
  const handleClick = (tab: MainTab) => {
    onMainTabChange(tab);
    // Default subtab
    if (tab === 'before' || tab === 'during' || tab === 'summary') {
      onSubTabChange('teacher');
    } else if (tab === 'after') {
      onSubTabChange('student');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#d4e4d4] z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activeMainTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-[#4d8b4d]' : 'text-[#8a9a8a]'
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'text-[#4d8b4d]' : 'text-[#8a9a8a]'}`} />
              <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
