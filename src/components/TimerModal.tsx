import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle, Plus, Sparkles } from 'lucide-react';
import { Habit } from '../types';
import { soundFX } from '../utils/audio';
import confetti from 'canvas-confetti';

interface TimerModalProps {
  habit: Habit;
  selectedDate: string;
  onClose: () => void;
  onSaveProgress: (secondsCompleted: number) => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  habit,
  selectedDate,
  onClose,
  onSaveProgress,
}) => {
  const targetSeconds = habit.targetValue || 1200; // 20 mins default
  const initialLoggedSeconds = habit.logs[selectedDate]?.value || 0;

  const [secondsElapsed, setSecondsElapsed] = useState<number>(initialLoggedSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          if (next % 60 === 0) {
            soundFX.playTickSound();
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
  };

  const handleAddMinutes = (mins: number) => {
    setSecondsElapsed((prev) => prev + mins * 60);
  };

  const handleFinishAndSave = () => {
    setIsRunning(false);
    onSaveProgress(secondsElapsed);

    if (secondsElapsed >= targetSeconds) {
      soundFX.playCelebrationSound();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      soundFX.playCompleteSound();
    }
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round((secondsElapsed / targetSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-[32px] max-w-md w-full p-6 sm:p-8 text-slate-800 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
            טיימר מבוסס זמן
          </span>
          <h2 className="text-xl font-black mt-2 text-slate-800">{habit.name}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            יעד: {Math.floor(targetSeconds / 60)} דקות
          </p>
        </div>

        {/* Circular Timer Display */}
        <div className="relative w-56 h-56 mx-auto my-6 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="96"
              className="stroke-slate-100"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="96"
              className="stroke-indigo-600 transition-all duration-300"
              strokeWidth="12"
              strokeDasharray={603}
              strokeDashoffset={603 - (603 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black tracking-tight text-slate-800 font-mono">
              {formatTime(secondsElapsed)}
            </span>
            <span className="text-xs font-bold text-slate-400 mt-1">
              {progressPercent}% הושלמו
            </span>
          </div>
        </div>

        {/* Timer Quick Add Buttons */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => handleAddMinutes(1)}
            className="px-3.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1 border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>1 דקה</span>
          </button>
          <button
            onClick={() => handleAddMinutes(5)}
            className="px-3.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1 border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>5 דקות</span>
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
            title="איפוס"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleToggleTimer}
            className={`py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>השהה</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>התחל</span>
              </>
            )}
          </button>

          <button
            onClick={handleFinishAndSave}
            className="py-3.5 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-md transition"
          >
            <CheckCircle className="w-5 h-5" />
            <span>שמור והשלם</span>
          </button>
        </div>

      </div>
    </div>
  );
};
