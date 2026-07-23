/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DateStrip } from './components/DateStrip';
import { HabitCard } from './components/HabitCard';
import { HabitModal } from './components/HabitModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { TimerModal } from './components/TimerModal';
import { NumericModal } from './components/NumericModal';
import { AnalyticsView } from './components/AnalyticsView';
import { HabitsManageView } from './components/HabitsManageView';
import { SettingsView } from './components/SettingsView';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { AuthModal } from './components/AuthModal';
import { AIGoalDecomposer } from './components/AIGoalDecomposer';
import { AISmartLogModal } from './components/AISmartLogModal';
import { AITrendAnalyzerModal } from './components/AITrendAnalyzerModal';

import { ActiveTab, Habit, HabitCategory, PrivacySettings, Friend, FriendCheer, Badge, GamificationStats } from './types';
import { loadHabits, saveHabits, loadProStatus, saveProStatus, loadSoundPreference, saveSoundPreference, toggleHabitLog } from './utils/storage';
import { UserAccount, getCurrentUser, logoutUser, getUserHabitsKey } from './utils/auth';
import { SocialView } from './components/SocialView';
import { publishHabitCompletionEvent } from './utils/socialStore';
import { formatISO } from './utils/date';

import { BadgesModal } from './components/BadgesModal';
import { BadgeUnlockModal } from './components/BadgeUnlockModal';
import { loadGamificationStats, saveGamificationStats, evaluateGamification } from './utils/gamification';
import { testConnection, logOutFirebase } from './lib/firebase';
import { useReminderScheduler } from './hooks/useReminderScheduler';
import { ReminderToastContainer } from './components/ReminderToastContainer';
import {
  saveHabitsToFirestore,
  loadHabitsFromFirestore,
  saveGamificationStatsToFirestore,
  loadGamificationStatsFromFirestore,
} from './lib/firestoreSync';

