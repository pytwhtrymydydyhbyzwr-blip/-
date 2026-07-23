import React from 'react';
import { ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { Habit } from '../types';
import { formatISO, getHebrewDayName, getRelativeDateLabel, parseISO } from '../utils/date';
import { isHabitCompletedOnDate, isHabitScheduledForDate } from '../utils/streak';

interface DateStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  habits: Habit[];
}

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onSelectDate, habits }) => {
  const todayStr = formatISO(new Date());

  // Generate 21 days range centered around today or selected date
  const generateDates = () => {
    const selected = parseISO(selectedDate);
    const dates: string[] = [];
    for (let i = -10; i <= 7; i++) {
      const d = new Date(selected);
      d.setDate(d.getDate() + i);
      dates.push(formatISO(d));
    }
    return dates;
  };

  const dates = generateDates();

  const getDayCompletionRate = (dateStr: string) => {
    const scheduled = habits.filter((h) => !h.archived && isHabitScheduledForDate(h, dateStr));
    if (scheduled.length === 0) return 0;
    const completed = scheduled.filter((h) => isHabitCompletedOnDate(h, dateStr));
    return Math.round((completed.length / scheduled.length) * 100);
  };

  const handlePrevDay = () => {
    const d = parseISO(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(formatISO(d));
  };

  const handleNextDay = () => {
    const d = parseISO(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(formatISO(d));
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-3 px-4 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-2xs cursor-pointer"
            title="יום קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-2xs cursor-pointer"
            title="יום הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {selectedDate !== todayStr && (
            <button
              onClick={() => onSelectDate(todayStr)}
              className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>היום</span>
            </button>
          )}
        </div>

        {/* Selected Date Label */}
        <div className="font-gaegu text-2xl sm:text-3xl font-bold text-slate-800">
          {getRelativeDateLabel(selectedDate)}
        </div>

        {/* Date Strip Cards */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {dates.map((dateStr) => {
            const dateObj = parseISO(dateStr);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            const rate = getDayCompletionRate(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`flex flex-col items-center justify-center min-w-[50px] py-2 px-2.5 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-200 scale-105'
                    : isToday
                    ? 'bg-amber-100 border border-amber-300 text-amber-900 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                }`}
              >
                <span className={`font-mono-code text-[9px] uppercase tracking-wide font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {getHebrewDayName(dateObj, true)}
                </span>
                <span className="font-mono-code text-sm font-black mt-0.5">
                  {dateObj.getDate()}
                </span>

                {/* Completion Indicator Dot */}
                <div className="mt-1 flex items-center justify-center">
                  {rate === 100 ? (
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-emerald-500'}`} />
                  ) : rate > 0 ? (
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
