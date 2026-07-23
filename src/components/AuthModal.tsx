import React, { useState } from 'react';
import { LogIn, UserPlus, Lock, User, Sparkles, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { UserAccount, loginUser, registerUser } from '../utils/auth';
import { signInWithGoogle, syncUserProfile } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
}

const AVATAR_OPTIONS = ['🦸‍♂️', '🧘‍♀️', '🚀', '🌟', '🎯', '🔥', '👑', '⚡', '🏆', '🌱'];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState('🦸‍♂️');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      const fbUser = res?.user;
      if (fbUser) {
        await syncUserProfile(fbUser);
        const userAccount: UserAccount = {
          id: fbUser.uid,
          username: fbUser.email?.split('@')[0] || fbUser.uid,
          fullName: fbUser.displayName || 'משתמש גוגל',
          passwordHash: 'firebase_oauth',
          avatar: fbUser.photoURL || '🦸‍♂️',
          createdAt: new Date().toISOString(),
        };
        setSuccessMsg(`שלום ${userAccount.fullName}, התחברת בהצלחה עם גוגל!`);
        setTimeout(() => {
          onAuthSuccess(userAccount);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      console.warn('Google auth failed:', err);
      const errMsg = err?.code || err?.message || '';
      if (errMsg.includes('internal-error') || errMsg.includes('popup') || errMsg.includes('unauthorized-domain')) {
        setError('חלון התחברות Google אינו זמין במסגרת תצוגה מקדימה מובנית. ניתן להתחבר ישירות באמצעות דוא"ל וסיסמה או חשבון הדגמה בלחיצה אחת!');
      } else {
        setError('שגיאה בהתחברות באמצעות Google. נסה להתחבר באמצעות שם משתמש וסיסמה.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      const res = loginUser(username, password);
      if (res.success && res.user) {
        setSuccessMsg(`שלום ${res.user.fullName}, התחברת בהצלחה!`);
        setTimeout(() => {
          onAuthSuccess(res.user!);
          onClose();
        }, 500);
      } else {
        setError(res.error || 'שגיאה בהתחברות');
      }
    } else {
      const res = registerUser(username, fullName, password, avatar);
      if (res.success && res.user) {
        setSuccessMsg('החשבון נוצר בהצלחה! מחובר כעת...');
        setTimeout(() => {
          onAuthSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        setError(res.error || 'שגיאה ביצירת החשבון');
      }
    }
  };

  const handleDemoLogin = () => {
    const res = loginUser('demo', '123456');
    if (res.success && res.user) {
      onAuthSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a221a]/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
      <div className="bento-box bg-[#fffbf2] w-full max-w-md p-0 overflow-hidden shadow-[6px_6px_0px_#2a221a] transition-all">
        {/* Header */}
        <div className="bg-[#ffdf3e] border-b-3 border-[#2a221a] p-6 text-[#2a221a] relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-xl border-2 border-[#2a221a] bg-white text-[#2a221a] shadow-[2px_2px_0px_#2a221a] hover:bg-rose-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] rounded-xl">
              <ShieldCheck className="w-7 h-7 text-[#2a221a]" />
            </div>
            <div>
              <span className="label-neo bg-white text-[9px] mb-1">AUTH CENTER</span>
              <h2 className="font-gaegu text-3xl font-bold">אזור משתמשים</h2>
              <p className="text-xs font-bold text-[#2a221a]">
                {mode === 'login' ? 'התחבר לחשבון המעקב שלך' : 'צור חשבון חדש לשמירת ההרגלים'}
              </p>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-white border-2 border-[#2a221a] shadow-[2px_2px_0px_#2a221a] p-1 rounded-xl mt-5">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'login' ? 'bg-[#2a221a] text-[#ffdf3e]' : 'text-[#2a221a] hover:bg-slate-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>התחברות</span>
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'register' ? 'bg-[#2a221a] text-[#ffdf3e]' : 'text-[#2a221a] hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>הרשמה חדשה</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-200 border-2 border-[#2a221a] text-[#2a221a] text-xs font-black rounded-xl flex items-start gap-2 shadow-[2px_2px_0px_#2a221a]">
              <X className="w-4 h-4 shrink-0 mt-0.5 text-[#2a221a]" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-[#ffdf3e] border-2 border-[#2a221a] text-[#2a221a] text-xs font-black rounded-xl flex items-center gap-2 shadow-[2px_2px_0px_#2a221a]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2a221a]" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-extrabold text-[#2a221a] mb-1">שם מלא / כינוי</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="דוגמה: יוסי כהן"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-[#fffbf2] border-2 border-[#2a221a] rounded-xl text-xs font-black text-[#2a221a] focus:outline-none focus:bg-white"
                />
                <User className="w-4 h-4 text-[#2a221a] absolute right-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[#2a221a] mb-1">שם משתמש</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="שם משתמש (באנגלית או עברית)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-[#fffbf2] border-2 border-[#2a221a] rounded-xl text-xs font-black text-[#2a221a] focus:outline-none focus:bg-white"
              />
              <User className="w-4 h-4 text-[#2a221a] absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#2a221a] mb-1">סיסמה</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="הכנס סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-[#fffbf2] border-2 border-[#2a221a] rounded-xl text-xs font-black text-[#2a221a] focus:outline-none focus:bg-white"
              />
              <Lock className="w-4 h-4 text-[#2a221a] absolute right-3 top-3" />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-extrabold text-[#2a221a] mb-1.5">בחר אמוג'י פרופיל</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 border-[#2a221a] transition shrink-0 ${
                      avatar === item
                        ? 'bg-[#ffdf3e] shadow-[2px_2px_0px_#2a221a]'
                        : 'bg-white hover:bg-[#fffbf2]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Google Firebase Login Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#fffbf2] border-2 border-[#2a221a] text-[#2a221a] font-extrabold text-xs rounded-xl shadow-[2px_2px_0px_#2a221a] transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'מתחבר ל-Google...' : 'התחבר באמצעות Google (Firebase)'}</span>
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#2a221a]/20" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold">
              <span className="bg-[#fffbf2] px-2 text-slate-600">או באמצעות סיסמה</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-fancy w-full py-3 text-xs flex items-center justify-center gap-2"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{mode === 'login' ? 'התחבר לחשבון' : 'צור חשבון חדש'}</span>
          </button>

          <div className="pt-2 border-t-2 border-[#2a221a]/20 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold">רוצה לבדוק מהר?</span>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-[#2a221a] font-extrabold flex items-center gap-1 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2a221a]" />
              <span>כניסה כמשתמש דוגמה (demo)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
