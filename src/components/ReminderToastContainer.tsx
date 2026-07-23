import React from 'react';
import { Bell, Check, X, Clock, Sparkles } from 'lucide-react';
import { ActiveReminderToast } from '../hooks/useReminderScheduler';
import { HabitIcon, HABIT_COLORS_MAP } from './HabitIcon';

interface ReminderToastContainerProps {
  toasts: ActiveReminderToast[];
  onDismiss: (toastId: string) => void;
  onComplete: (toastId: string, habitId: string) => void;
}

export const ReminderToastContainer: React.FC<ReminderToastContainerProps> = ({
  toasts,
  onDismiss,
  onComplete,
}) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const colorTheme = HABIT_COLORS_MAP[toast.habit.color] || HABIT_COLORS_MAP.emerald;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-5 duration-300 flex flex-col gap-3"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${colorTheme.bgSoft} ${colorTheme.text}`}
                >
                  <HabitIcon name={toast.habit.icon} className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-extrabold">
                    <Bell className="w-3.5 h-3.5 fill-amber-400" />
                    <span>תזכורת להרגל ({toast.time})</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white mt-0.5">{toast.habit.name}</h4>
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="סגור תזכורת"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Habit description or call to action */}
            {toast.habit.description && (
              <p className="text-xs text-slate-300 font-medium px-1">
                {toast.habit.description}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={() => onComplete(toast.id, toast.habit.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>סמן כבוצע עכשיו!</span>
              </button>

              <button
                onClick={() => onDismiss(toast.id)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                אחר כך
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
