import React, { useState } from 'react';
import { X, Flame, Award, Calendar as CalendarIcon, CheckCircle2, MessageSquare, Edit3, Trash2, Save, Sparkles, ChevronRight, ChevronLeft, Mic } from 'lucide-react';
import { Habit } from '../types';
import { calculateHabitStreaks, isHabitCompletedOnDate } from '../utils/streak';
import { formatISO, getHebrewFormattedDate, parseISO, HEBREW_MONTHS } from '../utils/date';
import { HabitIcon, HABIT_COLORS_MAP } from './HabitIcon';
import { AudioRecorder } from './AudioRecorder';

interface HabitDetailModalProps {
  habit: Habit;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onToggleLogDate: (
    habitId: string,
    dateStr: string,
    forcedCompleted?: boolean,
    valueOverride?: number,
    notes?: string,
    audioUrl?: string,
    audioDuration?: number
  ) => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  onClose,
  onEdit,
  onDelete,
  onToggleLogDate,
}) => {
  const [selectedDayForNote, setSelectedDayForNote] = useState<string>(formatISO(new Date()));
  const [noteText, setNoteText] = useState<string>(habit.logs[selectedDayForNote]?.notes || '');
  const [audioUrl, setAudioUrl] = useState<string | undefined>(habit.logs[selectedDayForNote]?.audioUrl);
  const [audioDuration, setAudioDuration] = useState<number>(habit.logs[selectedDayForNote]?.audioDuration || 0);

  const [currentYearMonth, setCurrentYearMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const streakInfo = calculateHabitStreaks(habit);
  const colorTheme = HABIT_COLORS_MAP[habit.color] || HABIT_COLORS_MAP.emerald;

  // Generate calendar matrix for month view
  const generateMonthDays = () => {
    const { year, month } = currentYearMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Pad start of month
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ dateStr: formatISO(d), dayNum: d.getDate(), isCurrentMonth: false });
    }

    // Days in current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ dateStr: formatISO(d), dayNum: i, isCurrentMonth: true });
    }

    return days;
  };

  const days = generateMonthDays();

  const handleSelectDay = (dateStr: string) => {
    setSelectedDayForNote(dateStr);
    const log = habit.logs[dateStr];
    setNoteText(log?.notes || '');
    setAudioUrl(log?.audioUrl);
    setAudioDuration(log?.audioDuration || 0);
  };

  const handleSaveNote = () => {
    const existingLog = habit.logs[selectedDayForNote];
    onToggleLogDate(
      habit.id,
      selectedDayForNote,
      existingLog?.completed,
      existingLog?.value,
      noteText,
      audioUrl,
      audioDuration
    );
  };

  const handleToggleDayCompletion = (dateStr: string) => {
    const isComp = isHabitCompletedOnDate(habit, dateStr);
    onToggleLogDate(habit.id, dateStr, !isComp);
  };

  const handlePrevMonth = () => {
    setCurrentYearMonth((prev) => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      return { year: y, month: m };
    });
  };

  const handleNextMonth = () => {
    setCurrentYearMonth((prev) => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      return { year: y, month: m };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-[32px] max-w-2xl w-full p-6 sm:p-8 text-slate-800 shadow-2xl relative my-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorTheme.bgSoft} ${colorTheme.border} ${colorTheme.text}`}>
              <HabitIcon name={habit.icon} className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">{habit.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{habit.description || 'ללא תיאור מוגדר'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(habit)}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="ערוך הרגל"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('האם אתה בטוח שברצונך למחוק הרגל זה?')) {
                  onDelete(habit.id);
                  onClose();
                }
              }}
              className="p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
              title="מחק הרגל"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center">
            <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1 fill-amber-500/20" />
            <div className="text-xl font-black text-slate-800">{streakInfo.currentStreak} ימים</div>
            <div className="text-[11px] text-slate-500 font-bold">רצף נוכחי</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center">
            <Award className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
            <div className="text-xl font-black text-slate-800">{streakInfo.bestStreak} ימים</div>
            <div className="text-[11px] text-slate-500 font-bold">רצף שיא</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <div className="text-xl font-black text-slate-800">{streakInfo.totalCompleted}</div>
            <div className="text-[11px] text-slate-500 font-bold">סך הכל ביצועים</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center">
            <Sparkles className="w-5 h-5 text-sky-500 mx-auto mb-1" />
            <div className="text-xl font-black text-slate-800">{streakInfo.completionRate}%</div>
            <div className="text-[11px] text-slate-500 font-bold">אחוז הצלחה</div>
          </div>
        </div>

        {/* Heatmap Calendar Section */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                לוח התמדה חודשי ({HEBREW_MONTHS[currentYearMonth.month]} {currentYearMonth.year})
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2">
            <span>א'</span><span>ב'</span><span>ג'</span><span>ד'</span><span>ה'</span><span>ו'</span><span>ש'</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const isCompleted = isHabitCompletedOnDate(habit, d.dateStr);
              const isSelected = d.dateStr === selectedDayForNote;
              const hasNotes = !!habit.logs[d.dateStr]?.notes;

              return (
                <button
                  key={d.dateStr}
                  onClick={() => handleSelectDay(d.dateStr)}
                  onDoubleClick={() => handleToggleDayCompletion(d.dateStr)}
                  className={`relative aspect-square rounded-2xl p-1 flex flex-col items-center justify-center transition border text-xs font-bold ${
                    !d.isCurrentMonth
                      ? 'opacity-30 border-transparent text-slate-300'
                      : isCompleted
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                  title={`${d.dateStr} - לחיצה רגילה לצפייה בהערות, לחיצה כפולה לשינוי סטטוס`}
                >
                  <span>{d.dayNum}</span>
                  {hasNotes && <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-amber-300' : 'bg-amber-500'}`} />}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 font-medium mt-3 text-center">
            💡 לחיצה כפולה על יום כדי לסמן ביצוע רטרואקטיבי
          </p>
        </div>

        {/* Daily Note Section */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                יומן והערות עבור {getHebrewFormattedDate(parseISO(selectedDayForNote))}
              </h3>
            </div>

            <button
              onClick={() => handleToggleDayCompletion(selectedDayForNote)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                isHabitCompletedOnDate(habit, selectedDayForNote)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isHabitCompletedOnDate(habit, selectedDayForNote) ? 'בוצע ✓' : 'לא בוצע'}
            </button>
          </div>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="רשום הערה יומית... (למשל: הרגשה אישית, אתגרים או טיפים)"
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
          />

          {/* Voice Audio Note Recorder */}
          <AudioRecorder
            existingAudioUrl={audioUrl}
            onSaveAudio={(url, duration) => {
              setAudioUrl(url);
              setAudioDuration(duration);
            }}
          />

          <div className="flex justify-end mt-2">
            <button
              onClick={handleSaveNote}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>שמור הערה והקלטה</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
