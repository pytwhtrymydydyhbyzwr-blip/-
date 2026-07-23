import React from 'react';
import { Flame, BarChart3, Calendar, Settings, Volume2, VolumeX, Sparkles, Plus, Layers, Users, User, LogIn, LogOut, Mic, TrendingUp, Trophy, Award, Bell } from 'lucide-react';
import { ActiveTab } from '../types';
import { UserAccount } from '../utils/auth';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isPro: boolean;
  onOpenProModal: () => void;
  onOpenCreateHabit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalStreak: number;
  userLevel?: number;
  userXP?: number;
  unlockedBadgesCount?: number;
  onOpenBadgesModal?: () => void;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenAIGoalDecomposer: () => void;
  onOpenAISmartLog: () => void;
  onOpenAITrendAnalyzer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPro,
  onOpenProModal,
  onOpenCreateHabit,
  soundEnabled,
  onToggleSound,
  totalStreak,
  userLevel = 1,
  userXP = 0,
  unlockedBadgesCount = 0,
  onOpenBadgesModal,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenAIGoalDecomposer,
  onOpenAISmartLog,
  onOpenAITrendAnalyzer,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 py-3 px-4 shadow-xs">
      <div className="max-w-7xl mx-auto space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 flex items-center justify-center transition hover:scale-105">
              <Flame className="w-6 h-6 fill-white stroke-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-gaegu text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">
                  הרגלים טובים
                </h1>
                {isPro ? (
                  <button
                    onClick={onOpenProModal}
                    className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] hover:scale-105 transition"
                  >
                    <Sparkles className="w-3 h-3 inline ml-1 fill-amber-500 text-amber-500" />
                    <span>PRO ✨</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="label-neo text-[10px]">
                      בסיסי
                    </span>
                    <button
                      onClick={onOpenProModal}
                      className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 border border-amber-500 shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-slate-900" />
                      <span>שדרג ל-PRO</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Total Streak & Auth Profile Indicator */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* User Login/Account Profile Indicator */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-2 pr-3 py-1 rounded-xl shadow-2xs">
                <span className="text-lg">{currentUser.avatar || '🦸‍♂️'}</span>
                <span className="text-xs font-bold text-slate-800 hidden md:inline">{currentUser.fullName}</span>
                <button
                  onClick={onLogout}
                  title="התנתק מהחשבון"
                  className="p-1 text-slate-500 hover:text-rose-600 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="btn-fancy bg-white text-[#2a221a] py-1.5 px-3 text-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>כניסה / הרשמה</span>
              </button>
            )}

            {/* Badges & Gamification Button */}
            {onOpenBadgesModal && (
              <button
                onClick={onOpenBadgesModal}
                className="bg-[#ff8e72] border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] text-[#2a221a] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer font-black text-xs"
                title="צפה בתגים, הישגים ורמה"
              >
                <Trophy className="w-4 h-4 text-[#2a221a] fill-[#ffdf3e]" />
                <span>רמה {userLevel}</span>
                <span className="label-neo text-[9px] py-0 px-1.5">
                  {unlockedBadgesCount} 🏅
                </span>
              </button>
            )}

            {/* Total Streak Badge */}
            <div className="bg-[#ffdf3e] border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="text-[#2a221a] text-sm font-black">1🔥</span>
              <span className="font-mono-code text-[10px] text-[#2a221a] font-bold uppercase hidden sm:inline">STREAK</span>
            </div>

            {/* Notification Bell Button */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl border-2 border-[#2a221a] transition ${
                activeTab === 'settings'
                  ? 'bg-[#ffdf3e] shadow-[2px_2px_0px_#2a221a]'
                  : 'bg-white shadow-[2px_2px_0px_#2a221a] hover:bg-[#fffbf2]'
              }`}
              title="הגדרות תזכורות והתראות דפדפן"
            >
              <Bell className="w-4 h-4 text-[#2a221a]" />
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-white border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-[#fffbf2] transition"
              title={soundEnabled ? 'צלילים פעילים' : 'צלילים מושתקים'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#2a221a]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Create Habit Button */}
            <button
              onClick={onOpenCreateHabit}
              className="btn-fancy py-1.5 px-3 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ הרגל חדש</span>
            </button>
          </div>
        </div>

        {/* AI Features Chips */}
        <div className="flex items-center gap-2 pt-1.5 border-t-2 border-[#2a221a]/20 overflow-x-auto no-scrollbar">
          <span className="label-neo text-[10px] shrink-0">
            AI FEATURES
          </span>

          <button
            onClick={onOpenAIGoalDecomposer}
            className="ai-blob hover:scale-102 cursor-pointer transition flex items-center gap-1 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ffdf3e]" />
            <span>פירוק יעד (AI)</span>
          </button>

          <button
            onClick={onOpenAISmartLog}
            className="ai-blob hover:scale-102 cursor-pointer transition flex items-center gap-1 shrink-0"
          >
            <Mic className="w-3.5 h-3.5 text-[#ffdf3e]" />
            <span>דיווח קולי (AI)</span>
          </button>

          <button
            onClick={onOpenAITrendAnalyzer}
            className="ai-blob hover:scale-102 cursor-pointer transition flex items-center gap-1 shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#ffdf3e]" />
            <span>ניתוח חולשה (AI)</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 pt-1 border-t-2 border-[#2a221a]/20 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`tag-neo ${
              activeTab === 'dashboard' || activeTab === 'challenges_feed' ? 'active' : ''
            }`}
          >
            <Calendar className="w-3.5 h-3.5 inline ml-1" />
            <span>משימות היום (פיד)</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`tag-neo ${
              activeTab === 'analytics' ? 'active' : ''
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 inline ml-1" />
            <span>סטטיסטיקה</span>
          </button>

          <button
            onClick={() => setActiveTab('habits_manage')}
            className={`tag-neo ${
              activeTab === 'habits_manage' ? 'active' : ''
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline ml-1" />
            <span>ניהול הרגלים</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`tag-neo ${
              activeTab === 'settings' ? 'active' : ''
            }`}
          >
            <Settings className="w-3.5 h-3.5 inline ml-1" />
            <span>הגדרות</span>
          </button>
        </nav>

      </div>
    </header>
  );
};

