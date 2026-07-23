import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Sparkles,
  Trophy,
  Award,
  Send,
  Plus,
  Flame,
  CheckCircle2,
  Heart,
  Crown,
  UserPlus,
  ShieldCheck,
  Lock,
  Share2,
  Copy,
  Check,
  Zap,
  Smile,
  Bot,
  Calendar,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import {
  Friend,
  FriendCheer,
  PrivacySettings,
  Habit,
  SocialGroup,
  SocialGroupMessage,
  FeedItem,
  Challenge,
  LeaderboardUser,
} from '../types';
import {
  loadSocialGroups,
  saveSocialGroups,
  loadSocialMessages,
  saveSocialMessages,
  loadSocialFeed,
  saveSocialFeed,
  loadChallenges,
  saveChallenges,
  addQuickKudosToFeed,
} from '../utils/socialStore';
import { loadGamificationStats, saveGamificationStats, evaluateGamification } from '../utils/gamification';
import { fetchGoogleContacts } from '../lib/googleContacts';

interface SocialViewProps {
  privacySettings: PrivacySettings;
  onUpdatePrivacy: (newSettings: PrivacySettings) => void;
  friends: Friend[];
  cheers: FriendCheer[];
  onAddFriend: (inviteCode: string) => boolean;
  onSendCheer: (friendId: string, message: string, emoji: string) => void;
  myHabits: Habit[];
  userName?: string;
  userAvatar?: string;
}

