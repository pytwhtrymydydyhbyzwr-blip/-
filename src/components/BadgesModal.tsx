import React, { useState } from 'react';
import {
  Award,
  Trophy,
  Flame,
  Sunrise,
  Target,
  Sparkles,
  CheckCircle2,
  Lock,
  X,
  Zap,
  Star,
  ShieldCheck,
  Share2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Badge, BadgeCategory, GamificationStats } from '../types';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GamificationStats;
  allBadges: Badge[];
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ isOpen, onClose, stats, allBadges }) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  if (!isOpen) return null;

  const totalBadges = allBadges.length;
  const unlockedCount = allBadges.filter((b) => b.unlocked).length;
  const currentXP = stats.xp;
  const currentLevel = stats.level;
  const xpForCurrentLevel = (currentLevel - 1) * 200;
  const xpForNextLevel = currentLevel * 200;
  const xpProgressInLevel = currentXP - xpForCurrentLevel;
  const levelProgressPct = Math.min(100, Math.max(0, Math.round((xpProgressInLevel / 200) * 100)));

  const filteredBadges = selectedCategory === 'all'
    ? allBadges
    : allBadges.filter((b) => b.category === selectedCategory);

  const getRarityBadgeStyle = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300 shadow-xs';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300 shadow-xs';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRarityLabel = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'אגדי 👑';
      case 'epic':
        return 'אפי 🌟';
      case 'rare':
        return 'נדיר ⚡';
      default:
        return 'רגיל 🎯';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl text-right" dir="rtl">
      <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black mb-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>מערכת ההישגים והתגים של HabitHero</span>
              </div>
              <h2 className="text-2xl font-black text-white italic">התגים והמדליות שלי</h2>
              <p className="text-xs font-semibold text-slate-300 mt-1">
                אוסף ההישגים שנצברו על רצפי עבודה, השלמות מוקדמות ושימוש במערכת
              </p>
            </div>

            {/* Level & XP Box */}
            <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-4 shrink-0 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shrink-0">
                {currentLevel}
              </div>

              <div className="flex-1 min-w-[140px]">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-amber-300">רמה {currentLevel}</span>
                  <span className="text-slate-300">{currentXP} XP</span>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgressPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">
                  עוד {200 - xpProgressInLevel} XP לרמה הבאה
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/80 text-center">
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">תגים שנפתחו</span>
              <span className="text-base font-black text-amber-400">{unlockedCount} / {totalBadges}</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">סה"כ נקודות XP</span>
              <span className="text-base font-black text-emerald-400">{currentXP} XP</span>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">השלמות מוקדמות</span>
              <span className="text-base font-black text-sky-400">{stats.totalEarlyCompletions}</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/80'
            }`}
          >
            הכל ({allBadges.length})
          </button>

          <button
            onClick={() => setSelectedCategory('streak')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'streak'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/80'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>רצפי עבודה 🔥</span>
          </button>

          <button
            onClick={() => setSelectedCategory('early_bird')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'early_bird'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/80'
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-sky-500" />
            <span>השלמות מוקדמות 🌅</span>
          </button>

          <button
            onClick={() => setSelectedCategory('milestone')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'milestone'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/80'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span>אבני דרך 🎯</span>
          </button>

          <button
            onClick={() => setSelectedCategory('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'ai'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>בינה מלאכותית 🧠</span>
          </button>
        </div>

        {/* Badges Grid Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const isUnlocked = badge.unlocked;
              const pct = Math.round((badge.progress / badge.maxProgress) * 100);

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`relative cursor-pointer p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                    isUnlocked
                      ? 'bg-white border-amber-300 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                      : 'bg-slate-100/70 border-slate-200/90 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Badge Icon & Rarity Tag */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs transition ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300 ring-4 ring-amber-50'
                          : 'bg-slate-200 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isUnlocked ? badge.icon : <Lock className="w-6 h-6 text-slate-400" />}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getRarityBadgeStyle(
                        badge.rarity
                      )}`}
                    >
                      {getRarityLabel(badge.rarity)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{badge.title}</span>
                      {isUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">
                      {badge.description}
                    </p>
                  </div>

                  {/* Progress or Unlock Status */}
                  <div className="pt-2 border-t border-slate-100">
                    {isUnlocked ? (
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-700">
                        <span>נפתח בהצלחה! ✨</span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">+{badge.rewardXP} XP</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>התקדמות</span>
                          <span>
                            {badge.progress} / {badge.maxProgress}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Badge Detail Modal */}
        {selectedBadge && (
          <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-300 flex items-center justify-center text-4xl shadow-md">
                {selectedBadge.unlocked ? selectedBadge.icon : '🔒'}
              </div>

              <div>
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-black mb-1 border ${getRarityBadgeStyle(selectedBadge.rarity)}`}>
                  {getRarityLabel(selectedBadge.rarity)}
                </span>
                <h3 className="font-black text-lg text-slate-900">{selectedBadge.title}</h3>
                <p className="text-xs font-semibold text-slate-600 mt-1">{selectedBadge.description}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">פרס XP:</span>
                  <span className="text-amber-600">+{selectedBadge.rewardXP} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">סטטוס:</span>
                  <span>{selectedBadge.unlocked ? 'נפתח 🎉' : `בתהליך (${selectedBadge.progress}/${selectedBadge.maxProgress})`}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition"
              >
                סגור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