import { calculateHabitStreaks, isHabitCompletedOnDate, isHabitScheduledForDate } from './utils/streak';
import { soundFX } from './utils/audio';
import { Plus, CheckCircle2, Flame, Sparkles, Filter, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getCurrentUser);
  const [habits, setHabits] = useState<Habit[]>(() => {
    if (currentUser) {
      const userKey = getUserHabitsKey(currentUser.id);
      const raw = localStorage.getItem(userKey);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    return loadHabits();
  });

  const [selectedDate, setSelectedDate] = useState<string>(formatISO(new Date()));
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Preferences & Pro state
  const [isPro, setIsPro] = useState<boolean>(loadProStatus);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(loadSoundPreference);

  // Gamification state
  const [gamificationStats, setGamificationStats] = useState<GamificationStats>(() =>
    loadGamificationStats(currentUser?.id)
  );
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIGoalModalOpen, setIsAIGoalModalOpen] = useState(false);
  const [isAISmartLogModalOpen, setIsAISmartLogModalOpen] = useState(false);
  const [isAITrendModalOpen, setIsAITrendModalOpen] = useState(false);

  // Evaluate current badges dynamically
  const { allBadges } = evaluateGamification(habits, gamificationStats);

  // Validate connection to Firestore on app boot (Mandatory constraint)
  useEffect(() => {
    testConnection();
  }, []);

  // Sync user habits storage & Firestore
  const handleUpdateHabits = (updated: Habit[]) => {
    setHabits(updated);
    if (currentUser) {
      localStorage.setItem(getUserHabitsKey(currentUser.id), JSON.stringify(updated));
      saveHabitsToFirestore(currentUser.id, updated);
    }
    saveHabits(updated);
  };

  const handleUserAuthChange = async (user: UserAccount | null) => {
    setCurrentUser(user);
    if (user) {
      // Sync from Firestore if available
      const remoteHabits = await loadHabitsFromFirestore(user.id);
      if (remoteHabits && remoteHabits.length > 0) {
        setHabits(remoteHabits);
        localStorage.setItem(getUserHabitsKey(user.id), JSON.stringify(remoteHabits));
      } else {
        const userKey = getUserHabitsKey(user.id);
        const raw = localStorage.getItem(userKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setHabits(parsed);
            saveHabitsToFirestore(user.id, parsed);
          } catch {}
        } else {
          const initial = loadHabits();
          setHabits(initial);
          localStorage.setItem(userKey, JSON.stringify(initial));
          saveHabitsToFirestore(user.id, initial);
        }
      }

      // Sync Gamification Stats
      const remoteStats = await loadGamificationStatsFromFirestore(user.id);
      if (remoteStats) {
        setGamificationStats(remoteStats);
        saveGamificationStats(remoteStats, user.id);
      }
    } else {
      setHabits(loadHabits());
    }
  };

  const handleLogout = () => {
    logoutUser();
    logOutFirebase();
    handleUserAuthChange(null);
  };

  const handleAddAIGeneratedHabits = (newHabits: Omit<Habit, 'id' | 'createdDate' | 'logs'>[]) => {
    const created: Habit[] = newHabits.map((h, i) => ({
      ...h,
      type: h.type || (h.targetValue && h.targetValue > 1 ? 'numeric' : 'boolean'),
      id: `ai_${Date.now()}_${i}`,
      createdAt: h.createdAt || new Date().toISOString(),
      createdDate: formatISO(new Date()),
      logs: {},
    }));

    const updated = [...created, ...habits];
    handleUpdateHabits(updated);

    // Gamification evaluation for AI Decomposer
    const { updatedStats, newlyUnlocked } = evaluateGamification(updated, gamificationStats, { type: 'ai_decomposer' });
    setGamificationStats(updatedStats);
    saveGamificationStats(updatedStats, currentUser?.id);
    if (newlyUnlocked.length > 0) {
      setNewlyUnlockedBadge(newlyUnlocked[0]);
    }

    soundFX.playCompleteSound();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleApplyAISmartLogs = (updates: { habitId: string; completed: boolean; value: number; notes: string }[]) => {
    let currentHabits = habits;
    updates.forEach((upd) => {
      const res = toggleHabitLog(
        currentHabits,
        upd.habitId,
        selectedDate,
        upd.completed,
        upd.value,
        upd.notes
      );
      currentHabits = res.updatedHabits;
    });

    handleUpdateHabits(currentHabits);

    // Gamification evaluation for AI Voice Log
    const { updatedStats, newlyUnlocked } = evaluateGamification(currentHabits, gamificationStats, { type: 'ai_voice_log' });
    setGamificationStats(updatedStats);
    saveGamificationStats(updatedStats, currentUser?.id);
    if (newlyUnlocked.length > 0) {
      setNewlyUnlockedBadge(newlyUnlocked[0]);
    }

    soundFX.playCompleteSound();
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#10b981', '#6366f1', '#f59e0b'],
    });
  };

  // Social & Privacy State
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    if (typeof window === 'undefined') {
      return {
        shareProfile: true,
        shareStreaks: true,
        shareHabitNames: true,
        allowEncouragement: true,
        myInviteCode: 'HERO-8821',
      };
    }
    const raw = localStorage.getItem('habit_tracker_privacy_v1');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return {
      shareProfile: true,
      shareStreaks: true,
      shareHabitNames: true,
      allowEncouragement: true,
      myInviteCode: 'HERO-' + Math.floor(1000 + Math.random() * 9000),
    };
  });

  const [friends, setFriends] = useState<Friend[]>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('habit_tracker_friends_v1');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return [
      {
        id: 'friend-1',
        name: 'דניאל כהן',
        avatar: '👨‍💻',
        inviteCode: 'DANI-7712',
        level: 12,
        bestStreak: 24,
        totalCompletions: 142,
        status: 'connected',
        privacy: { shareStreaks: true, shareHabitNames: true, allowEncouragement: true },
        habits: [
          { id: 'fh1', name: 'שתיית מים 2L', icon: 'droplet', streak: 12, completedToday: true },
          { id: 'fh2', name: 'אימון כושר', icon: 'dumbbell', streak: 8, completedToday: true },
          { id: 'fh3', name: 'קריאת ספר', icon: 'book', streak: 15, completedToday: false },
        ],
      },
      {
        id: 'friend-2',
        name: 'עדי לוי',
        avatar: '🧘‍♀️',
        inviteCode: 'ADI-3341',
        level: 9,
        bestStreak: 18,
        totalCompletions: 98,
        status: 'connected',
        privacy: { shareStreaks: true, shareHabitNames: true, allowEncouragement: true },
        habits: [
          { id: 'fh4', name: 'מדיטציה 10 דק', icon: 'brain', streak: 18, completedToday: true },
          { id: 'fh5', name: 'הליכה בוקר', icon: 'footprints', streak: 5, completedToday: true },
        ],
      },
      {
        id: 'friend-3',
        name: 'נועם אלון',
        avatar: '🚀',
        inviteCode: 'NOAM-5510',
        level: 15,
        bestStreak: 31,
        totalCompletions: 210,
        status: 'connected',
        privacy: { shareStreaks: true, shareHabitNames: false, allowEncouragement: true },
        habits: [
          { id: 'fh6', name: 'הרגל חסוי', icon: 'sparkles', streak: 31, completedToday: true },
        ],
      },
    ];
  });

  const [cheers, setCheers] = useState<FriendCheer[]>(() => {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('habit_tracker_cheers_v1');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return [
      {
        id: 'cheer-1',
        fromFriendId: 'friend-1',
        fromFriendName: 'דניאל כהן',
        fromFriendAvatar: '👨‍💻',
        message: 'אש עלייך! שמור על הרצף המטורף הזה! 🔥',
        emoji: '🔥',
        timestamp: 'לפני שעתיים',
      },
      {
        id: 'cheer-2',
        fromFriendId: 'friend-2',
        fromFriendName: 'עדי לוי',
        fromFriendAvatar: '🧘‍♀️',
        message: 'איזו התמדה מעוררת השראה 💪 כל הכבוד!',
        emoji: '💪',
        timestamp: 'אתמול',
      },
    ];
  });

  // Save Social state changes
  const handleUpdatePrivacy = (newSettings: PrivacySettings) => {
    setPrivacySettings(newSettings);
    localStorage.setItem('habit_tracker_privacy_v1', JSON.stringify(newSettings));
  };

  const handleAddFriend = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    if (friends.some((f) => f.inviteCode.toUpperCase() === cleanCode)) {
      return false;
    }

    const newFriendNames = ['תמר פרידמן', 'יונתן מזרחי', 'רוני ברק', 'עומר דהן'];
    const newAvatars = ['⭐', '🏆', '🎯', '⚡'];
    const randomIndex = Math.floor(Math.random() * newFriendNames.length);

    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      name: newFriendNames[randomIndex],
      avatar: newAvatars[randomIndex],
      inviteCode: cleanCode,
      level: Math.floor(Math.random() * 10) + 1,
      bestStreak: Math.floor(Math.random() * 20) + 5,
      totalCompletions: Math.floor(Math.random() * 100) + 20,
      status: 'connected',
      privacy: { shareStreaks: true, shareHabitNames: true, allowEncouragement: true },
      habits: [
        { id: `fh-${Date.now()}-1`, name: 'הרגלים יומיים', icon: 'sparkles', streak: 10, completedToday: true },
      ],
    };

    const updated = [newFriend, ...friends];
    setFriends(updated);
    localStorage.setItem('habit_tracker_friends_v1', JSON.stringify(updated));
    return true;
  };

  const handleSendCheer = (friendId: string, message: string, emoji: string) => {
    const targetFriend = friends.find((f) => f.id === friendId);
    if (!targetFriend) return;

    soundFX.playCompleteSound();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
    });

    const newCheer: FriendCheer = {
      id: `cheer-${Date.now()}`,
      fromFriendId: 'me',
      fromFriendName: 'אתה (ל-' + targetFriend.name + ')',
      fromFriendAvatar: '🌟',
      message,
      emoji,
      timestamp: 'כרגע',
    };

    const updated = [newCheer, ...cheers];
    setCheers(updated);
    localStorage.setItem('habit_tracker_cheers_v1', JSON.stringify(updated));
  };

  // Modals state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [activeDetailHabit, setActiveDetailHabit] = useState<Habit | null>(null);
  const [activeTimerHabit, setActiveTimerHabit] = useState<Habit | null>(null);
  const [activeNumericHabit, setActiveNumericHabit] = useState<Habit | null>(null);

  // Sync sound preference with soundFX utility
  useEffect(() => {
    soundFX.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Toggle log for a habit on selectedDate
  const handleToggleLog = (
    habitId: string,
    dateStr: string,
    forcedCompleted?: boolean,
    valueOverride?: number,
    notesOverride?: string,
    audioUrlOverride?: string,
    audioDurationOverride?: number
  ) => {
    const { updatedHabits, isNowCompleted } = toggleHabitLog(
      habits,
      habitId,
      dateStr,
      forcedCompleted,
      valueOverride,
      notesOverride,
      audioUrlOverride,
      audioDurationOverride
    );

    setHabits(updatedHabits);

    if (isNowCompleted) {
      const currentHour = new Date().getHours();
      const isEarlyBird = currentHour < 9; // Early completion before 09:00 AM

      const targetHabit = updatedHabits.find((h) => h.id === habitId);
      if (targetHabit) {
        const streakInfo = calculateHabitStreaks(targetHabit, dateStr);
        publishHabitCompletionEvent(
          currentUser?.fullName || 'אני (אתה)',
          currentUser?.avatar || '🦸‍♂️',
          targetHabit.name,
          streakInfo.currentStreak,
          targetHabit.category
        );
      }

      // Gamification & Badges Evaluation
      const { updatedStats, newlyUnlocked } = evaluateGamification(
        updatedHabits,
        gamificationStats,
        isEarlyBird ? { type: 'early_completion' } : undefined
      );

      setGamificationStats(updatedStats);
      saveGamificationStats(updatedStats, currentUser?.id);

      if (newlyUnlocked.length > 0) {
        setNewlyUnlockedBadge(newlyUnlocked[0]);
        soundFX.playCelebrationSound();
        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
        });
      }
    }

    // Check if ALL habits scheduled for dateStr are now completed -> Celebration!
    const scheduledToday = updatedHabits.filter((h) => !h.archived && isHabitScheduledForDate(h, dateStr));
    const completedToday = scheduledToday.filter((h) => isHabitCompletedOnDate(h, dateStr));

    if (isNowCompleted && scheduledToday.length > 0 && scheduledToday.length === completedToday.length) {
      soundFX.playCelebrationSound();
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'],
      });
    }

    // Refresh active detail modal if open
    if (activeDetailHabit && activeDetailHabit.id === habitId) {
      const refreshed = updatedHabits.find((h) => h.id === habitId);
      if (refreshed) setActiveDetailHabit(refreshed);
    }
  };

  // Browser Reminder Scheduler Hook
  const {
    remindersEnabled,
    toggleRemindersEnabled,
    permissionStatus,
    handleRequestPermission,
    activeToasts,
    dismissToast,
    completeHabitFromToast,
    testHabitReminder,
    testSystemNotification,
  } = useReminderScheduler(habits, handleToggleLog);

  // Create / Edit habit save handler
  const handleSaveHabit = (savedHabit: Habit) => {
    const exists = habits.some((h) => h.id === savedHabit.id);
    let updated: Habit[];
    if (exists) {
      updated = habits.map((h) => (h.id === savedHabit.id ? savedHabit : h));
    } else {
      updated = [savedHabit, ...habits];
    }
    handleUpdateHabits(updated);
    setHabitToEdit(null);
  };

  // Delete habit
  const handleDeleteHabit = (habitId: string) => {
    const updated = habits.filter((h) => h.id !== habitId);
    handleUpdateHabits(updated);
  };

  // Toggle Archive
  const handleToggleArchive = (habitId: string) => {
    const updated = habits.map((h) => (h.id === habitId ? { ...h, archived: !h.archived } : h));
    handleUpdateHabits(updated);
  };

  // Calculate overall streak
  const totalStreak = Math.max(
    ...habits.filter((h) => !h.archived).map((h) => calculateHabitStreaks(h, selectedDate).currentStreak),
    0
  );

  // Filter scheduled habits for selectedDate
  const scheduledHabitsForDate = habits.filter(
    (h) => !h.archived && isHabitScheduledForDate(h, selectedDate)
  );

  const filteredHabits = scheduledHabitsForDate
    .filter((h) => {
      if (filterCategory === 'all') return true;
      return h.category === filterCategory;
    })
    .sort((a, b) => {
      const aDone = isHabitCompletedOnDate(a, selectedDate);
      const bDone = isHabitCompletedOnDate(b, selectedDate);
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return 0;
    });

  const completedCount = scheduledHabitsForDate.filter((h) => isHabitCompletedOnDate(h, selectedDate)).length;
  const totalScheduledCount = scheduledHabitsForDate.length;
  const dayProgressPercent = totalScheduledCount > 0 ? Math.round((completedCount / totalScheduledCount) * 100) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-800">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPro={isPro}
        onOpenProModal={() => setIsProModalOpen(true)}
        onOpenCreateHabit={() => {
          setHabitToEdit(null);
          setIsHabitModalOpen(true);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          saveSoundPreference(next);
        }}
        totalStreak={totalStreak}
        userLevel={gamificationStats.level}
        userXP={gamificationStats.xp}
        unlockedBadgesCount={gamificationStats.unlockedBadgeIds.length}
        onOpenBadgesModal={() => setIsBadgesModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAIGoalDecomposer={() => setIsAIGoalModalOpen(true)}
        onOpenAISmartLog={() => setIsAISmartLogModalOpen(true)}
        onOpenAITrendAnalyzer={() => setIsAITrendModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-120px)]">
        
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Horizontal Date Picker Strip */}
            <DateStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              habits={habits}
            />

            <div className="max-w-7xl mx-auto px-4 py-6">
              
              {/* Neo-Bento Container */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Feed Bento Box (Span 2 Columns) */}
                <div className="lg:col-span-2 bento-box space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#2a221a]/20">
                    <div>
                      <span className="label-neo mb-1">{selectedDate} / DAILY JOURNAL</span>
                      <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2a221a]">
                        משימות היום ({completedCount}/{totalScheduledCount})
                      </h2>
                    </div>

                    {/* Filter Tags */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {[
                        { id: 'all', label: 'הכל' },
                        { id: 'health', label: 'בריאות' },
                        { id: 'fitness', label: 'כושר' },
                        { id: 'mindset', label: 'מיינדסט' },
                        { id: 'productivity', label: 'עבודה' },
                        { id: 'learning', label: 'למידה' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setFilterCategory(cat.id)}
                          className={`tag-neo text-xs ${filterCategory === cat.id ? 'active' : ''}`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Habit Cards Stack */}
                  {filteredHabits.length > 0 ? (
                    <div className="space-y-3">
                      {filteredHabits.map((habit) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          selectedDate={selectedDate}
                          onToggleLog={handleToggleLog}
                          onOpenDetail={(h) => setActiveDetailHabit(h)}
                          onOpenTimer={(h) => setActiveTimerHabit(h)}
                          onOpenNumericModal={(h) => setActiveNumericHabit(h)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-[#2a221a]/30 rounded-2xl p-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#ffdf3e] border-2 border-[#2a221a] flex items-center justify-center mx-auto mb-3 text-[#2a221a]">
                        <Calendar className="w-7 h-7" />
                      </div>
                      <h3 className="font-extrabold text-base text-[#2a221a]">אין הרגלים מתוכננים עבור סינון זה</h3>
                      <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1 mb-4">
                        נסה לשנות את הקטגוריה או לחץ להוספת הרגל חדש.
                      </p>
                      <button
                        onClick={() => {
                          setHabitToEdit(null);
                          setIsHabitModalOpen(true);
                        }}
                        className="btn-fancy"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>צור הרגל חדש</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sidebar Bento Column */}
                <div className="space-y-6 flex flex-col">
                  
                  {/* Streak Consistency Bento Card */}
                  <div className="bento-box-accent flex flex-col items-center justify-center text-center p-6 min-h-[220px]">
                    <div className="streak-circle">
                      <span className="font-gaegu text-5xl font-bold text-[#2a221a] leading-none">
                        {totalStreak}🔥
                      </span>
                    </div>
                    <p className="label-neo mt-4">STREAK CONSISTENCY</p>
                  </div>

                  {/* Total Completion Bento Card */}
                  <div className="bento-box flex-1 flex flex-col items-center text-center p-6 space-y-3">
                    <span className="label-neo">TOTAL COMPLETION</span>
                    
                    <div className="font-gaegu text-5xl font-bold text-[#2a221a] my-1">
                      {dayProgressPercent}%
                    </div>

                    <p className="text-xs font-black text-[#2a221a]">
                      {dayProgressPercent === 100
                        ? '🎉 כל הכבוד! השלמת הכל היום'
                        : `נותרו עוד ${totalScheduledCount - completedCount} משימות להשלמה`}
                    </p>

                    <div className="w-full bg-[#fffbf2] border-2 border-[#2a221a] h-4 rounded-full overflow-hidden my-2">
                      <div
                        className="bg-[#2a221a] h-full rounded-full transition-all duration-500"
                        style={{ width: `${dayProgressPercent}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-auto pt-4">
                      <div className="border-2 border-[#2a221a] bg-[#fffbf2] rounded-xl p-3 text-center">
                        <span className="label-neo text-[8px] py-0 px-1">LEVEL</span>
                        <div className="font-gaegu text-2xl font-bold text-[#2a221a] mt-1">
                          {gamificationStats.level}
                        </div>
                      </div>

                      <div className="border-2 border-[#2a221a] bg-[#ff8e72] rounded-xl p-3 text-center">
                        <span className="label-neo text-[8px] py-0 px-1">BADGES</span>
                        <div className="font-gaegu text-2xl font-bold text-[#2a221a] mt-1">
                          {gamificationStats.unlockedBadgeIds.length}🏅
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* Social Mode Tab */}
        {activeTab === 'social' && (
          <div className="max-w-5xl mx-auto px-4 py-6">
            <SocialView
              privacySettings={privacySettings}
              onUpdatePrivacy={handleUpdatePrivacy}
              friends={friends}
              cheers={cheers}
              onAddFriend={handleAddFriend}
              onSendCheer={handleSendCheer}
              myHabits={habits}
              userName={currentUser?.fullName || 'אני (אתה)'}
              userAvatar={currentUser?.avatar || '🦸‍♂️'}
            />
          </div>
        )}


        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="max-w-5xl mx-auto px-4 py-6">
            <AnalyticsView
              habits={habits}
              isPro={isPro}
              onOpenProModal={() => setIsProModalOpen(true)}
            />
          </div>
        )}

        {/* Manage Habits Tab */}
        {activeTab === 'habits_manage' && (
          <div className="max-w-5xl mx-auto px-4 py-6">
            <HabitsManageView
              habits={habits}
              onOpenCreateHabit={() => {
                setHabitToEdit(null);
                setIsHabitModalOpen(true);
              }}
              onEditHabit={(h) => {
                setHabitToEdit(h);
                setIsHabitModalOpen(true);
              }}
              onDeleteHabit={handleDeleteHabit}
              onToggleArchive={handleToggleArchive}
            />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-5xl mx-auto px-4 py-6">
            <SettingsView
              habits={habits}
              onUpdateHabits={handleUpdateHabits}
              isPro={isPro}
              onOpenProModal={() => setIsProModalOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                saveSoundPreference(next);
              }}
              remindersEnabled={remindersEnabled}
              onToggleRemindersEnabled={toggleRemindersEnabled}
              permissionStatus={permissionStatus}
              onRequestPermission={handleRequestPermission}
              onTestSystemNotification={testSystemNotification}
              onTestHabitReminder={testHabitReminder}
              onOpenEditHabit={(h) => {
                setHabitToEdit(h);
                setIsHabitModalOpen(true);
              }}
            />
          </div>
        )}

      </main>

      {/* Floating Active Reminder Toasts Banner */}
      <ReminderToastContainer
        toasts={activeToasts}
        onDismiss={dismissToast}
        onComplete={completeHabitFromToast}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 font-medium">
        <p>הרגלים טובים - מעקב הרגלים חכם וניהול רצפי התמדה במבנה Bento © {new Date().getFullYear()}</p>
      </footer>

      {/* Modals Container */}
      {isHabitModalOpen && (
        <HabitModal
          habitToEdit={habitToEdit}
          onClose={() => setIsHabitModalOpen(false)}
          onSave={handleSaveHabit}
          isPro={isPro}
        />
      )}

      {activeDetailHabit && (
        <HabitDetailModal
          habit={activeDetailHabit}
          onClose={() => setActiveDetailHabit(null)}
          onEdit={(h) => {
            setActiveDetailHabit(null);
            setHabitToEdit(h);
            setIsHabitModalOpen(true);
          }}
          onDelete={(id) => {
            handleDeleteHabit(id);
            setActiveDetailHabit(null);
          }}
          onToggleLogDate={handleToggleLog}
        />
      )}

      {activeTimerHabit && (
        <TimerModal
          habit={activeTimerHabit}
          selectedDate={selectedDate}
          onClose={() => setActiveTimerHabit(null)}
          onSaveProgress={(seconds) => {
            handleToggleLog(activeTimerHabit.id, selectedDate, undefined, seconds);
          }}
        />
      )}

      {activeNumericHabit && (
        <NumericModal
          habit={activeNumericHabit}
          selectedDate={selectedDate}
          onClose={() => setActiveNumericHabit(null)}
          onSaveProgress={(val) => {
            handleToggleLog(activeNumericHabit.id, selectedDate, undefined, val);
          }}
        />
      )}

      {isProModalOpen && (
        <ProUpgradeModal
          isPro={isPro}
          onTogglePro={() => {
            const next = !isPro;
            setIsPro(next);
            saveProStatus(next);
          }}
          onClose={() => setIsProModalOpen(false)}
        />
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleUserAuthChange}
      />

      {/* Section 1 AI Goal Decomposition Modal */}
      <AIGoalDecomposer
        isOpen={isAIGoalModalOpen}
        onClose={() => setIsAIGoalModalOpen(false)}
        onAddHabits={handleAddAIGeneratedHabits}
      />

      {/* Section 2 AI Natural Language / Voice Smart Tracking Modal */}
      <AISmartLogModal
        isOpen={isAISmartLogModalOpen}
        onClose={() => setIsAISmartLogModalOpen(false)}
        userHabits={habits}
        onApplySmartLogs={handleApplyAISmartLogs}
      />

      {/* Section 3 AI Personal Coach & Weak-Day Trend Analyzer Modal */}
      <AITrendAnalyzerModal
        isOpen={isAITrendModalOpen}
        onClose={() => setIsAITrendModalOpen(false)}
        habits={habits}
      />

      {/* Badges & Gamification Showcase Modal */}
      <BadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
        stats={gamificationStats}
        allBadges={allBadges}
      />

      {/* Badge Unlock Celebration Popup */}
      <BadgeUnlockModal
        badge={newlyUnlockedBadge}
        onClose={() => setNewlyUnlockedBadge(null)}
        onShareToFeed={(badge) => {
          publishHabitCompletionEvent(
            currentUser?.fullName || 'אני (אתה)',
            currentUser?.avatar || '🦸‍♂️',
            `זכייה בתג הישג: "${badge.title}"`,
            gamificationStats.level,
            'gamification'
          );
        }}
      />



    </div>
  );
}
