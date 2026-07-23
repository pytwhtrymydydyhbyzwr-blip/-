import React from 'react';
import { Check, Flame, Plus, Play, Clock, ChevronLeft, MessageSquare, Mic, Bell } from 'lucide-react';
import { Habit } from '../types';
import { HabitIcon, HABIT_COLORS_MAP } from './HabitIcon';
import { calculateHabitStreaks, isHabitCompletedOnDate } from '../utils/streak';
import { soundFX } from '../utils/audio';
import confetti from 'canvas-confetti';

interface HabitCardProps {
  habit: Habit;
  selectedDate: string;
  onToggleLog: (habitId: string, dateStr: string, forcedCompleted?: boolean, valueOverride?: number) => void;
  onOpenDetail: (habit: Habit) => void;
  onOpenTimer: (habit: Habit) => void;
  onOpenNumericModal: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  selectedDate,
  onToggleLog,
  onOpenDetail,
  onOpenTimer,
  onOpenNumericModal,
}) => {
  const streakInfo = calculateHabitStreaks(habit, selectedDate);
  const isCompleted = isHabitCompletedOnDate(habit, selectedDate);
  const log = habit.logs[selectedDate];
  const currentValue = log?.value ?? 0;
  const targetValue = habit.targetValue ?? 1;

  const colorTheme = HABIT_COLORS_MAP[habit.color] || HABIT_COLORS_MAP.emerald;

  const handleToggleCheckmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isCompleted) {
      soundFX.playCompleteSound();
      // Trigger subtle confetti burst from click position
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 25,
        spread: 45,
        origin: { x, y },
        colors: ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b'],
      });

      onToggleLog(habit.id, selectedDate, true);
    } else {
      soundFX.playUncheckSound();
      onToggleLog(habit.id, selectedDate, false);
    }
  };

  const handleQuickAddNumeric = (e: React.MouseEvent) => {
    e.stopPropagation();
    const step = habit.unit === 'מ"ל' ? 250 : habit.unit === 'חזרות' ? 10 : 1;
    const newValue = currentValue + step;

    if (newValue >= targetValue && currentValue < targetValue) {
      soundFX.playCompleteSound();
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
      });
    }

    onToggleLog(habit.id, selectedDate, undefined, newValue);
  };

  return (
    <div
      onClick={() => onOpenDetail(habit)}
      className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-200 border-2 border-[#2a221a] cursor-pointer shadow-[3px_3px_0px_#2a221a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#2a221a] ${
        isCompleted
          ? 'bg-[#ffdf3e] text-[#2a221a]'
          : 'bg-[#fffbf2] text-[#2a221a]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        
        {/* Habit Info & Icon */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Checkmark box in neo-bento style */}
          <button
            onClick={handleToggleCheckmark}
            className={`w-8 h-8 rounded-lg border-2 border-[#2a221a] flex items-center justify-center font-extrabold text-sm transition-transform shrink-0 ${
              isCompleted
                ? 'bg-[#2a221a] text-[#ffdf3e]'
                : 'bg-white text-transparent hover:border-[#2a221a]'
            }`}
          >
            ✓
          </button>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg truncate text-[#2a221a]">
                {habit.name}
              </h3>

              {/* Target Time & Reminders if set */}
              {(habit.targetTime || (habit.reminders && habit.reminders.length > 0)) && (
                <span
                  className="label-neo text-[10px] py-0 px-2"
                  title={`תזכורת יומית ב-${habit.targetTime || habit.reminders?.[0]}`}
                >
                  <Bell className="w-3 h-3 inline ml-1 fill-[#ffdf3e] text-[#ffdf3e]" />
                  <span>{habit.targetTime || habit.reminders?.[0]}</span>
                </span>
              )}
            </div>

            {/* Streak & Notes */}
            <div className="flex items-center gap-3 mt-1 text-xs">
              <div className="flex items-center gap-1 font-bold text-[#2a221a]">
                <Flame className="w-3.5 h-3.5 fill-[#2a221a] text-[#2a221a]" />
                <span className="font-mono-code text-[11px]">{streakInfo.currentStreak} ימי רצף</span>
              </div>

              {log?.notes && (
                <div className="flex items-center gap-1 truncate max-w-[150px] text-slate-700">
                  <MessageSquare className="w-3 h-3 opacity-80" />
                  <span className="truncate">{log.notes}</span>
                </div>
              )}

              {log?.audioUrl && (
                <div
                  className="label-neo text-[9px] py-0 px-1.5 bg-[#ff8e72] text-[#2a221a]"
                  title="הודעה קולית מוקלטת"
                >
                  <Mic className="w-3 h-3 inline" />
                  <span>קול</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls depending on habit type */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Numeric Type */}
          {habit.type === 'numeric' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickAddNumeric}
                className="btn-fancy py-1 px-2.5 text-xs bg-white text-[#2a221a]"
                title={`הוסף עוד`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{habit.unit === 'מ"ל' ? '250' : habit.unit === 'חזרות' ? '10' : '1'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNumericModal(habit);
                }}
                className="font-mono-code text-xs font-bold px-2.5 py-1 bg-[#2a221a] text-[#fffbf2] rounded-lg border border-[#2a221a]"
              >
                <span>{currentValue} / {targetValue} {habit.unit}</span>
              </button>
            </div>
          )}

          {/* Timer Type */}
          {habit.type === 'timer' && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTimer(habit);
                }}
                className="btn-fancy py-1 px-3 text-xs bg-[#2a221a] text-[#ffdf3e]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono-code">
                  {Math.floor(currentValue / 60)} / {Math.floor(targetValue / 60)} דק'
                </span>
              </button>
            </div>
          )}

          <ChevronLeft className="w-4 h-4 text-[#2a221a] hidden sm:block" />
        </div>

      </div>

      {/* Progress Bar for Numeric / Timer Types */}
      {(habit.type === 'numeric' || habit.type === 'timer') && (
        <div className="mt-3 pt-2 border-t-2 border-[#2a221a]/20 flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full border border-[#2a221a] bg-white overflow-hidden">
            <div
              className="h-full bg-[#2a221a] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((currentValue / targetValue) * 100))}%` }}
            />
          </div>
          <span className="font-mono-code text-xs font-bold text-[#2a221a]">
            {Math.min(100, Math.round((currentValue / targetValue) * 100))}%
          </span>
        </div>
      )}
    </div>
  );
};
