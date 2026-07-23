import { Badge, GamificationStats, Habit } from '../types';
import { calculateHabitStreaks } from './streak';

const GAMIFICATION_STORAGE_PREFIX = 'habit_gamification_v1';

export const ALL_BADGES: Omit<Badge, 'unlocked' | 'progress' | 'unlockedAt'>[] = [
  // --- STREAK BADGES ---
  {
    id: 'streak_3',
    title: 'ניצוץ התמדה 🔥',
    description: 'הגעת לרצף עבודה של 3 ימים ברציפות ברגל אחד לפחות',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    maxProgress: 3,
    rewardXP: 50,
  },
  {
    id: 'streak_7',
    title: 'שבוע הברזל ⚡',
    description: 'שמרת על רצף הרגל מלא של 7 ימים ברציפות',
    icon: '⚡',
    category: 'streak',
    rarity: 'rare',
    maxProgress: 7,
    rewardXP: 150,
  },
  {
    id: 'streak_14',
    title: 'מאסטר העקביות 🏆',
    description: 'הגעת לרצף מרשים של 14 ימים ברציפות!',
    icon: '🏆',
    category: 'streak',
    rarity: 'epic',
    maxProgress: 14,
    rewardXP: 350,
  },
  {
    id: 'streak_30',
    title: 'אגדת ה-HabitHero 👑',
    description: 'הגעת לרצף של 30 ימים! שינית את אורח החיים שלך לתמיד',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    maxProgress: 30,
    rewardXP: 1000,
  },

  // --- EARLY BIRD BADGES (השלמות מוקדמות) ---
  {
    id: 'early_1',
    title: 'ציפור מוקדמת 🌅',
    description: 'ביצעת השלמת הרגל מוקדמת בבוקר לפני השעה 09:00',
    icon: '🌅',
    category: 'early_bird',
    rarity: 'common',
    maxProgress: 1,
    rewardXP: 50,
  },
  {
    id: 'early_5',
    title: 'משכים קום מקצועי ⏰',
    description: 'השלמת 5 הרגלים מוקדמים בבוקר לפני 09:00',
    icon: '⏰',
    category: 'early_bird',
    rarity: 'rare',
    maxProgress: 5,
    rewardXP: 180,
  },
  {
    id: 'early_15',
    title: 'אלוף השחר 🌄',
    description: 'השלמת 15 הרגלים בשעות הבוקר המוקדמות. פותח את היום באנרגיה שיא!',
    icon: '🌄',
    category: 'early_bird',
    rarity: 'epic',
    maxProgress: 15,
    rewardXP: 450,
  },

  // --- MILESTONES BADGES ---
  {
    id: 'total_10',
    title: 'צעד ראשון 🎯',
    description: 'השלמת 10 משימות והרגלים בסך הכל',
    icon: '🎯',
    category: 'milestone',
    rarity: 'common',
    maxProgress: 10,
    rewardXP: 50,
  },
  {
    id: 'total_50',
    title: 'מכונת ביצוע ⚙️',
    description: 'השלמת 50 משימות והרגלים בסך הכל במערכת',
    icon: '⚙️',
    category: 'milestone',
    rarity: 'rare',
    maxProgress: 50,
    rewardXP: 250,
  },
  {
    id: 'total_100',
    title: 'סנטינל ההישגים 💎',
    description: 'עברת 100 השלמות הרגלים! הישג נדיר ויוצא דופן',
    icon: '💎',
    category: 'milestone',
    rarity: 'legendary',
    maxProgress: 100,
    rewardXP: 800,
  },

  // --- AI & SOCIAL BADGES ---
  {
    id: 'ai_decomposer',
    title: 'מתכנן על AI 🧠',
    description: 'פירקת יעד גדול להרגלים יומיים בעזרת בינה מלאכותית',
    icon: '🧠',
    category: 'ai',
    rarity: 'common',
    maxProgress: 1,
    rewardXP: 100,
  },
  {
    id: 'ai_voice_log',
    title: 'מדווח קולי 🎙️',
    description: 'עדכנת הרגלים בעזרת דיווח קולי או טקסט חופשי ב-AI',
    icon: '🎙️',
    category: 'ai',
    rarity: 'common',
    maxProgress: 1,
    rewardXP: 100,
  },
  {
    id: 'social_cheerer',
    title: 'מעודד הקהילה 👏',
    description: 'שלחת עידודים וחיזוקים קבוצתיים לחברים בפיד',
    icon: '👏',
    category: 'social',
    rarity: 'rare',
    maxProgress: 3,
    rewardXP: 150,
  },
];

export function getGamificationStorageKey(userId?: string): string {
  return userId ? `${GAMIFICATION_STORAGE_PREFIX}_${userId}` : GAMIFICATION_STORAGE_PREFIX;
}

