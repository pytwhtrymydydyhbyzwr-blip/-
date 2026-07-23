import { Habit, HabitStreakInfo } from '../types';
import { formatISO, parseISO } from './date';

/**
 * Checks if a habit was scheduled for a given date
 */
export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  const date = parseISO(dateStr);
  const freq = habit.frequency;

  if (freq.type === 'daily') {
    return true;
  }

  if (freq.type === 'specific_days' && freq.days) {
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
    return freq.days.includes(dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
  }

  if (freq.type === 'times_per_week') {
    return true; // Scheduled continuously for target goal
  }

  return true;
}

/**
 * Checks if habit is completed on a specific date
 */
export function isHabitCompletedOnDate(habit: Habit, dateStr: string): boolean {
  const log = habit.logs[dateStr];
  if (!log) return false;

  if (habit.type === 'boolean') {
    return !!log.completed;
  }

  if (habit.type === 'numeric' || habit.type === 'timer') {
    const val = log.value ?? 0;
    const target = habit.targetValue ?? 1;
    return val >= target;
  }

  return !!log.completed;
}

/**
 * Calculates current streak, best streak, total completions and completion rate
 */
export function calculateHabitStreaks(habit: Habit, referenceDateStr: string = formatISO(new Date())): HabitStreakInfo {
  const today = parseISO(referenceDateStr);
  const createdDate = parseISO(habit.createdAt || '2025-01-01');

  let currentStreak = 0;
  let bestStreak = 0;
  let totalCompleted = 0;
  let totalScheduled = 0;

  // 1. Calculate Total Completed & Total Scheduled
  const curr = new Date(createdDate);
  while (curr <= today) {
    const dateStr = formatISO(curr);
    if (isHabitScheduledForDate(habit, dateStr)) {
      totalScheduled++;
      if (isHabitCompletedOnDate(habit, dateStr)) {
        totalCompleted++;
      }
    }
    curr.setDate(curr.getDate() + 1);
  }

  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // 2. Calculate Current Streak
  // Start from today or yesterday depending if completed today
  let checkDate = new Date(today);
  const todayStr = formatISO(today);

  // If today is NOT completed and today is scheduled, check if yesterday was completed to keep current streak alive
  if (!isHabitCompletedOnDate(habit, todayStr)) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatISO(yesterday);

    if (isHabitCompletedOnDate(habit, yesterdayStr)) {
      checkDate = yesterday;
    } else {
      // Streak is broken if neither today nor yesterday was completed
      currentStreak = 0;
    }
  }

  // Count backwards for current streak
  if (isHabitCompletedOnDate(habit, formatISO(checkDate))) {
    while (checkDate >= createdDate) {
      const dateStr = formatISO(checkDate);
      if (isHabitScheduledForDate(habit, dateStr)) {
        if (isHabitCompletedOnDate(habit, dateStr)) {
          currentStreak++;
        } else {
          break; // streak ends
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // 3. Calculate Best Streak Ever
  let tempStreak = 0;
  const scanDate = new Date(createdDate);

  while (scanDate <= today) {
    const dateStr = formatISO(scanDate);
    if (isHabitScheduledForDate(habit, dateStr)) {
      if (isHabitCompletedOnDate(habit, dateStr)) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }
    scanDate.setDate(scanDate.getDate() + 1);
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    totalCompleted,
    completionRate,
  };
}

/**
 * Generates data for Day of Week Analysis (Sunday=0 to Saturday=6)
 */
export function getDayOfWeekAnalysis(habits: Habit[]) {
  const dayStats = [
    { dayName: 'ראשון', dayIndex: 0, completed: 0, total: 0 },
    { dayName: 'שני', dayIndex: 1, completed: 0, total: 0 },
    { dayName: 'שלישי', dayIndex: 2, completed: 0, total: 0 },
    { dayName: 'רביעי', dayIndex: 3, completed: 0, total: 0 },
    { dayName: 'חמישי', dayIndex: 4, completed: 0, total: 0 },
    { dayName: 'שישי', dayIndex: 5, completed: 0, total: 0 },
    { dayName: 'שבת', dayIndex: 6, completed: 0, total: 0 },
  ];

  // Scan last 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatISO(d);
    const dayOfWeek = d.getDay();

    habits.forEach((habit) => {
      if (!habit.archived && isHabitScheduledForDate(habit, dateStr)) {
        dayStats[dayOfWeek].total++;
        if (isHabitCompletedOnDate(habit, dateStr)) {
          dayStats[dayOfWeek].completed++;
        }
      }
    });
  }

  return dayStats.map((item) => ({
    ...item,
    percentage: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
  }));
}

/**
 * Overall completion rate trend over last N days
 */
export function getOverallProgressTrend(habits: Habit[], daysCount = 14) {
  const result: { date: string; displayDate: string; rate: number; completedCount: number; totalCount: number }[] = [];
  const activeHabits = habits.filter((h) => !h.archived);

  const today = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatISO(d);

    let completedCount = 0;
    let totalCount = 0;

    activeHabits.forEach((habit) => {
      if (isHabitScheduledForDate(habit, dateStr)) {
        totalCount++;
        if (isHabitCompletedOnDate(habit, dateStr)) {
          completedCount++;
        }
      }
    });

    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

    result.push({
      date: dateStr,
      displayDate,
      rate,
      completedCount,
      totalCount,
    });
  }

  return result;
}
