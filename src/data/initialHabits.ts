import { Habit } from '../types';
import { formatISO } from '../utils/date';

// Generate simulated past logs for realistic user experience
function generatePastLogs(completionProbability: number, numericValue: number = 0) {
  const logs: Record<string, { date: string; completed: boolean; value?: number; notes?: string }> = {};
  const today = new Date();

  for (let i = 0; i < 40; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatISO(d);

    // Give high completion chance, especially for recent days
    const isCompleted = Math.random() < completionProbability || i === 0;
    
    if (isCompleted) {
      logs[dateStr] = {
        date: dateStr,
        completed: true,
        value: numericValue,
        notes: i % 7 === 0 ? 'הרגשה מעולה! התמדה מצוינת היום.' : undefined,
      };
    } else if (i % 5 === 0) {
      logs[dateStr] = {
        date: dateStr,
        completed: false,
        value: Math.round(numericValue * 0.4),
        notes: 'יום עמוס, אשלים מחר.',
      };
    }
  }

  return logs;
}

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 40);

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-water',
    name: 'שתיית מים יומית',
    description: 'להגיע ל-2.5 ליטר מים ביום לשמירה על אנרגיה ובריאות',
    category: 'health',
    type: 'numeric',
    targetValue: 2500,
    unit: 'מ"ל',
    frequency: { type: 'daily' },
    targetTime: '08:00',
    color: 'emerald',
    icon: 'Droplet',
    createdAt: formatISO(thirtyDaysAgo),
    reminders: ['09:00', '14:00', '19:00'],
    logs: generatePastLogs(0.85, 2500),
  },
  {
    id: 'habit-reading',
    name: 'קריאת ספר להתפתחות',
    description: 'לפחות 15 עמודים ביום של ספר עיוני או פרוזה',
    category: 'learning',
    type: 'boolean',
    frequency: { type: 'daily' },
    targetTime: '21:00',
    color: 'amber',
    icon: 'Book',
    createdAt: formatISO(thirtyDaysAgo),
    reminders: ['21:00'],
    logs: generatePastLogs(0.75),
  },
  {
    id: 'habit-meditation',
    name: 'מדיטציה ופוקוס',
    description: '20 דקות תרגילי נשימה ומדיטציית מיינדפולנס',
    category: 'mindset',
    type: 'timer',
    targetValue: 1200, // 20 minutes in seconds
    frequency: { type: 'daily' },
    targetTime: '07:30',
    color: 'violet',
    icon: 'Brain',
    createdAt: formatISO(thirtyDaysAgo),
    reminders: ['07:30'],
    logs: generatePastLogs(0.8, 1200),
  },
  {
    id: 'habit-workout',
    name: 'אימון כושר / שכיבות סמיכה',
    description: 'ביצוע 50 שכיבות סמיכה או 45 דקות אימון גופני',
    category: 'fitness',
    type: 'numeric',
    targetValue: 50,
    unit: 'חזרות',
    frequency: { type: 'specific_days', days: [0, 1, 2, 3, 4] }, // Sun-Thu
    targetTime: '17:30',
    color: 'rose',
    icon: 'Dumbbell',
    createdAt: formatISO(thirtyDaysAgo),
    reminders: ['17:00'],
    logs: generatePastLogs(0.7, 50),
  },
  {
    id: 'habit-planning',
    name: 'תכנון משימות בוקר',
    description: 'מיקוד 3 משימות מפתח בתחילת יום העבודה',
    category: 'productivity',
    type: 'boolean',
    frequency: { type: 'daily' },
    targetTime: '08:30',
    color: 'sky',
    icon: 'Sparkles',
    createdAt: formatISO(thirtyDaysAgo),
    reminders: ['08:30'],
    logs: generatePastLogs(0.9),
  },
  {
    id: 'habit-sleep',
    name: 'שינה לפני 23:00',
    description: 'כיבוי מסכים והליכה לישון בזמן לשמירה על חיוניות',
    category: 'health',
    type: 'boolean',
    frequency: { type: 'daily' },
    targetTime: '22:30',
    color: 'indigo',
    icon: 'Moon',
    createdAt: formatISO(thirtyDaysAgo),
    reminders: ['22:15'],
    logs: generatePastLogs(0.65),
  },
];