export function loadGamificationStats(userId?: string): GamificationStats {
  try {
    const raw = localStorage.getItem(getGamificationStorageKey(userId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading gamification stats:', e);
  }

  return {
    xp: 0,
    level: 1,
    unlockedBadgeIds: [],
    totalEarlyCompletions: 0,
    unlockedBadgesHistory: [],
  };
}

import { saveGamificationStatsToFirestore } from '../lib/firestoreSync';

export function saveGamificationStats(stats: GamificationStats, userId?: string) {
  try {
    localStorage.setItem(getGamificationStorageKey(userId), JSON.stringify(stats));
    if (userId) {
      saveGamificationStatsToFirestore(userId, stats);
    }
  } catch (e) {
    console.error('Error saving gamification stats:', e);
  }
}

/**
 * Calculates user badges, progress, and handles unlocking new ones
 */
export function evaluateGamification(
  habits: Habit[],
  currentStats: GamificationStats,
  extraEvent?: {
    type: 'early_completion' | 'ai_decomposer' | 'ai_voice_log' | 'social_cheer';
    count?: number;
  }
): {
  updatedStats: GamificationStats;
  newlyUnlocked: Badge[];
  allBadges: Badge[];
} {
  let statsCopy: GamificationStats = {
    ...currentStats,
    unlockedBadgeIds: [...currentStats.unlockedBadgeIds],
    unlockedBadgesHistory: [...(currentStats.unlockedBadgesHistory || [])],
  };

  if (extraEvent?.type === 'early_completion') {
    statsCopy.totalEarlyCompletions += extraEvent.count || 1;
  }

  // Calculate global metrics from habits
  let maxBestStreak = 0;
  let totalCompletionsCount = 0;

  habits.forEach((habit) => {
    const streakData = calculateHabitStreaks(habit);
    if (streakData.bestStreak > maxBestStreak) {
      maxBestStreak = streakData.bestStreak;
    }
    if (streakData.currentStreak > maxBestStreak) {
      maxBestStreak = streakData.currentStreak;
    }

    Object.values(habit.logs || {}).forEach((log) => {
      if (log.completed) {
        totalCompletionsCount += 1;
      }
    });
  });

  const newlyUnlocked: Badge[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const allBadges: Badge[] = ALL_BADGES.map((badgeDef) => {
    let currentProgress = 0;

    switch (badgeDef.id) {
      case 'streak_3':
      case 'streak_7':
      case 'streak_14':
      case 'streak_30':
        currentProgress = Math.min(maxBestStreak, badgeDef.maxProgress);
        break;

      case 'early_1':
      case 'early_5':
      case 'early_15':
        currentProgress = Math.min(statsCopy.totalEarlyCompletions, badgeDef.maxProgress);
        break;

      case 'total_10':
      case 'total_50':
      case 'total_100':
        currentProgress = Math.min(totalCompletionsCount, badgeDef.maxProgress);
        break;

      case 'ai_decomposer':
        currentProgress = extraEvent?.type === 'ai_decomposer' || statsCopy.unlockedBadgeIds.includes('ai_decomposer') ? 1 : 0;
        break;

      case 'ai_voice_log':
        currentProgress = extraEvent?.type === 'ai_voice_log' || statsCopy.unlockedBadgeIds.includes('ai_voice_log') ? 1 : 0;
        break;

      case 'social_cheerer':
        if (extraEvent?.type === 'social_cheer') {
          const prev = statsCopy.unlockedBadgesHistory.filter((h) => h.badgeId === 'social_cheer_count').length;
          currentProgress = Math.min(prev + 1, badgeDef.maxProgress);
        } else if (statsCopy.unlockedBadgeIds.includes('social_cheerer')) {
          currentProgress = badgeDef.maxProgress;
        } else {
          currentProgress = 0;
        }
        break;

      default:
        currentProgress = 0;
    }

    const isUnlocked = statsCopy.unlockedBadgeIds.includes(badgeDef.id) || currentProgress >= badgeDef.maxProgress;

    // Check if newly unlocked right now
    if (isUnlocked && !statsCopy.unlockedBadgeIds.includes(badgeDef.id)) {
      statsCopy.unlockedBadgeIds.push(badgeDef.id);
      statsCopy.unlockedBadgesHistory.push({ badgeId: badgeDef.id, unlockedAt: todayStr });
      statsCopy.xp += badgeDef.rewardXP;

      const fullUnlockedBadge: Badge = {
        ...badgeDef,
        unlocked: true,
        unlockedAt: todayStr,
        progress: badgeDef.maxProgress,
      };
      newlyUnlocked.push(fullUnlockedBadge);
    }

    const unlockedRecord = statsCopy.unlockedBadgesHistory.find((h) => h.badgeId === badgeDef.id);

    return {
      ...badgeDef,
      unlocked: isUnlocked,
      unlockedAt: unlockedRecord?.unlockedAt,
      progress: isUnlocked ? badgeDef.maxProgress : currentProgress,
    };
  });

  // Calculate level based on XP (Level up every 200 XP)
  statsCopy.level = Math.floor(statsCopy.xp / 200) + 1;

  return {
    updatedStats: statsCopy,
    newlyUnlocked,
    allBadges,
  };
}
