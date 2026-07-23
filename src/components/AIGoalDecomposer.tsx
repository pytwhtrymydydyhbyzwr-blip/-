import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Plus, CheckCircle2, Target, Loader2, Lightbulb, Zap, X } from 'lucide-react';
import { Habit } from '../types';

interface AIGoalDecomposerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabits: (habits: Omit<Habit, 'id' | 'createdDate' | 'logs'>[]) => void;
}

interface GeneratedHabitItem {
  name: string;
  category: any;
  targetValue: number;
  unit: string;
  frequency: 'daily';
  icon: string;
  color: string;
  tip: string;
  selected?: boolean;
}

export const AIGoalDecomposer: React.FC<AIGoalDecomposerProps> = ({ isOpen, onClose, onAddHabits }) => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedHabitItem[]>([]);

  if (!isOpen) return null;

  const handleDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/ai/breakdown-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      });

      if (!res.ok) {
        throw new Error('שגיאה בתקשורת עם שרת ה-AI');
      }

      const data = await res.json();
      if (data.habits && Array.isArray(data.habits)) {
        setResults(data.habits.map((h: any) => ({ ...h, selected: true })));
      } else {
        throw new Error('לא התקבל פירוק הרגלים תקין');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'אירעה שגיאה בפירוק היעד');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setResults((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleConfirmAdd = () => {
    const selectedHabits = results
      .filter((r) => r.selected)
      .map((r) => ({
        name: r.name,
        category: r.category || 'productivity',
        type: r.targetValue && r.targetValue > 1 ? ('numeric' as const) : ('boolean' as const),
        targetValue: r.targetValue || 1,
        unit: r.unit || 'פעמים',
        frequency: { type: 'daily' as const },
        reminderTime: '08:00',
        icon: r.icon || 'sparkles',
        color: r.color || 'indigo',
        archived: false,
      }));

    if (selectedHabits.length > 0) {
      onAddHabits(selectedHabits);
      onClose();
      setGoal('');
      setResults([]);
    }
  };

  const PRESET_GOALS = [
    'אני רוצה לרוץ 10 קילומטר',
    'רוצה ללמוד אנגלית ברמה גבוהה',
    'רוצה לשפר את הבריאות והאנרגיה',
    'רוצה להקים עסק קטן מהבית',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/30 text-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-300/30">
                  AI Smart Goal Assistant
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1">פירוק יעד מורכב להרגלים יומיים</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                הכנס יעד גדול וה-AI יבנה עבורך תוכנית הרגלים יומיים נגישה
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Input Form */}
          <form onSubmit={handleDecompose} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">מה היעד או החלום שברצונך להשיג?</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="למשל: לרוץ מרתון, ללמוד ספרדית, לשמור על תזונה בריאה..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={loading || !goal.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>{loading ? 'מפרק יעד...' : 'פרק להרגלים'}</span>
              </button>
            </div>

            {/* Presets */}
            {results.length === 0 && !loading && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">או בחר יעד לדוגמה:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_GOALS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGoal(preset)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-bold rounded-xl transition border border-slate-200/60"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && !loading && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>נמצאו {results.length} הרגלים יומיים מומלצים:</span>
                </h3>
                <span className="text-[11px] font-bold text-indigo-600">
                  נבחרו {results.filter((r) => r.selected).length} מתוך {results.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                      item.selected
                        ? 'bg-indigo-50/50 border-indigo-300 shadow-sm'
                        : 'bg-slate-50 border-slate-200/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 transition shrink-0 ${
                        item.selected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {item.selected && <CheckCircle2 className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{item.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                          {item.targetValue} {item.unit} ביום
                        </span>
                      </div>

                      {item.tip && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mt-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="italic">{item.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleConfirmAdd}
                  disabled={results.filter((r) => r.selected).length === 0}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-200 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>הוסף {results.filter((r) => r.selected).length} הרגלים לרשימה שלי</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
