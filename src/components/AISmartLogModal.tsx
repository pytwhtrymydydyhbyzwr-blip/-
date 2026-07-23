import React, { useState } from 'react';
import { Sparkles, Mic, Send, CheckCircle2, Loader2, MessageSquare, Save, X, RotateCcw } from 'lucide-react';
import { Habit } from '../types';

interface AISmartLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userHabits: Habit[];
  onApplySmartLogs: (updates: { habitId: string; completed: boolean; value: number; notes: string }[]) => void;
}

interface ParsedUpdate {
  habitId: string;
  habitName: string;
  completed: boolean;
  value: number;
  notes: string;
}

export const AISmartLogModal: React.FC<AISmartLogModalProps> = ({
  isOpen,
  onClose,
  userHabits,
  onApplySmartLogs,
}) => {
  const [reportText, setReportText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedUpdates, setParsedUpdates] = useState<ParsedUpdate[]>([]);

  if (!isOpen) return null;

  // Speech Recognition hook fallback if supported
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('זיהוי דיבור בדפדפן אינו נתמך בדפדפן זה. ניתן להקליד טקסט חופשי בשדה.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setReportText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsRecording(false);
    }
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    setLoading(true);
    setError(null);
    setParsedUpdates([]);

    try {
      const habitsPayload = userHabits.map((h) => ({
        id: h.id,
        name: h.name,
        unit: h.unit,
        category: h.category,
        targetValue: h.targetValue,
      }));

      const res = await fetch('/api/ai/parse-smart-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText: reportText.trim(),
          userHabits: habitsPayload,
        }),
      });

      if (!res.ok) {
        throw new Error('שגיאה בתקשורת עם שרת ה-AI');
      }

      const data = await res.json();
      if (data.updates && Array.isArray(data.updates)) {
        setParsedUpdates(data.updates);
      } else {
        throw new Error('לא פוענחו הרגלים מהדיווח');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'אירעה שגיאה בפענוח הדיווח');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (parsedUpdates.length > 0) {
      onApplySmartLogs(parsedUpdates);
      onClose();
      setReportText('');
      setParsedUpdates([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Sparkles className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <span className="bg-emerald-400/30 text-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-300/30">
                AI Natural Language Tracker
              </span>
              <h2 className="text-xl font-bold mt-1">דיווח חופשי / קולי במילים שלך</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                ספר ל-AI מה עשית היום והוא יעדכן אוטומטית את כל ההרגלים שלך
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <form onSubmit={handleParse} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              הקלד או הקלט דיווח יומי בשפה טבעית:
            </label>

            <div className="relative">
              <textarea
                rows={3}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="למשל: היום שתיתי 8 כוסות מים, רצתי 5 קילומטר בבוקר וגם עשיתי 10 דקות מדיטציה..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition resize-none"
              />

              <button
                type="button"
                onClick={handleToggleVoice}
                title="הקלט דיווח קולי"
                className={`absolute left-3 bottom-3.5 p-2 rounded-xl transition ${
                  isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {isRecording && (
              <p className="text-[11px] font-bold text-rose-600 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                מקשיב... דבר עכשיו בבירור בעברית
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={loading || !reportText.trim()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{loading ? 'מפענח דיווח...' : 'פענח ועדכן הרגלים'}</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">מנתח את הדיווח והשוואתו להרגלים שלך...</p>
            </div>
          )}

          {parsedUpdates.length > 0 && !loading && (
            <div className="space-y-4 animate-fade-in border-t border-slate-100 pt-4">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>פוענחו הנתונים הבאים לעדכון להיום:</span>
              </h3>

              <div className="space-y-2">
                {parsedUpdates.map((upd, idx) => (
                  <div key={idx} className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">{upd.habitName}</span>
                      {upd.notes && <p className="text-[11px] font-medium text-slate-600 mt-0.5">"{upd.notes}"</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                        {upd.completed ? 'בוצע' : 'בתהליך'} • כמות: {upd.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-200 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>אשר ועדכן את ההרגלים היום</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
