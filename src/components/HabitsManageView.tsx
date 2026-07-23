import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, Archive, CheckCircle2, Layers } from 'lucide-react';
import { Habit, HabitCategory } from '../types';
import { HabitIcon, HABIT_COLORS_MAP } from './HabitIcon';

interface HabitsManageViewProps {
  habits: Habit[];
  onOpenCreateHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleArchive: (habitId: string) => void;
}

export const HabitsManageView: React.FC<HabitsManageViewProps> = ({
  habits,
  onOpenCreateHabit,
  onEditHabit,
  onDeleteHabit,
  onToggleArchive,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredHabits = habits.filter((h) => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || (h.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Top Controls Bar */}
      <div className="bento-box flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#2a221a] absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש הרגל לפי שם או תיאור..."
            className="w-full bg-[#fffbf2] border-2 border-[#2a221a] rounded-xl pr-10 pl-4 py-2 text-xs font-black text-[#2a221a] focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#fffbf2] border-2 border-[#2a221a] rounded-xl px-3 py-2 text-xs font-black text-[#2a221a] focus:outline-none"
          >
            <option value="all">כל הקטגוריות</option>
            <option value="health">בריאות ותזונה</option>
            <option value="fitness">כושר וספורט</option>
            <option value="mindset">מיינדסט ומדיטציה</option>
            <option value="productivity">פרודוקטיביות</option>
            <option value="learning">למידה וספרים</option>
            <option value="personal">אישי ואיכות חיים</option>
          </select>

          <button
            onClick={onOpenCreateHabit}
            className="btn-fancy text-xs py-2 px-4 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ הרגל חדש</span>
          </button>
        </div>
      </div>

      {/* Habits List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredHabits.map((habit) => {
          return (
            <div
              key={habit.id}
              className={`bento-box flex flex-col justify-between transition ${
                habit.archived ? 'opacity-50' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl border-2 border-[#2a221a] bg-[#ffdf3e] shadow-[2px_2px_0px_#2a221a] flex items-center justify-center text-[#2a221a]">
                      <HabitIcon name={habit.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#2a221a]">{habit.name}</h3>
                      <span className="font-mono-code text-[10px] font-bold text-slate-600 uppercase">
                        {habit.type === 'boolean' ? 'כן / לא' : habit.type === 'numeric' ? `כמותי (${habit.targetValue} ${habit.unit})` : `טיימר (${Math.floor((habit.targetValue || 0) / 60)} דק')`}
                      </span>
                    </div>
                  </div>

                  <span className="label-neo text-[10px] bg-[#ff8e72]">
                    {habit.category}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-700 line-clamp-2 mb-4">
                  {habit.description || 'ללא תיאור מוסף'}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t-2 border-[#2a221a]/20 flex items-center justify-between">
                <span className="font-mono-code text-[10px] font-bold text-slate-600">
                  {habit.createdAt}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditHabit(habit)}
                    className="p-1.5 rounded-lg border-2 border-[#2a221a] bg-white text-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-[#ffdf3e] transition"
                    title="ערוך"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onToggleArchive(habit.id)}
                    className="p-1.5 rounded-lg border-2 border-[#2a221a] bg-white text-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-[#ff8e72] transition"
                    title={habit.archived ? 'בטל ארכיון' : 'העבר לארכיון'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-1.5 rounded-lg border-2 border-[#2a221a] bg-rose-200 text-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-rose-400 transition"
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
