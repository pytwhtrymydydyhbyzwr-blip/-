import { Habit, HabitLog } from '../types';
import { INITIAL_HABITS } from '../data/initialHabits';

const STORAGE_KEY_HABITS = 'habit_tracker_habits_v2';
const STORAGE_KEY_PRO = 'habit_tracker_is_pro_v2';
const STORAGE_KEY_THEME = 'habit_tracker_theme_v2';
const STORAGE_KEY_SOUND = 'habit_tracker_sound_v2';

export function loadHabits(): Habit[] {
  if (typeof window === 'undefined') return INITIAL_HABITS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HABITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(INITIAL_HABITS));
      return INITIAL_HABITS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load habits from storage', err);
    return INITIAL_HABITS;
  }
}

export function saveHabits(habits: Habit[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to storage', err);
  }
}

export function loadProStatus(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(STORAGE_KEY_PRO);
    return val !== null ? JSON.parse(val) : false;
  } catch {
    return false;
  }
}

export function saveProStatus(isPro: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PRO, JSON.stringify(isPro));
}

export function loadSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY_SOUND);
    return val !== null ? JSON.parse(val) : true;
  } catch {
    return true;
  }
}

export function saveSoundPreference(soundEnabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(soundEnabled));
}

export function toggleHabitLog(
  habits: Habit[],
  habitId: string,
  dateStr: string,
  forcedCompleted?: boolean,
  valueOverride?: number,
  notesOverride?: string,
  audioUrlOverride?: string,
  audioDurationOverride?: number
): { updatedHabits: Habit[]; isNowCompleted: boolean } {
  let isNowCompleted = false;

  const updatedHabits = habits.map((h) => {
    if (h.id !== habitId) return h;

    const existingLog: HabitLog = h.logs[dateStr] || {
      date: dateStr,
      completed: false,
      value: 0,
    };

    let newCompleted = false;
    let newValue = existingLog.value || 0;

    if (h.type === 'boolean') {
      newCompleted = forcedCompleted !== undefined ? forcedCompleted : !existingLog.completed;
    } else if (h.type === 'numeric' || h.type === 'timer') {
      if (valueOverride !== undefined) {
        newValue = valueOverride;
        const target = h.targetValue ?? 1;
        newCompleted = newValue >= target;
      } else if (forcedCompleted !== undefined) {
        newCompleted = forcedCompleted;
        newValue = newCompleted ? (h.targetValue ?? 1) : 0;
      } else {
        // Toggle full completion
        const target = h.targetValue ?? 1;
        if (existingLog.completed) {
          newCompleted = false;
          newValue = 0;
        } else {
          newCompleted = true;
          newValue = target;
        }
      }
    }

    isNowCompleted = newCompleted;

    const logEntry: HabitLog = {
      date: dateStr,
      completed: newCompleted,
      value: newValue,
    };

    const notesVal = notesOverride !== undefined ? notesOverride : existingLog.notes;
    if (notesVal) logEntry.notes = notesVal;

    const audioUrlVal = audioUrlOverride !== undefined ? audioUrlOverride : existingLog.audioUrl;
    if (audioUrlVal) logEntry.audioUrl = audioUrlVal;

    const audioDurationVal = audioDurationOverride !== undefined ? audioDurationOverride : existingLog.audioDuration;
    if (audioDurationVal !== undefined && audioDurationVal !== null) logEntry.audioDuration = audioDurationVal;

    if (newCompleted) {
      logEntry.completedAt = existingLog.completedAt || new Date().toISOString();
    }

    const newLogs = {
      ...h.logs,
      [dateStr]: logEntry,
    };

    return { ...h, logs: newLogs };
  });

  saveHabits(updatedHabits);
  return { updatedHabits, isNowCompleted };
}

export function exportBackupJSON(habits: Habit[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(habits, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `habit_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportCSV(habits: Habit[]) {
  let csv = 'ID,Name,Category,Type,Date,Completed,Value,Notes\n';
  habits.forEach((h) => {
    Object.entries(h.logs).forEach(([dateStr, log]) => {
      csv += `"${h.id}","${h.name}","${h.category}","${h.type}","${dateStr}",${log.completed ? 'YES' : 'NO'},"${log.value || ''}","${(log.notes || '').replace(/"/g, '""')}"\n`;
    });
  });

  const encodedUri = encodeURI('data:text/csv;charset=utf-8,\uFEFF' + csv);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `habit_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
