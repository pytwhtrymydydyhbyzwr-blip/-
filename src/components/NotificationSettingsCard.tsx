import React, { useState } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Send, Clock, Sparkles, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Habit } from '../types';
import { NotificationPermissionStatus } from '../utils/notifications';
import { HabitIcon, HABIT_COLORS_MAP } from './HabitIcon';

interface NotificationSettingsCardProps {
  habits: Habit[];
  remindersEnabled: boolean;
  onToggleRemindersEnabled: (enabled: boolean) => void;
  permissionStatus: NotificationPermissionStatus;
  onRequestPermission: () => Promise<NotificationPermissionStatus>;
  onTestSystemNotification: () => Promise<{ success: boolean; message: string }>;
  onTestHabitReminder: (habit: Habit) => void;
  onOpenEditHabit?: (habit: Habit) => void;
}

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({
  habits,
  remindersEnabled,
  onToggleRemindersEnabled,
  permissionStatus,
  onRequestPermission,
  onTestSystemNotification,
  onTestHabitReminder,
  onOpenEditHabit,
}) => {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestSystem = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestSystemNotification();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'שגיאה בשליחת התראה.' });
    } finally {
      setIsTesting(false);
    }
  };

  const scheduledHabits = habits.filter(
    (h) => !h.archived && (h.targetTime || (h.reminders && h.reminders.length > 0))
  );

  return (
    <div className="bento-box space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-[#2a221a]/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#ffdf3e] border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] flex items-center justify-center text-[#2a221a]">
            <Bell className="w-6 h-6 fill-[#2a221a]" />
          </div>
          <div>
            <span className="label-neo mb-1">NOTIFICATIONS</span>
            <h3 className="font-extrabold text-base text-[#2a221a]">מערכת תזכורות והתראות דפדפן (Notification API)</h3>
            <p className="text-xs font-bold text-slate-600">
              קבל התראות בזמן אמת מהדפדפן בשעת היעד שהגדרת לכל הרגל
            </p>
          </div>
        </div>

        {/* Global Reminders Toggle Switch */}
        <button
          onClick={() => onToggleRemindersEnabled(!remindersEnabled)}
          className={`w-14 h-8 rounded-full transition-colors relative border-2 border-[#2a221a] p-1 shadow-[2px_2px_0px_#2a221a] ${
            remindersEnabled ? 'bg-[#ffdf3e]' : 'bg-[#fffbf2]'
          }`}
          title={remindersEnabled ? 'תזכורות פועלות' : 'תזכורות מושתקות'}
        >
          <div
            className={`w-5 h-5 rounded-full bg-[#2a221a] transition-transform flex items-center justify-center ${
              remindersEnabled ? 'translate-x-0' : '-translate-x-6'
            }`}
          >
            {remindersEnabled ? (
              <Bell className="w-3.5 h-3.5 text-[#ffdf3e] fill-[#ffdf3e]" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-white" />
            )}
          </div>
        </button>
      </div>

      {/* Permission Status Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3.5 rounded-xl border-2 border-[#2a221a] bg-[#fffbf2] shadow-[2px_2px_0px_#2a221a] text-xs font-bold gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            {permissionStatus === 'granted' && (
              <div className="flex items-center gap-2 text-[#2a221a] bg-[#ffdf3e] px-3 py-1 rounded-lg border-2 border-[#2a221a] font-extrabold">
                <CheckCircle2 className="w-4 h-4 text-[#2a221a]" />
                <span>הרשאת התראות דפדפן מופעלת ✓</span>
              </div>
            )}

            {permissionStatus === 'default' && (
              <div className="flex items-center gap-2 text-[#2a221a] bg-[#ff8e72] px-3 py-1 rounded-lg border-2 border-[#2a221a] font-extrabold">
                <AlertTriangle className="w-4 h-4 text-[#2a221a]" />
                <span>נדרשת הרשאת התראות בדפדפן</span>
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 font-extrabold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>התראות חסומות בדפדפן (יש לאשר בהגדרות הכתובת)</span>
              </div>
            )}

            {permissionStatus === 'unsupported' && (
              <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <span>Notification API אינו נתמך בדפדפן זה</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
              <button
                onClick={onRequestPermission}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-900/20 transition active:scale-95"
              >
                אשר התראות דפדפן
              </button>
            )}

            <button
              onClick={handleTestSystem}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTesting ? 'שולח...' : 'שלח התראת בדיקה'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Message feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{testResult.message}</span>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Scheduled Habits List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>תזכורות מתוזמנות להרגלים ({scheduledHabits.length})</span>
          </h4>
        </div>

        {scheduledHabits.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">אין הרגלים עם שעת תזכורת מוגדרת כרגע</p>
            <p className="text-[11px] text-slate-400 mt-1">
              בעת יצירת או עריכת הרגל, תוכל להגדיר שעת תזכורת יומית מדויקת.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scheduledHabits.map((habit) => {
              const colorTheme = HABIT_COLORS_MAP[habit.color] || HABIT_COLORS_MAP.emerald;
              const times = [
                ...(habit.targetTime ? [habit.targetTime] : []),
                ...(habit.reminders || []).filter((r) => r !== habit.targetTime),
              ];

              return (
                <div
                  key={habit.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorTheme.bgSoft} ${colorTheme.text}`}
                    >
                      <HabitIcon name={habit.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-slate-800 truncate">{habit.name}</h5>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {times.map((t) => (
                          <span
                            key={t}
                            className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{t}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onTestHabitReminder(habit)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition flex items-center gap-1"
                      title="בדוק התראה עכשיו"
                    >
                      <Send className="w-3 h-3 text-amber-500" />
                      <span>בדוק</span>
                    </button>

                    {onOpenEditHabit && (
                      <button
                        onClick={() => onOpenEditHabit(habit)}
                        className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="ערוך תזכורת"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
