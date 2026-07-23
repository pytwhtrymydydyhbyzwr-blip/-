import React, { useRef } from 'react';
import { Settings, Sparkles, Volume2, VolumeX, Download, Upload, RotateCcw, ShieldCheck, Database } from 'lucide-react';
import { Habit } from '../types';
import { exportBackupJSON, exportCSV, saveHabits } from '../utils/storage';
import { INITIAL_HABITS } from '../data/initialHabits';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { NotificationPermissionStatus } from '../utils/notifications';

interface SettingsViewProps {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
  isPro: boolean;
  onOpenProModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  remindersEnabled: boolean;
  onToggleRemindersEnabled: (enabled: boolean) => void;
  permissionStatus: NotificationPermissionStatus;
  onRequestPermission: () => Promise<NotificationPermissionStatus>;
  onTestSystemNotification: () => Promise<{ success: boolean; message: string }>;
  onTestHabitReminder: (habit: Habit) => void;
  onOpenEditHabit?: (habit: Habit) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  habits,
  onUpdateHabits,
  isPro,
  onOpenProModal,
  soundEnabled,
  onToggleSound,
  remindersEnabled,
  onToggleRemindersEnabled,
  permissionStatus,
  onRequestPermission,
  onTestSystemNotification,
  onTestHabitReminder,
  onOpenEditHabit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (Array.isArray(imported)) {
          onUpdateHabits(imported);
          saveHabits(imported);
          alert('הנתונים יובאו בהצלחה!');
        } else {
          alert('קובץ לא תקין.');
        }
      } catch {
        alert('שגיאה בקריאת הקובץ.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    if (confirm('האם לאפס את האפליקציה ולהטעין נתוני הדגמה לדוגמה?')) {
      onUpdateHabits(INITIAL_HABITS);
      saveHabits(INITIAL_HABITS);
      alert('נתוני ההדגמה הוטענו מחדש בהצלחה.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Title */}
      <div className="bento-box flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#ffdf3e] border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] flex items-center justify-center text-[#2a221a]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <span className="label-neo mb-1">PREFERENCES</span>
          <h2 className="font-gaegu text-3xl font-bold text-[#2a221a]">הגדרות וגיבוי</h2>
          <p className="text-xs font-bold text-slate-600">התאמה אישית, גיבוי נתונים וניהול הגדרות שמע</p>
        </div>
      </div>

      {/* Pro Membership Bento Card */}
      <div className="bento-box-accent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#2a221a]" />
            <h3 className="font-extrabold text-base text-[#2a221a]">
              {isPro ? 'מנוי PRO פעיל ✓' : 'מנוי חינמי'}
            </h3>
          </div>
          <p className="text-xs font-bold text-[#2a221a]">
            {isPro
              ? 'יש לך גישה בלתי מוגבלת לכל תכונות הפרימיום, יצירת הרגלים ללא הגבלה ודוחות ייצוא.'
              : 'שדרג ל-PRO לקבלת גישה לכל התכונות המתקדמות וסנכרון ענן.'}
          </p>
        </div>

        <button
          onClick={onOpenProModal}
          className="btn-fancy bg-[#2a221a] text-[#ffdf3e] text-xs py-2 px-4 shrink-0"
        >
          {isPro ? 'נהל מנוי' : 'שדרג ל-PRO'}
        </button>
      </div>

      {/* Notification & Reminder Settings Card */}
      <NotificationSettingsCard
        habits={habits}
        remindersEnabled={remindersEnabled}
        onToggleRemindersEnabled={onToggleRemindersEnabled}
        permissionStatus={permissionStatus}
        onRequestPermission={onRequestPermission}
        onTestSystemNotification={onTestSystemNotification}
        onTestHabitReminder={onTestHabitReminder}
        onOpenEditHabit={onOpenEditHabit}
      />

      {/* Preferences Grid */}
      <div className="bento-box space-y-4">
        <h3 className="font-extrabold text-sm text-[#2a221a] border-b-2 border-[#2a221a]/20 pb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2a221a]" />
          <span>הגדרות שמע ואפקטים</span>
        </h3>

        {/* Sound FX Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-[#2a221a]">אפקטים קוליים</h4>
            <p className="text-xs font-bold text-slate-600">משוב קולי משמח בעת סימון הרגלים וחגיגת רצפים</p>
          </div>

          <button
            onClick={onToggleSound}
            className={`w-14 h-8 rounded-full transition-colors relative border-2 border-[#2a221a] p-1 shadow-[2px_2px_0px_#2a221a] ${
              soundEnabled ? 'bg-[#ffdf3e]' : 'bg-[#fffbf2]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-[#2a221a] transition-transform flex items-center justify-center ${
                soundEnabled ? 'translate-x-0' : '-translate-x-6'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#ffdf3e]" /> : <VolumeX className="w-3.5 h-3.5 text-white" />}
            </div>
          </button>
        </div>
      </div>

      {/* Backup & Import Section */}
      <div className="bento-box space-y-4">
        <h3 className="font-extrabold text-sm text-[#2a221a] border-b-2 border-[#2a221a]/20 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#2a221a]" />
          <span>ניהול נתונים וגיבוי</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => exportBackupJSON(habits)}
            className="p-4 rounded-xl bg-[#fffbf2] border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-[#ffdf3e] text-right transition group"
          >
            <Download className="w-5 h-5 text-[#2a221a] mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-extrabold text-sm text-[#2a221a]">ייצא קובץ גיבוי מלא (JSON)</div>
            <p className="text-xs font-bold text-slate-600 mt-0.5">שמור את כל ההיסטוריה וההגדרות בקובץ מקומי</p>
          </button>

          <button
            onClick={() => exportCSV(habits)}
            className="p-4 rounded-xl bg-[#fffbf2] border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-[#ffdf3e] text-right transition group"
          >
            <Download className="w-5 h-5 text-[#2a221a] mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-extrabold text-sm text-[#2a221a]">ייצא גיליון Excel / CSV</div>
            <p className="text-xs font-bold text-slate-600 mt-0.5">קובץ המיועד לניתוח בטבלאות ואקסל</p>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl bg-[#fffbf2] border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-[#ff8e72] text-right transition group"
          >
            <Upload className="w-5 h-5 text-[#2a221a] mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-extrabold text-sm text-[#2a221a]">ייבא קובץ גיבוי</div>
            <p className="text-xs font-bold text-slate-600 mt-0.5">שחזר נתונים מקובץ JSON שיוצא בעבר</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
          </button>

          <button
            onClick={handleResetSampleData}
            className="p-4 rounded-xl bg-rose-100 border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-rose-200 text-right transition group"
          >
            <RotateCcw className="w-5 h-5 text-[#2a221a] mb-2 group-hover:rotate-180 transition-transform duration-500" />
            <div className="font-extrabold text-sm text-[#2a221a]">אפס והטען נתוני הדגמה</div>
            <p className="text-xs font-bold text-slate-700 mt-0.5">שחזר את נתוני הניסיון הראשוניים של האפליקציה</p>
          </button>
        </div>
      </div>

    </div>
  );
};
