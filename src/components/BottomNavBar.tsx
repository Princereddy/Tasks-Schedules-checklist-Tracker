import React from 'react';
import { 
  BarChart3, 
  CalendarCheck, 
  Table, 
  Settings2,
  Plus
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'dashboard' | 'checklist' | 'matrix' | 'manage';
  onTabChange: (tab: 'dashboard' | 'checklist' | 'matrix' | 'manage') => void;
  onOpenNewTaskModal: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTaskModal,
}) => {
  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-3 py-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-colors duration-200"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        
        {/* Dashboard Tab */}
        <button
          id="mobile-tab-dashboard"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Overview</span>
        </button>

        {/* Daily Checklist Tab */}
        <button
          id="mobile-tab-checklist"
          onClick={() => onTabChange('checklist')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'checklist'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'checklist' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <CalendarCheck className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Checklist</span>
        </button>

        {/* Center Floating Quick Add Action Button */}
        <button
          id="mobile-btn-quick-add"
          aria-label="Add new task"
          onClick={onOpenNewTaskModal}
          className="relative -top-3 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900 flex-shrink-0"
        >
          <Plus className="w-6 h-6 stroke-[2.5] flex-shrink-0" />
        </button>

        {/* Monthly Matrix Grid Tab */}
        <button
          id="mobile-tab-matrix"
          onClick={() => onTabChange('matrix')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'matrix'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'matrix' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <Table className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Matrix</span>
        </button>

        {/* Manage & Settings Tab */}
        <button
          id="mobile-tab-manage"
          onClick={() => onTabChange('manage')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'manage'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'manage' ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
            <Settings2 className="w-5 h-5 flex-shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Manage</span>
        </button>
      </div>
    </nav>
  );
};
