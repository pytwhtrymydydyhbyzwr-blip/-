import { useEffect, useState, useCallback, useRef } from 'react';
import { Habit } from '../types';
import { formatISO } from '../utils/date';
import { isHabitCompletedOnDate } from '../utils/streak';
import { soundFX } from '../utils/audio';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  getStoredRemindersEnabled,
  setStoredRemindersEnabled,
  getFiredRemindersToday,
  markReminderFiredToday,
  NotificationPermissionStatus,
  sendTestNotification,
} from '../utils/notifications';

export interface ActiveReminderToast {
  id: string;
  habit: Habit;
  time: string;
  timestamp: string;
}

export function useReminderScheduler(
  habits: Habit[],
  onToggleLog: (habitId: string, dateStr: string, forcedCompleted?: boolean, valueOverride?: number) => void
) {
  const [remindersEnabled, setRemindersEnabledState] = useState<boolean>(getStoredRemindersEnabled());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(getNotificationPermission());
  const [activeToasts, setActiveToasts] = useState<ActiveReminderToast[]>([]);

  // Ref to track latest habits inside interval
  const habitsRef = useRef<Habit[]>(habits);
  habitsRef.current = habits;

  const toggleRemindersEnabled = useCallback((enabled: boolean) => {
    setRemindersEnabledState(enabled);
    setStoredRemindersEnabled(enabled);
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
    return status;
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const completeHabitFromToast = useCallback((toastId: string, habitId: string) => {
    const todayStr = formatISO(new Date());
    soundFX.playCompleteSound();
    onToggleLog(habitId, todayStr, true);
    dismissToast(toastId);
  }, [onToggleLog, dismissToast]);

  const testHabitReminder = useCallback((habit: Habit) => {
    const timeStr = habit.targetTime || habit.reminders?.[0] || '12:00';
    const toastId = `test-${habit.id}-${Date.now()}`;
    
    // Play sound
    soundFX.playCompleteSound();

    // Fire browser notification
    sendBrowserNotification(`⏰ תזכורת להרגל: ${habit.name}`, {
      body: `זמן מוגדר: ${timeStr} | הגיע הזמן לפעול ולהתקדם ביעד היומי שלך! ✨`,
      tag: `habit-${habit.id}-test`,
    });

    // Add toast to UI
    setActiveToasts((prev) => [
      ...prev,
      {
        id: toastId,
        habit,
        time: timeStr,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const testSystemNotification = useCallback(async () => {
    const res = await sendTestNotification();
    setPermissionStatus(getNotificationPermission());
    return res;
  }, []);

  // Check loop
  useEffect(() => {
    if (!remindersEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const todayStr = formatISO(now);
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const firedSet = getFiredRemindersToday(todayStr);

      habitsRef.current.forEach((habit) => {
        if (habit.archived) return;

        // Collect all reminder times
        const reminderTimes: string[] = [];
        if (habit.targetTime) reminderTimes.push(habit.targetTime);
        if (habit.reminders && Array.isArray(habit.reminders)) {
          habit.reminders.forEach((r) => {
            if (r && !reminderTimes.includes(r)) reminderTimes.push(r);
          });
        }

        if (reminderTimes.length === 0) return;

        reminderTimes.forEach((timeStr) => {
          if (timeStr === currentHHMM) {
            const reminderKey = `${habit.id}_${timeStr}`;

            // Check if already fired today
            if (firedSet.has(reminderKey)) return;

            // Check if habit is already completed today
            const isCompleted = isHabitCompletedOnDate(habit, todayStr);
            if (isCompleted) {
              // Mark fired so we don't bother checking again today
              markReminderFiredToday(todayStr, reminderKey);
              return;
            }

            // Fire reminder!
            markReminderFiredToday(todayStr, reminderKey);

            // Play sound
            try {
              soundFX.playCompleteSound();
            } catch (e) {
              console.warn('Audio playback prevented:', e);
            }

            // Browser notification
            sendBrowserNotification(`⏰ תזכורת להרגל: ${habit.name}`, {
              body: `הגיע הזמן להשלים את "${habit.name}" (${timeStr})! לחץ לסמן כבוצע 🔥`,
              tag: `habit-reminder-${habit.id}-${todayStr}-${timeStr}`,
            });

            // Add in-app toast
            const toastId = `reminder-${habit.id}-${Date.now()}`;
            setActiveToasts((prev) => [
              ...prev,
              {
                id: toastId,
                habit,
                time: timeStr,
                timestamp: currentHHMM,
              },
            ]);
          }
        });
      });
    };

    // Run check immediately on mount/update
    checkReminders();

    // Check every 20 seconds
    const interval = setInterval(checkReminders, 20000);
    return () => clearInterval(interval);
  }, [remindersEnabled]);

  return {
    remindersEnabled,
    toggleRemindersEnabled,
    permissionStatus,
    handleRequestPermission,
    activeToasts,
    dismissToast,
    completeHabitFromToast,
    testHabitReminder,
    testSystemNotification,
  };
}
