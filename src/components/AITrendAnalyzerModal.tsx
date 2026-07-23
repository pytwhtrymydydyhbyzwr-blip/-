import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Award, Lightbulb, Quote, Loader2, X, RefreshCw } from 'lucide-react';
import { Habit } from '../types';

interface AITrendAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
}

interface AnalysisResult {
  overallScore: number;
  summaryHeadline: string;
  weakDays: string[];
  strongDays: string[];
  keyInsights: string[];
  actionableTips: string[];
  motivationQuote: string;
}

export const AITrendAnalyzerModal: React.FC<AITrendAnalyzerModalProps> = ({ isOpen, onClose, habits }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const fetchAnalysis = async () => {
    if (habits.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const payload = habits.map((h) => ({
        name: h.name,
        category: h.category,
        targetValue: h.targetValue,
        unit: h.unit,
        logs: h.logs,
        createdDate: h.createdDate,
      }));

      const res = await fetch('/api/ai/analyze-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitsData: payload }),
      });

      if (!res.ok) {
        throw new Error('שגיאה בניתוח המגמות בשרת');
      }

      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('תוצאת ניתוח לא תקינה');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'אירעה שגיאה בטעינת ניתוח המגמות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !analysis && !loading) {
      fetchAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="bg-white/20 text-amber-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                AI Performance Coach
              </span>
              <h2 className="text-xl font-bold mt-1">ניתוח מגמות אישיות והצעות לשיפור</h2>
              <p className="text-xs text-amber-100 mt-0.5">
                זיהוי ימי חולשה, דפוסי עקביות והמלצות מותאמות אישית
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">מנתח את היסטוריית ההרגלים וימי החולשה שלך...</p>
              <p className="text-[11px] text-slate-400">Gemini AI מפיק תובנות מותאמות אישית</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchAnalysis}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>נסה שוב</span>
              </button>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-6 animate-fade-in">
              {/* Score & Summary Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl flex items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold tracking-wider text-amber-400 uppercase">
                    מדד עקביות משוער
                  </span>
                  <h3 className="text-base font-extrabold text-white">{analysis.summaryHeadline}</h3>
                </div>

                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center bg-white/10 rounded-full border-4 border-amber-400/80 shadow-inner">
                  <div className="text-center">
                    <span className="text-2xl font-black text-amber-300">{analysis.overallScore}</span>
                    <span className="text-[9px] font-bold block text-slate-300">מתוך 100</span>
                  </div>
                </div>
              </div>

              {/* Weak vs Strong Days Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs mb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>זיהוי ימי חולשה (Weak Days)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.weakDays && analysis.weakDays.length > 0 ? (
                      analysis.weakDays.map((day, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-rose-200 text-rose-800 text-xs font-bold rounded-xl shadow-xs">
                          {day}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">לא זוהו ימי חולשה מובהקים</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs mb-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <span>ימי שיא בעקביות (Strong Days)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.strongDays && analysis.strongDays.length > 0 ? (
                      analysis.strongDays.map((day, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl shadow-xs">
                          {day}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">שומר על עקביות אחידה</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>תובנות מפתח מבוססות נתונים:</span>
                </h4>
                <div className="space-y-2">
                  {analysis.keyInsights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Tips */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>הצעות מותאמות לשיפור ועקביות:</span>
                </h4>
                <div className="space-y-2">
                  {analysis.actionableTips.map((tip, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs font-bold text-slate-800 flex items-start gap-2">
                      <span className="text-amber-600 shrink-0 mt-0.5">💡</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivation Quote */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-start gap-3">
                <Quote className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs font-extrabold text-indigo-900 italic">
                  "{analysis.motivationQuote}"
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={fetchAnalysis}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>רענן ניתוח</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
