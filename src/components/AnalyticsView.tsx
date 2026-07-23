import React from 'react';
import { BarChart3, TrendingUp, Download, Award, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Habit } from '../types';
import { calculateHabitStreaks, getDayOfWeekAnalysis, getOverallProgressTrend } from '../utils/streak';
import { exportCSV, exportBackupJSON } from '../utils/storage';

interface AnalyticsViewProps {
  habits: Habit[];
  isPro: boolean;
  onOpenProModal: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ habits, isPro, onOpenProModal }) => {
  const activeHabits = habits.filter((h) => !h.archived);

  // Overall progress trend data (past 14 days)
  const trendData = getOverallProgressTrend(habits, 14);

  // Day of week breakdown data
  const dayOfWeekData = getDayOfWeekAnalysis(habits);

  // Streaks ranking
  const rankedHabits = [...activeHabits]
    .map((h) => ({
      habit: h,
      streakInfo: calculateHabitStreaks(h),
    }))
    .sort((a, b) => b.streakInfo.currentStreak - a.streakInfo.currentStreak);

  // Total completions across all habits
  const totalCompletionsAllTime = rankedHabits.reduce((acc, curr) => acc + curr.streakInfo.totalCompleted, 0);

  // Average completion rate
  const avgCompletionRate = rankedHabits.length > 0
    ? Math.round(rankedHabits.reduce((acc, curr) => acc + curr.streakInfo.completionRate, 0) / rankedHabits.length)
    : 0;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Top Banner & Export Bar */}
      <div className="bento-box flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="label-neo mb-1">ANALYTICS & STATS</span>
          <h2 className="font-gaegu text-3xl sm:text-4xl font-bold text-[#2a221a] flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-[#2a221a]" />
            <span>התמדה שנתית וניתוח</span>
          </h2>
          <p className="text-xs font-black text-slate-600 mt-1">
            מבט על רמת הביצוע של כל ההרגלים ומגמות ההצלחה שלך
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCSV(habits)}
            className="btn-fancy text-xs py-2 px-3.5 bg-white text-[#2a221a]"
          >
            <Download className="w-4 h-4 text-[#2a221a]" />
            <span>ייצא Excel / CSV</span>
          </button>

          <button
            onClick={() => exportBackupJSON(habits)}
            className="btn-fancy text-xs py-2 px-3.5 bg-[#ffdf3e] text-[#2a221a]"
          >
            <Download className="w-4 h-4 text-[#2a221a]" />
            <span>גיבוי JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Yellow Neo Bento Card */}
        <div className="bento-box-accent flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="label-neo">RECORD STREAK</span>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="font-gaegu text-6xl font-bold text-[#2a221a]">
              {Math.max(...rankedHabits.map((r) => r.streakInfo.bestStreak), 0)}
            </div>
            <div className="font-mono-code text-sm font-black mb-2 text-[#2a221a]">ימים</div>
          </div>
          <div className="text-xs text-[#2a221a] font-black mt-2">הישג השיא ברצף בלתי מופסק</div>
        </div>

        {/* White Bento Card 2 */}
        <div className="bento-box flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="label-neo">SUCCESS RATE</span>
            <Award className="w-6 h-6 text-[#2a221a]" />
          </div>
          <div>
            <div className="font-gaegu text-5xl font-bold text-[#2a221a]">{avgCompletionRate}%</div>
            <div className="text-xs font-extrabold text-slate-600 mt-1">ממוצע מתוך כלל הימים המתוכננים</div>
          </div>
        </div>

        {/* Coral Bento Card 3 */}
        <div className="bento-box-secondary flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="label-neo">ACTIVE DAYS</span>
            <CheckCircle2 className="w-6 h-6 text-[#2a221a]" />
          </div>
          <div>
            <div className="font-gaegu text-5xl font-bold text-[#2a221a]">{totalCompletionsAllTime}</div>
            <div className="text-xs font-black text-[#2a221a] mt-1">הרגל שבוצע מתחילת השימוש</div>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: 14-Day Progress Trend */}
        <div className="bento-box flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="label-neo mb-1">PROGRESS TREND</span>
              <h3 className="font-gaegu text-2xl font-bold text-[#2a221a] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2a221a]" />
                <span>מגמת ביצוע 14 ימים אחרונים (%)</span>
              </h3>
              <p className="text-xs font-bold text-slate-600">אחוז ההרגלים שבוצעו בכל יום</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffdf3e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ffdf3e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" stroke="#2a221a" fontSize={11} fontWeight={700} />
                <YAxis stroke="#2a221a" fontSize={11} fontWeight={700} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2a221a', borderColor: '#ffdf3e', color: '#ffdf3e', borderRadius: '12px', fontWeight: 'bold' }}
                  formatter={(val) => [`${val}%`, 'אחוז הצלחה']}
                />
                <Area type="monotone" dataKey="rate" stroke="#2a221a" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Day of Week Analysis */}
        <div className="bento-box flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="label-neo mb-1">WEEKDAY BREAKDOWN</span>
              <h3 className="font-gaegu text-2xl font-bold text-[#2a221a] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2a221a]" />
                <span>פילוח הצלחה לפי ימי השבוע</span>
              </h3>
              <p className="text-xs font-bold text-slate-600">איזה יום בשבוע הכי פחות או הכי ממושמע?</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <XAxis dataKey="dayName" stroke="#2a221a" fontSize={11} fontWeight={700} />
                <YAxis stroke="#2a221a" fontSize={11} fontWeight={700} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2a221a', borderColor: '#ffdf3e', color: '#ffdf3e', borderRadius: '12px', fontWeight: 'bold' }}
                  formatter={(val) => [`${val}%`, 'התמדה ממוצעת']}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]} stroke="#2a221a" strokeWidth={2}>
                  {dayOfWeekData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percentage > 75 ? '#ffdf3e' : entry.percentage > 50 ? '#ff8e72' : '#ffffff'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Top Performing Habits Ranking */}
      <div className="bento-box">
        <span className="label-neo mb-1">HABIT RANKING</span>
        <h3 className="font-gaegu text-3xl font-bold text-[#2a221a] mb-4 flex items-center gap-2">
          <Award className="w-6 h-6 text-[#2a221a]" />
          <span>דירוג הרגלים לפי אורך הרצף והתמדה</span>
        </h3>

        <div className="space-y-3">
          {rankedHabits.map(({ habit, streakInfo }, idx) => (
            <div
              key={habit.id}
              className="p-3.5 border-2 border-[#2a221a] rounded-xl bg-[#fffbf2] shadow-[2px_2px_0px_#2a221a] flex items-center justify-between flex-wrap gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono-code text-sm font-black text-[#2a221a]">#{idx + 1}</span>
                <div>
                  <h4 className="font-extrabold text-base text-[#2a221a]">{habit.name}</h4>
                  <span className="text-xs font-bold text-slate-600">
                    אחוז הצלחה: {streakInfo.completionRate}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-black text-[#2a221a]">🔥 {streakInfo.currentStreak} ימי רצף</div>
                  <div className="text-[10px] font-mono-code font-bold text-slate-600">שיא: {streakInfo.bestStreak} ימים</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
