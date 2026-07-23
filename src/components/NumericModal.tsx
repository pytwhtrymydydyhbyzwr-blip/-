import React, { useState } from 'react';
import { X, Plus, Minus, CheckCircle } from 'lucide-react';
import { Habit } from '../types';
import { soundFX } from '../utils/audio';
import confetti from 'canvas-confetti';

interface NumericModalProps {
  habit: Habit;
  selectedDate: string;
  onClose: () => void;
  onSaveProgress: (newValue: number) => void;
}

export const NumericModal: React.FC<NumericModalProps> = ({
  habit,
  selectedDate,
  onClose,
  onSaveProgress,
}) => {
  const target = habit.targetValue || 100;
  const initialValue = habit.logs[selectedDate]?.value || 0;
  const [value, setValue] = useState<number>(initialValue);

  const unit = habit.unit || 'יחידות';

  // Preset additions
  const presets = unit === 'מ"ל' ? [250, 500, 750, 1000] : [1, 5, 10, 25];

  const handleAddPreset = (amount: number) => {
    setValue((prev) => Math.max(0, prev + amount));
  };

  const handleSave = () => {
    onSaveProgress(value);

    if (value >= target && initialValue < target) {
      soundFX.playCelebrationSound();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      soundFX.playCompleteSound();
    }
    onClose();
  };

  const percent = Math.min(100, Math.round((value / target) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-[32px] max-w-md w-full p-6 sm:p-8 text-slate-800 shadow-2xl relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
            עדכון כמות
          </span>
          <h2 className="text-xl font-black mt-2 text-slate-800">{habit.name}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            יעד יומיומי: {target} {unit}
          </p>
        </div>

        {/* Counter Display & Stepper */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 text-center my-4">
          <div className="text-4xl font-black text-indigo-600 tracking-tight">
            {value} <span className="text-lg font-bold text-slate-400">{unit}</span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setValue((prev) => Math.max(0, prev - (unit === 'מ"ל' ? 250 : 1)))}
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition active:scale-95 shadow-sm"
            >
              <Minus className="w-5 h-5 stroke-[3]" />
            </button>

            <button
              onClick={() => setValue((prev) => prev + (unit === 'מ"ל' ? 250 : 1))}
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition active:scale-95 shadow-sm"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-6 bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 font-bold">
            {percent}% מתוך היעד היומי
          </p>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handleAddPreset(preset)}
              className="py-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-xs font-bold text-slate-700 transition"
            >
              +{preset} {unit}
            </button>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-lg transition"
        >
          <CheckCircle className="w-5 h-5" />
          <span>שמור עדכון</span>
        </button>

      </div>
    </div>
  );
};
