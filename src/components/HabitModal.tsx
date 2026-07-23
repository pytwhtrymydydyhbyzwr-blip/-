import React, { useState } from 'react';
import { X, Check, Clock, Sparkles, Bell, Plus, Trash2, Send, AlertTriangle } from 'lucide-react';
import { Habit, HabitCategory, HabitType, DaysOfWeek } from '../types';
import { HABIT_ICONS_LIST, HABIT_COLORS_MAP, HabitIcon } from './HabitIcon';
import { formatISO } from '../utils/date';
import { getNotificationPermission, requestNotificationPermission, sendBrowserNotification } from '../utils/notifications';

interface HabitModalProps {
  habitToEdit?: Habit | null;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  isPro: boolean;
}

const CATEGORIES: { id: HabitCategory; label: string }[] = [
  { id: 'health', label: 'בריאות ותזונה' },
  { id: 'fitness', label: 'כושר וספורט' },
  { id: 'mindset', label: 'מיינדסט ומדיטציה' },
  { id: 'productivity', label: 'פרודוקטיביות' },
  { id: 'learning', label: 'למידה וספרים' },
  { id: 'personal', label: 'אישי ואיכות חיים' },
];

const DAYS_NAME = [
  { id: 0, label: 'א\'' },
  { id: 1, label: 'ב\'' },
  { id: 2, label: 'ג\'' },
  { id: 3, label: 'ד\'' },
  { id: 4, label: 'ה\'' },
  { id: 5, label: 'ו\'' },
  { id: 6, label: 'ש\'' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  habitToEdit,
  onClose,
  onSave,
  isPro,
}) => {
  const [name, setName] = useState<string>(habitToEdit?.name || '');
  const [description, setDescription] = useState<string>(habitToEdit?.description || '');
  const [category, setCategory] = useState<HabitCategory>(habitToEdit?.category || 'health');
  const [type, setType] = useState<HabitType>(habitToEdit?.type || 'boolean');
  
  // Numeric target
  const [targetValue, setTargetValue] = useState<number>(habitToEdit?.targetValue || (type === 'timer' ? 1200 : 2000));
  const [unit, setUnit] = useState<string>(habitToEdit?.unit || 'מ"ל');

  // Frequency
  const [freqType, setFreqType] = useState<'daily' | 'specific_days' | 'times_per_week'>(habitToEdit?.frequency.type || 'daily');
  const [selectedDays, setSelectedDays] = useState<DaysOfWeek[]>(habitToEdit?.frequency.days || [0, 1, 2, 3, 4]);

  // Target Time & Reminders
  const [reminders, setReminders] = useState<string[]>(
    habitToEdit?.reminders && habitToEdit.reminders.length > 0
      ? habitToEdit.reminders
      : habitToEdit?.targetTime
      ? [habitToEdit.targetTime]
      : ['08:00']
  );
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [testNotifFeedback, setTestNotifFeedback] = useState<string | null>(null);

  // Visuals
  const [color, setColor] = useState<string>(habitToEdit?.color || 'emerald');
  const [icon, setIcon] = useState<string>(habitToEdit?.icon || 'Flame');

  const handleAddReminderTime = () => {
    if (reminders.length >= 4) return;
    setReminders([...reminders, '20:00']);
  };

  const handleRemoveReminderTime = (index: number) => {
    if (reminders.length <= 1) return;
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const handleUpdateReminderTime = (index: number, val: string) => {
    const updated = [...reminders];
    updated[index] = val;
    setReminders(updated);
  };

  const handleRequestNotif = async () => {
    const status = await requestNotificationPermission();
    setNotifPermission(status);
  };

  const handleTestModalNotif = () => {
    const habitName = name.trim() || 'ההרגל שלך';
    const firstTime = reminders[0] || '08:00';
    
    if (notifPermission !== 'granted') {
      handleRequestNotif();
      return;
    }

    const fired = sendBrowserNotification(`⏰ תזכורת בדיקה: ${habitName}`, {
      body: `תזכורת מתוזמנת לשעה ${firstTime}! התראות הדפדפן פועלות כסדרן. ✨`,
      tag: 'habit-modal-test',
    });

    if (fired) {
      setTestNotifFeedback('התראת בדיקה נשלחה כעת לדפדפן!');
      setTimeout(() => setTestNotifFeedback(null), 4000);
    } else {
      setTestNotifFeedback('לא ניתן לשלוח התראה. בדוק את הרשאות הדפדפן.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habit: Habit = {
      id: habitToEdit?.id || `habit-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      type,
      targetValue: type === 'boolean' ? undefined : targetValue,
      unit: type === 'numeric' ? unit : type === 'timer' ? 'שניות' : undefined,
      frequency: {
        type: freqType,
        days: freqType === 'specific_days' ? selectedDays : undefined,
      },
      targetTime: reminders[0] || '08:00',
      color,
      icon,
      createdAt: habitToEdit?.createdAt || formatISO(new Date()),
      logs: habitToEdit?.logs || {},
      reminders: reminders.filter(Boolean),
    };

    onSave(habit);
    onClose();
  };

  const toggleDay = (day: DaysOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/80 rounded-[32px] max-w-lg w-full p-6 text-slate-800 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">
              {habitToEdit ? 'עריכת הרגל' : 'יצירת הרגל חדש'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Habit Name & Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">שם ההרגל *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: שתיית 2 ליטר מים, קריאת ספר..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as HabitCategory)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Habit Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">סוג ההרגל</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('boolean')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition ${
                  type === 'boolean'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                כן / לא
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('numeric');
                  setTargetValue(2000);
                  setUnit('מ"ל');
                }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition ${
                  type === 'numeric'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                כמותי (יעד)
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('timer');
                  setTargetValue(1200); // 20 mins
                }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition ${
                  type === 'timer'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                מבוסס זמן
              </button>
            </div>
          </div>

          {/* Type Specific Fields */}
          {type === 'numeric' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">כמות יעד</label>
                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">יחידת מידה</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder='מ"ל, עמודים, חזרות...'
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800"
                />
              </div>
            </div>
          )}

          {type === 'timer' && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">זמן יעד בדקות</label>
              <input
                type="number"
                min="1"
                value={Math.floor(targetValue / 60)}
                onChange={(e) => setTargetValue(Number(e.target.value) * 60)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800"
              />
            </div>
          )}

          {/* Frequency & Days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">תדירות</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setFreqType('daily')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition ${
                  freqType === 'daily'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                כל יום
              </button>
              <button
                type="button"
                onClick={() => setFreqType('specific_days')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition ${
                  freqType === 'specific_days'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ימים מסוימים בשבוע
              </button>
            </div>

            {freqType === 'specific_days' && (
              <div className="flex items-center justify-between gap-1 mt-2">
                {DAYS_NAME.map((d) => {
                  const isSel = selectedDays.includes(d.id as DaysOfWeek);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id as DaysOfWeek)}
                      className={`w-9 h-9 rounded-2xl font-bold text-xs border transition ${
                        isSel
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Target Time & Reminders */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                <span>זמני תזכורת יומית (Notification API)</span>
              </label>

              {reminders.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddReminderTime}
                  className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-indigo-100 px-2.5 py-1 rounded-xl shadow-2xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הוסף שעה</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {reminders.map((timeVal, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    <input
                      type="time"
                      value={timeVal}
                      onChange={(e) => handleUpdateReminderTime(idx, e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-9 pl-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {reminders.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveReminderTime(idx)}
                      className="p-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                      title="הסר שעת תזכורת"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Notification Permission & Test Controls */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
              {notifPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleRequestNotif}
                  className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>אשר התראות בדפדפן</span>
                </button>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  ✓ התראות מאושרות בדפדפן
                </span>
              )}

              <button
                type="button"
                onClick={handleTestModalNotif}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
              >
                <Send className="w-3 h-3 text-amber-500" />
                <span>בדוק התראה עכשיו</span>
              </button>
            </div>

            {testNotifFeedback && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                {testNotifFeedback}
              </p>
            )}
          </div>

          {/* Colors Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">צבע מייצג</label>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {Object.keys(HABIT_COLORS_MAP).map((cKey) => {
                const isSel = color === cKey;
                const theme = HABIT_COLORS_MAP[cKey];
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setColor(cKey)}
                    className={`w-8 h-8 rounded-full ${theme.bg} transition transform ${
                      isSel ? 'scale-110 ring-4 ring-indigo-200' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">אייקון</label>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {HABIT_ICONS_LIST.map((ic) => {
                const isSel = icon === ic;
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-2 rounded-2xl flex items-center justify-center transition border ${
                      isSel
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'text-slate-500 border-transparent hover:bg-slate-200/60'
                    }`}
                  >
                    <HabitIcon name={ic} className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{habitToEdit ? 'שמור שינויים' : 'צור הרגל חדש'}</span>
          </button>

        </form>

      </div>
    </div>
  );
};
