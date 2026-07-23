import React, { useState } from 'react';
import { X, Sparkles, Check, Flame, ShieldCheck, Zap, Cloud, Bell, CreditCard, Lock, Smartphone, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';

interface ProUpgradeModalProps {
  isPro: boolean;
  onTogglePro: () => void;
  onClose: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isPro,
  onTogglePro,
  onClose,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentTab, setPaymentTab] = useState<'card' | 'bit' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Card form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      soundFX.playCelebrationSound();
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'],
      });

      setTimeout(() => {
        if (!isPro) {
          onTogglePro();
        }
        onClose();
      }, 1500);
    }, 1200);
  };

  const handleDowngradeToBasic = () => {
    if (confirm('האם אתה בטוח שברצונך לבטל את מנוי ה-PRO ולחזור למסלול הבסיסי החינמי?')) {
      onTogglePro();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto dir-rtl">
      <div className="bg-white border border-slate-200 rounded-[32px] max-w-2xl w-full p-6 sm:p-8 text-slate-800 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Visual */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>השוואת מסלולים ושדרוג</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isPro ? 'ניהול מנוי PRO' : 'שדרוג למנוי PRO בתשלום'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-md mx-auto">
            הפרדנו עבורך בין המסלול הבסיסי החינמי לבין מסלול ה-PRO המתקדם הכולל בינה מלאכותית, סנכרון וכלים בלתי מוגבלים.
          </p>
        </div>

        {/* Current Plan Status Banner */}
        <div className={`p-4 rounded-2xl mb-6 border flex items-center justify-between gap-3 ${
          isPro
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPro ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isPro ? <CheckCircle2 className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">סטטוס מנוי נוכחי</div>
              <div className="text-sm font-black">
                {isPro ? 'מנוי PRO פעיל 🌟 (כל הכלים פתוחים)' : 'מנוי בסיסי חינמי (מוגבל ל-3 הרגלים)'}
              </div>
            </div>
          </div>

          {isPro && (
            <button
              onClick={handleDowngradeToBasic}
              className="text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-3 py-1.5 rounded-xl transition"
            >
              חזור למסלול בסיסי
            </button>
          )}
        </div>

        {/* Comparison Grid: Basic vs Pro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          
          {/* Basic Plan Box */}
          <div className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
            !isPro ? 'bg-slate-50 border-slate-300 ring-2 ring-slate-400/30' : 'bg-slate-50/60 border-slate-200 opacity-80'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">מנוי בסיסי</h3>
                  <p className="text-[11px] text-slate-500">למשתמשים מתחילים</p>
                </div>
                <span className="text-lg font-black text-slate-800">₪0 <span className="text-xs font-normal text-slate-500">/ חינם</span></span>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 my-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>עד <strong>3 הרגלים פעילים</strong> במקביל</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>מעקב רצפים יומי ולוח שנה</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>תזכורת אחת להרגל</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 line-through">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>כלי בינה מלאכותית Gemini AI</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 line-through">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>ייצוא נתונים CSV / Excel</span>
                </li>
              </ul>
            </div>

            {!isPro && (
              <div className="text-center text-[11px] font-bold text-slate-500 bg-slate-200/60 py-2 rounded-xl mt-2">
                מסלול נוכחי
              </div>
            )}
          </div>

          {/* Pro Plan Box */}
          <div className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
            isPro ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/30' : 'bg-gradient-to-br from-indigo-500/5 via-indigo-50 to-purple-50 border-indigo-300 shadow-md'
          }`}>
            <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>מומלץ 🔥</span>
            </div>

            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-extrabold text-base text-indigo-950 flex items-center gap-1">
                    <span>מנוי PRO</span>
                  </h3>
                  <p className="text-[11px] text-indigo-700/80">חוויה מלאה ללא הגבלות</p>
                </div>
                <div className="text-left">
                  <span className="text-xl font-black text-indigo-900">
                    {billingCycle === 'monthly' ? '₪29' : '₪290'}
                  </span>
                  <span className="text-xs font-medium text-indigo-600/80">
                    {billingCycle === 'monthly' ? ' / חודש' : ' / שנה'}
                  </span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-indigo-950 my-4 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>הרגלים ללא הגבלה</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span><strong>מנוע AI</strong> למעקב קולי ופירוק יעדים</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>תזכורות חכמות מרובות</span>
                </li>
                <li className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>סנכרון ענן וגיבוי היסטוריוגרפי</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>ייצוא נתונים ישיר ל-CSV / Excel</span>
                </li>
              </ul>
            </div>

            {isPro ? (
              <div className="text-center text-[11px] font-black text-indigo-700 bg-indigo-100 py-2 rounded-xl mt-2">
                מנוי PRO פעיל ⚡
              </div>
            ) : (
              <div className="text-[11px] text-indigo-600 font-bold text-center">
                תשלום מאובטח בלחיצה אחת
              </div>
            )}
          </div>

        </div>

        {/* Payment Checkout Section (Visible if not Pro) */}
        {!isPro && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-inner">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>תשלום בטוח ומאובטח להפעלת PRO</span>
            </h3>

            {/* Billing Cycle Toggle */}
            <div className="flex bg-slate-200/80 p-1 rounded-2xl mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 rounded-xl transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                תשלום חודשי (₪29 / חודש)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-2 rounded-xl transition relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>תשלום שנתי (₪290 / שנה)</span>
                <span className="mr-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-black">
                  חודשיים מתנה 🎉
                </span>
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-1.5 transition ${
                  paymentTab === 'card'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>כרטיס אשראי</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('bit')}
                className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-1.5 transition ${
                  paymentTab === 'bit'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Bit / Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('paypal')}
                className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-1.5 transition ${
                  paymentTab === 'paypal'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>PayPal</span>
              </button>
            </div>

            {/* Simulated Payment Form */}
            <form onSubmit={handleSimulatePayment} className="space-y-3">
              {paymentTab === 'card' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">שם מלא על הכרטיס</label>
                    <input
                      type="text"
                      placeholder="ישראל ישראלי"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">מספר כרטיס אשראי</label>
                    <input
                      type="text"
                      placeholder="4580 •••• •••• 1234"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      maxLength={19}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">תוקף (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="08/28"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        required
                        maxLength={5}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">קוד אבטחה (CVV)</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        required
                        maxLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentTab === 'bit' && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-slate-800">תשלום מהיר דרך אפליקציית Bit / Apple Pay</p>
                  <p className="text-[11px] text-slate-500">לחץ על כפתור התשלום למטה לאישור מיידי במכשירך</p>
                </div>
              )}

              {paymentTab === 'paypal' && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-slate-800">תשלום מאובטח באמצעות PayPal</p>
                  <p className="text-[11px] text-slate-500">יועבר לאישור מהיר בחשבון ה-PayPal שלך</p>
                </div>
              )}

              {/* Submit Payment Button */}
              <button
                type="submit"
                disabled={isProcessing || paymentSuccess}
                className="w-full mt-4 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>מעבד תשלום מאובטח... ⏳</span>
                ) : paymentSuccess ? (
                  <span>התשלום בוצע בהצלחה! 🎉</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      שלם ₪{billingCycle === 'monthly' ? '29' : '290'} והפעל מנוי PRO
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>תקן אבטחה PCI-DSS 256-bit SSL | ביטול בכל עת בלחיצת כפתור</span>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
