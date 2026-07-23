import React from 'react';
import { Sparkles, Trophy, Star, Share2, Check } from 'lucide-react';
import { Badge } from '../types';

interface BadgeUnlockModalProps {
  badge: Badge | null;
  onClose: () => void;
  onShareToFeed?: (badge: Badge) => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ badge, onClose, onShareToFeed }) => {
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-right animate-in fade-in duration-300" dir="rtl">
      <div className="bg-white rounded-[36px] shadow-2xl border-2 border-amber-400 max-w-md w-full p-8 text-center space-y-6 relative overflow-hidden animate-in zoom-in-90 duration-300">
        
        {/* Decorative Golden Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge Banner Header */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500 animate-spin" />
            <span>הישג חדש נפתח! (Badge Unlocked)</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 italic">כל הכבוד! זכית בתג חדש! 🎉</h2>
        </div>

        {/* Badge Animated Icon Frame */}
        <div className="relative z-10 my-4">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 p-1 shadow-xl ring-8 ring-amber-100 animate-bounce">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-5xl">
              {badge.icon}
            </div>
          </div>
        </div>

        {/* Title & XP */}
        <div className="relative z-10 space-y-2">
          <h3 className="text-xl font-black text-slate-900">{badge.title}</h3>
          <p className="text-xs font-semibold text-slate-600 leading-relaxed max-w-xs mx-auto">
            {badge.description}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 font-black text-sm shadow-xs mt-2">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>+{badge.rewardXP} XP הוספו לחשבון שלך!</span>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 space-y-2 pt-2">
          {onShareToFeed && (
            <button
              onClick={() => {
                onShareToFeed(badge);
                onClose();
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>שתף בפיד הקבוצתי לקבלת חיזוקים</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition"
          >
            אישור והמשך
          </button>
        </div>
      </div>
    </div>
  );
};
