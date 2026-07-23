import React from 'react';
import { ShieldAlert, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface ModerationAlertModalProps {
  isOpen: boolean;
  blockedWord?: string;
  onClose: () => void;
}

export const ModerationAlertModal: React.FC<ModerationAlertModalProps> = ({
  isOpen,
  blockedWord,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl text-right" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-md w-full p-6 text-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <span className="text-[11px] font-extrabold uppercase bg-rose-100 text-rose-800 px-3 py-1 rounded-full inline-block">
            סינון תכנים ושיח מכבד
          </span>
          <h3 className="text-xl font-black text-slate-900">
            ההודעה נחסמה עקב שפה בלתי הולמת
          </h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            זיהינו ביטוי או מילה פוגענית ({blockedWord ? `"${blockedWord}"` : 'תוכן בלתי הולם'}). בקהילת <span className="font-bold text-indigo-600">HabitHero</span> אנו מקפידים על סביבה בטוחה, חיובית ומעודדת לכולם!
          </p>
        </div>

        {/* Positive Community Guidelines Box */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-black text-amber-900 text-xs">
            <HeartHandshake className="w-4 h-4 text-amber-600" />
            <span>כללי הקהילה שלנו:</span>
          </div>
          <ul className="text-[11px] font-bold text-amber-800 space-y-1 pr-4 list-disc">
            <li>מעודדים ומפרגנים לחברים על הצלחה בהרגלים</li>
            <li>משתמשים בלשון נקייה, מכבדת ומרימה</li>
            <li>בונים רצפי התמדה ביחד באנרגיה חיובית</li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>הבנתי, אעדכן את הניסוח</span>
        </button>
      </div>
    </div>
  );
};