export const SocialView: React.FC<SocialViewProps> = ({
  privacySettings,
  onUpdatePrivacy,
  friends,
  cheers,
  onAddFriend,
  onSendCheer,
  myHabits,
  userName = 'אני (אתה)',
  userAvatar = '🦸‍♂️',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chats' | 'feed' | 'leaderboard' | 'friends'>('chats');

  // Groups & Chat State
  const [groups, setGroups] = useState<SocialGroup[]>(loadSocialGroups);
  const [messages, setMessages] = useState<SocialGroupMessage[]>(loadSocialMessages);
  const [activeGroupId, setActiveGroupId] = useState<string>(groups[0]?.id || 'group_morning_heroes');
  const [chatInputText, setChatInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Feed State
  const [feedItems, setFeedItems] = useState<FeedItem[]>(loadSocialFeed);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Challenges State
  const [challenges, setChallenges] = useState<Challenge[]>(loadChallenges);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');
  const [newChallengeDays, setNewChallengeDays] = useState('7');
  const [newChallengePoints, setNewChallengePoints] = useState('150');

  // Friends & Invite Code State
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [addFriendSuccessMsg, setAddFriendSuccessMsg] = useState<string | null>(null);
  const [addFriendErrorMsg, setAddFriendErrorMsg] = useState<string | null>(null);
  const [isImportingGoogleContacts, setIsImportingGoogleContacts] = useState(false);

  const handleImportGoogleContacts = async () => {
    try {
      setIsImportingGoogleContacts(true);
      setAddFriendSuccessMsg(null);
      setAddFriendErrorMsg(null);

      const googleContacts = await fetchGoogleContacts();
      if (googleContacts.length === 0) {
        setAddFriendErrorMsg('לא נמצאו אנשי קשר בחשבון ה-Google שלך.');
        return;
      }

      let addedCount = 0;
      googleContacts.forEach((gc) => {
        const inviteCode = `GOOGLE-${gc.name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}`;
        const ok = onAddFriend(inviteCode);
        if (ok) addedCount++;
      });

      setAddFriendSuccessMsg(`יובאו ${googleContacts.length} אנשי קשר מ-Google Contacts! 🎉`);
    } catch (err: any) {
      console.error('Google contacts import error in SocialView:', err);
      setAddFriendErrorMsg(err.message || 'שגיאה ביבוא אנשי קשר מ-Google');
    } finally {
      setIsImportingGoogleContacts(false);
    }
  };

  // Auto scroll chat to bottom when messages change or active group switches
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGroupId, activeSubTab]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];
  const activeGroupMessages = messages.filter((m) => m.groupId === activeGroupId);

  // Quick Kudos Presets
  const QUICK_KUDOS_PRESETS = [
    { emoji: '👏', text: 'אלוף!' },
    { emoji: '💪', text: 'להמשיך בכל הכוח!' },
    { emoji: '🔥', text: 'אש עלייך!' },
    { emoji: '👑', text: 'מלך ההרגלים!' },
    { emoji: '🎉', text: 'כל הכבוד!' },
  ];

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeGroupId) return;

    const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const newMsg: SocialGroupMessage = {
      id: `msg_${Date.now()}`,
      groupId: activeGroupId,
      senderId: 'current_user',
      senderName: userName,
      senderAvatar: userAvatar,
      text: chatInputText.trim(),
      timestamp: timeStr,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    saveSocialMessages(updated);

    // Update group preview
    const updatedGroups = groups.map((g) =>
      g.id === activeGroupId
        ? {
            ...g,
            lastMessage: `${userName}: ${chatInputText.trim()}`,
            lastMessageTime: 'עכשיו',
          }
        : g
    );
    setGroups(updatedGroups);
    saveSocialGroups(updatedGroups);

    setChatInputText('');
  };

  // Handle Quick Kudos Click
  const handleQuickKudosClick = (feedItemId: string, emoji: string, text: string) => {
    addQuickKudosToFeed(feedItemId, userName, userAvatar, emoji, text);
    setFeedItems(loadSocialFeed());
    setMessages(loadSocialMessages());

    // Evaluate Gamification for social cheerer badge
    const stats = loadGamificationStats();
    const { updatedStats } = evaluateGamification(myHabits, stats, { type: 'social_cheer' });
    saveGamificationStats(updatedStats);

    triggerToast(`נשלח עידוד "${emoji} ${text}" בהצלחה! 15+ נקודות הוענקו! ✨`);
  };

  // Handle Create Challenge
  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallengeTitle.trim()) return;

    const daysNum = parseInt(newChallengeDays) || 7;
    const ptsNum = parseInt(newChallengePoints) || 150;

    const todayStr = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newChal: Challenge = {
      id: `chal_${Date.now()}`,
      title: newChallengeTitle.trim(),
      description: newChallengeDesc.trim() || 'אתגר עקביות והרגלים קבוצתי',
      category: 'health',
      targetDays: daysNum,
      rewardPoints: ptsNum,
      startDate: todayStr,
      endDate: endDate,
      status: 'active',
      createdByName: userName,
      participants: [
        { userId: 'current_user', userName, userAvatar, progressDays: 1, points: 25, isCurrentUser: true },
        ...friends.slice(0, 3).map((f, i) => ({
          userId: f.id,
          userName: f.name,
          userAvatar: f.avatar,
          progressDays: Math.max(0, i + 1),
          points: (i + 1) * 20,
        })),
      ],
    };

    const updated = [newChal, ...challenges];
    setChallenges(updated);
    saveChallenges(updated);

    setIsCreateChallengeOpen(false);
    setNewChallengeTitle('');
    setNewChallengeDesc('');
    triggerToast(`אתגר חדש "${newChal.title}" נפתח בהצלחה! 🎉`);
  };

  // Calculate Leaderboard
  const leaderboardUsers: LeaderboardUser[] = [
    {
      userId: 'current_user',
      name: `${userName}`,
      avatar: userAvatar,
      level: 12,
      currentStreak: 7,
      totalCompletions: 42,
      kudosPoints: 120,
      totalPoints: 42 * 10 + 7 * 15 + 120,
      isCurrentUser: true,
    },
    ...friends.map((f) => ({
      userId: f.id,
      name: f.name,
      avatar: f.avatar,
      level: f.level,
      currentStreak: f.bestStreak,
      totalCompletions: f.totalCompletions,
      kudosPoints: 60 + f.level * 10,
      totalPoints: f.totalCompletions * 10 + f.bestStreak * 15 + (60 + f.level * 10),
    })),
  ].sort((a, b) => b.totalPoints - a.totalPoints);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(privacySettings.myInviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendSuccessMsg(null);
    setAddFriendErrorMsg(null);

    if (!friendCodeInput.trim()) return;

    const success = onAddFriend(friendCodeInput.trim());
    if (success) {
      setAddFriendSuccessMsg('בקשת חברות אושרה בהצלחה! 🎉');
      setFriendCodeInput('');
    } else {
      setAddFriendErrorMsg('קוד חבר לא תקין או שהחבר כבר ברשימה שלך.');
    }
  };

  return (
    <div className="space-y-6 pb-12 dir-rtl text-right" dir="rtl">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-xl border border-slate-700 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Section Selector */}
      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[32px] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-100 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>קהילת ההרגלים והתמיכה</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 italic">
            רשת חברתית, צ'אטים, פיד עידודים ותחרויות
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 max-w-xl">
            שתף השלמת הרגלים בצ'אט הקבוצתי, קבל עידודים וחיזוקים מחברים ופסג את הדירוג בלוח התחרויות
          </p>
        </div>

        {/* Invite Code Badge */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md border border-slate-800 w-full md:w-auto shrink-0">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">קוד ההזמנה שלך</span>
            <span className="font-mono text-lg font-black text-amber-400">{privacySettings.myInviteCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-200"
            title="העתק קוד"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('chats')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'chats'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>קבוצות וצ'אטים</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{groups.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('feed')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'feed'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>פיד עידודים וחיזוקים</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{feedItems.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leaderboard')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'leaderboard'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>תחרויות וטבלת מובילים</span>
        </button>

        <button
          onClick={() => setActiveSubTab('friends')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'friends'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>חברים ופרטיות</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">{friends.length}</span>
        </button>
      </div>

      {/* SUB-TAB 1: GROUPS & CHATS (קבוצות וצ'אטים) */}
      {activeSubTab === 'chats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Left / Right Sidebar: Conversation List */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>שיחות וקבוצות</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {groups.length} קבוצות
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {groups.map((group) => {
                const isSelected = group.id === activeGroupId;
                return (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className={`w-full p-3 rounded-2xl text-right transition flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                        : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-xs">
                      {group.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 truncate">{group.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{group.lastMessageTime}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {group.lastMessage || group.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl shadow-xs flex flex-col h-full overflow-hidden">
            {/* Active Group Header */}
            {activeGroup && (
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-slate-700">
                    {activeGroup.avatar}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">{activeGroup.name}</h3>
                    <p className="text-[11px] text-slate-400">{activeGroup.membersCount} חברים בקבוצה • {activeGroup.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {activeGroupMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  עדיין אין הודעות בקבוצה זו. עדכן הרגלים או שלח הודעה ראשונה!
                </div>
              ) : (
                activeGroupMessages.map((msg) => {
                  const isMe = msg.senderId === 'current_user';
                  const isSystem = msg.isSystemMessage;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="my-3 flex justify-center">
                        <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 px-4 py-2 rounded-2xl shadow-xs text-center max-w-md">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-slate-800">
                            <Bot className="w-4 h-4 text-amber-600" />
                            <span>{msg.text}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{msg.timestamp}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-base shrink-0 shadow-xs">
                        {msg.senderAvatar}
                      </div>

                      <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end text-left' : ''}`}>
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] font-bold text-slate-500">{msg.senderName}</span>
                          <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs font-bold leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="כתוב הודעה לקבוצה..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>שלח</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FEED & KUDOS (פיד עידודים וחיזוקים) */}
      {activeSubTab === 'feed' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">
                Social Activity & Kudos Stream
              </span>
              <h3 className="text-xl font-black mt-0.5">פיד עדכונים וחיזוקים בזמן אמת</h3>
              <p className="text-xs text-indigo-200 mt-1">
                לחץ על כפתורי העידוד המהירים כדי להעניק נקודות בונוס ולהרים לחברים!
              </p>
            </div>
            <Sparkles className="w-10 h-10 text-amber-300 shrink-0" />
          </div>

          <div className="space-y-4">
            {feedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shadow-xs">
                      {item.userAvatar}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{item.userName}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold">{item.timestamp}</p>
                    </div>
                  </div>

                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>רצף {item.streakCount} ימים</span>
                  </span>
                </div>

                {/* Content Body */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">הרגל שהושלם:</span>
                    <span className="font-extrabold text-sm text-slate-900">{item.habitName}</span>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>

                {/* Quick Kudos Buttons Bar */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-2">שלח עידוד מהיר (+15 נקודות בונוס):</span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_KUDOS_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickKudosClick(item.id, preset.emoji, preset.text)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-bold text-xs rounded-xl border border-slate-200/80 transition flex items-center gap-1.5 active:scale-95"
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Received Kudos List */}
                {item.kudosList.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">עידודים שהתקבלו ({item.kudosList.length}):</span>
                    <div className="flex flex-wrap gap-2">
                      {item.kudosList.map((k) => (
                        <div
                          key={k.id}
                          className="px-3 py-1 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-900 flex items-center gap-1.5"
                        >
                          <span>{k.emoji}</span>
                          <span>{k.fromUserName}: "{k.text}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CHALLENGES & LEADERBOARD (תחרויות וטבלת מובילים) */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-8">
          {/* Active Challenges Banner & Creator Button */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>תחרויות ואתגרים קבוצתיים active ({challenges.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">פתח תחרות מוגדרת בזמן והזמן חברים להתחרות על המקום הראשון</p>
            </div>

            <button
              onClick={() => setIsCreateChallengeOpen(true)}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>פתח אתגר / תחרות חדשה</span>
            </button>
          </div>

          {/* Active Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((chal) => (
              <div key={chal.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    אתגר {chal.targetDays} ימים • {chal.rewardPoints} נקודות
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">נוצר ע"י {chal.createdByName}</span>
                </div>

                <div>
                  <h4 className="font-black text-base text-slate-900">{chal.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{chal.description}</p>
                </div>

                {/* Progress Participants */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block">מובילי האתגר:</span>
                  {chal.participants.map((p, idx) => {
                    const pct = Math.round((p.progressDays / chal.targetDays) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-slate-800">
                            <span>{p.userAvatar}</span>
                            <span>{p.userName}</span>
                            {p.isCurrentUser && <span className="text-[10px] text-indigo-600 font-extrabold">(אתה)</span>}
                          </span>
                          <span className="text-indigo-600">{p.progressDays} מתוך {chal.targetDays} ימים ({p.points} נק')</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Global Leaderboard Section */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <span>טבלת מובילים כללית (Leaderboard)</span>
                </h3>
                <p className="text-xs text-slate-400">דירוג חברים לפי נקודות ביצוע, רצפים ועידודים שנצברו</p>
              </div>
            </div>

            {/* Podium Top 3 Display */}
            <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-4 text-center">
              {/* 2nd Place */}
              {leaderboardUsers[1] && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-end mt-6 shadow-xs">
                  <span className="text-2xl mb-1">🥈</span>
                  <div className="text-2xl">{leaderboardUsers[1].avatar}</div>
                  <span className="font-extrabold text-xs text-slate-900 mt-1 truncate max-w-full">{leaderboardUsers[1].name}</span>
                  <span className="text-[10px] font-bold text-slate-500">{leaderboardUsers[1].totalPoints} נקודות</span>
                </div>
              )}

              {/* 1st Place */}
              {leaderboardUsers[0] && (
                <div className="bg-gradient-to-b from-amber-50 to-amber-100/60 border-2 border-amber-300 rounded-2xl p-4 flex flex-col items-center justify-end shadow-md relative">
                  <div className="absolute -top-3 bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs">
                    מקום 1 🥇
                  </div>
                  <div className="text-3xl mt-2">{leaderboardUsers[0].avatar}</div>
                  <span className="font-black text-sm text-slate-900 mt-1 truncate max-w-full">{leaderboardUsers[0].name}</span>
                  <span className="text-xs font-black text-amber-700">{leaderboardUsers[0].totalPoints} נקודות</span>
                </div>
              )}

              {/* 3rd Place */}
              {leaderboardUsers[2] && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-end mt-8 shadow-xs">
                  <span className="text-2xl mb-1">🥉</span>
                  <div className="text-2xl">{leaderboardUsers[2].avatar}</div>
                  <span className="font-extrabold text-xs text-slate-900 mt-1 truncate max-w-full">{leaderboardUsers[2].name}</span>
                  <span className="text-[10px] font-bold text-slate-500">{leaderboardUsers[2].totalPoints} נקודות</span>
                </div>
              )}
            </div>

            {/* Leaderboard Full Table */}
            <div className="space-y-2 pt-4">
              {leaderboardUsers.map((u, idx) => (
                <div
                  key={u.userId}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                    u.isCurrentUser
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-xs text-slate-400">#{idx + 1}</span>
                    <div className="text-2xl">{u.avatar}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{u.name}</span>
                        {u.isCurrentUser && <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">אתה</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        רצף שיא: {u.currentStreak} ימים • סך הכל {u.totalCompletions} ביצועים
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="font-black text-sm text-indigo-700">{u.totalPoints} נקודות</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: FRIENDS & PRIVACY (חברים ופרטיות) */}
      {activeSubTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>חברים מחוברים ({friends.length})</span>
              </h3>

              {friends.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  עדיין אין חברים מחוברים. שתף את קוד ההזמנה שלך להוספה!
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((f) => (
                    <div key={f.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{f.avatar}</div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">{f.name}</h4>
                          <span className="text-[10px] text-slate-500 font-bold">רצף שיא: {f.bestStreak} ימים</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">מחובר ✓</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Google Contacts Integration Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-700/80 rounded-3xl p-6 text-white shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center font-black text-lg text-indigo-200 shrink-0">
                  G
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Google Contacts</h3>
                  <p className="text-[11px] text-indigo-200 font-medium">יבא אנשי קשר מחשבון ה-Google שלך</p>
                </div>
              </div>

              <p className="text-xs text-indigo-100/90 leading-relaxed">
                סנכרן בלחיצה אחת את אנשי הקשר שלך ב-Google כדי לשתף אתגרים, לבנות קבוצות ולשמור על רצף הרגלים יחד.
              </p>

              <button
                type="button"
                onClick={handleImportGoogleContacts}
                disabled={isImportingGoogleContacts}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 active:scale-98 disabled:opacity-50 text-white text-xs font-extrabold rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
              >
                {isImportingGoogleContacts ? (
                  <span>סורק ומייבא אנשי קשר...</span>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>סנכרן Google Contacts עכשיו</span>
                  </>
                )}
              </button>
            </div>

            {/* Add Friend Box */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>הוסף חבר חדש</span>
              </h3>
              <form onSubmit={handleAddFriendSubmit} className="space-y-3">
                <input
                  type="text"
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  placeholder="קוד חבר (למשל: HERO-9921)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase focus:outline-none"
                />

                {addFriendSuccessMsg && <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl font-bold">{addFriendSuccessMsg}</div>}
                {addFriendErrorMsg && <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-xl font-bold">{addFriendErrorMsg}</div>}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition"
                >
                  הוסף חבר
                </button>
              </form>
            </div>

            {/* Privacy Controls */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>הגדרות פרטיות ושיתוף</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>שתף אורך רצף (Streak)</span>
                  <button
                    onClick={() => onUpdatePrivacy({ ...privacySettings, shareStreaks: !privacySettings.shareStreaks })}
                    className={`px-3 py-1 rounded-xl text-[10px] text-white font-bold ${
                      privacySettings.shareStreaks ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    {privacySettings.shareStreaks ? 'מופעל' : 'כבוי'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-bold border-t border-slate-100 pt-3">
                  <span>שתף שמות הרגלים</span>
                  <button
                    onClick={() => onUpdatePrivacy({ ...privacySettings, shareHabitNames: !privacySettings.shareHabitNames })}
                    className={`px-3 py-1 rounded-xl text-[10px] text-white font-bold ${
                      privacySettings.shareHabitNames ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    {privacySettings.shareHabitNames ? 'מופעל' : 'כבוי'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {isCreateChallengeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>יצירת אתגר / תחרות חדשה</span>
            </h3>

            <form onSubmit={handleCreateChallenge} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">שם האתגר</label>
                <input
                  type="text"
                  required
                  value={newChallengeTitle}
                  onChange={(e) => setNewChallengeTitle(e.target.value)}
                  placeholder="למשל: אתגר 7 ימים רצופים של קריאה"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">תיאור קצר</label>
                <input
                  type="text"
                  value={newChallengeDesc}
                  onChange={(e) => setNewChallengeDesc(e.target.value)}
                  placeholder="למשל: מי שמשלים קריאה בכל יום מקבל נקודות בונוס"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">משך האתגר (בימים)</label>
                  <select
                    value={newChallengeDays}
                    onChange={(e) => setNewChallengeDays(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                  >
                    <option value="3">3 ימים</option>
                    <option value="7">7 ימים (שבוע)</option>
                    <option value="14">14 ימים (שבועיים)</option>
                    <option value="30">30 ימים (חודש)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">נקודות פרס למנצח</label>
                  <input
                    type="number"
                    value={newChallengePoints}
                    onChange={(e) => setNewChallengePoints(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateChallengeOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition"
                >
                  פתח אתגר עכשיו
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
