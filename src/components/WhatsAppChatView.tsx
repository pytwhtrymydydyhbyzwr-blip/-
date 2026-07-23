import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Plus,
  Send,
  Trophy,
  Check,
  X,
  Search,
  Bell,
  Sparkles,
  Award,
  Crown,
  ChevronRight,
  Clock,
  ShieldAlert,
  Share2,
  CheckCircle2,
  Info,
  Flame,
  Camera,
  Image as ImageIcon,
  Eye,
  CircleDot,
  Heart,
  Maximize2,
  Download,
  Smile,
  Film,
  User,
  Phone,
  Video,
  Mic,
  MicOff,
  Play,
  Pause,
  Pin,
  CheckCheck,
  MoreVertical,
  Volume2,
  VolumeX,
  Palette,
  UserPlus,
  Medal,
  Activity,
  SmilePlus,
} from 'lucide-react';
import { checkContentModeration } from '../utils/contentModeration';
import { ModerationAlertModal } from './ModerationAlertModal';
import { soundFX } from '../utils/audio';
import { getStoredUsers, getCurrentUser } from '../utils/auth';
import {
  publishPublicProfileToFirestore,
  subscribeToPublicProfiles,
  publishChatMessageToFirestore,
  subscribeToChatMessages,
  publishStatusStoryToFirestore,
  subscribeToStatusStories,
} from '../lib/firestoreSync';
import { fetchGoogleContacts } from '../lib/googleContacts';

export interface ChatMember {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  progressDays: number;
}

export interface ChallengeCardData {
  id: string;
  title: string;
  durationDays: number;
  rewardPoints: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: string;
  text: string;
  type: 'text' | 'challenge_invite' | 'system' | 'image' | 'voice';
  challengeData?: ChallengeCardData;
  imageUrl?: string;
  imageCaption?: string;
  voiceDuration?: number; // seconds
  voiceAudioUrl?: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export interface ChatSession {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  statusText: string;
  challengeTitle?: string;
  unreadCount: number;
  lastMessage: string;
  lastTime: string;
  isPinned?: boolean;
  members: ChatMember[];
}

export interface UserStatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  type: 'text' | 'image';
  textContent?: string;
  imageUrl?: string;
  bgColor?: string;
  viewsCount: number;
  likesCount: number;
  hasSeen?: boolean;
}

export interface ContactPerson {
  id: string;
  name: string;
  avatar: string;
  phoneOrEmail: string;
  inviteCode: string;
  statusBio: string;
  level: number;
  bestStreak: number;
  habitsCount: number;
  online: boolean;
}

export interface CallLogItem {
  id: string;
  contactName: string;
  contactAvatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  isVideo: boolean;
  timestamp: string;
}

interface WhatsAppChatViewProps {
  currentUserName?: string;
  currentUserAvatar?: string;
}

// Preset Demo Habit Photos for Quick Image Sharing
const PRESET_HABIT_PHOTOS = [
  {
    title: 'אימון כושר וריצה 🏃‍♂️',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'ספר וקריאה יומית 📚',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'שתיית מים ובריאות 💧',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'מדיטציה ורוגע 🧘‍♀️',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'תזונה בריאה וסלט 🥗',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
  },
];

// Initial Contacts List (Empty - loaded dynamically from real registered accounts & Firestore)
const INITIAL_CONTACTS: ContactPerson[] = [];

// Initial Statuses (Empty - loaded dynamically from Firestore)
const INITIAL_STATUSES: UserStatusStory[] = [];

// Initial Chats (Default Community Chat for real users)
const INITIAL_CHATS: ChatSession[] = [
  {
    id: 'chat_group_community',
    name: 'קהילת HabitHero הרשמית 🏆',
    avatar: '🌟',
    isGroup: true,
    statusText: 'קבוצה פתוחה לכל חברי קהילת HabitHero',
    challengeTitle: 'קבוצת הקהילה הראשית',
    unreadCount: 0,
    lastMessage: 'ברוכים הבאים לקהילת HabitHero הרשמית!',
    lastTime: 'עכשיו',
    isPinned: true,
    members: [
      { id: 'u1', name: 'אני (אתה)', avatar: '🦸‍♂️', score: 100, rank: 1, progressDays: 1 },
    ],
  },
];

// Initial Messages
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  chat_group_community: [
    {
      id: 'msg_welcome_1',
      chatId: 'chat_group_community',
      senderId: 'system',
      senderName: 'מערכת',
      senderAvatar: '🤖',
      timestamp: 'עכשיו',
      text: '🎉 ברוכים הבאים לצ\'אט הקהילתי של HabitHero! כאן תוכלו להתכתב, לשתף הישגים ולאתגר חברים בלייב.',
      type: 'system',
    },
  ],
};

// Call logs demo (Empty)
const INITIAL_CALL_LOGS: CallLogItem[] = [];

export const WhatsAppChatView: React.FC<WhatsAppChatViewProps> = ({
  currentUserName = 'אני (אתה)',
  currentUserAvatar = '🦸‍♂️',
}) => {
  const [chats, setChats] = useState<ChatSession[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string>('chat_group_community');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [contacts, setContacts] = useState<ContactPerson[]>(INITIAL_CONTACTS);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>(INITIAL_CALL_LOGS);
  const [isImportingGoogleContacts, setIsImportingGoogleContacts] = useState(false);

  // Tab mode in sidebar: 'chats' | 'statuses' | 'contacts' | 'challenges' | 'calls'
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'statuses' | 'contacts' | 'challenges' | 'calls'>('chats');

  // Statuses state
  const [statuses, setStatuses] = useState<UserStatusStory[]>(INITIAL_STATUSES);
  const [activeStoryView, setActiveStoryView] = useState<UserStatusStory | null>(null);
  const [isCreateStatusModalOpen, setIsCreateStatusModalOpen] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusImageUrl, setStatusImageUrl] = useState('');
  const [statusBgColor, setStatusBgColor] = useState('from-indigo-900 to-purple-900');

  // Chat & Image Sharing state
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareImageModalOpen, setIsShareImageModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  // Voice recording state simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Active Simulated Call Overlay (Voice/Video)
  const [activeCall, setActiveCall] = useState<{
    contactName: string;
    contactAvatar: string;
    isVideo: boolean;
    seconds: number;
    isMuted: boolean;
  } | null>(null);
  const callTimerRef = useRef<any>(null);

  // Lightbox Image Preview
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Profile Picture & Bio Change Modal
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false);
  const [userProfileAvatar, setUserProfileAvatar] = useState<string>(currentUserAvatar);
  const [userStatusBio, setUserStatusBio] = useState<string>('זמין/ה ב-HabitHero 🚀');

  // Add Contact Modal
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactCode, setNewContactCode] = useState('');

  // Wallpaper / Chat Theme Selector
  const [wallpaperTheme, setWallpaperTheme] = useState<'dark' | 'doodle' | 'emerald' | 'midnight'>('dark');

  // Modals & Panels
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isSendChallengeModalOpen, setIsSendChallengeModalOpen] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupAvatar, setNewGroupAvatar] = useState('🏆');

  const [newChalTitle, setNewChalTitle] = useState('');
  const [newChalDays, setNewChalDays] = useState('7');
  const [newChalPoints, setNewChalPoints] = useState('100');

  // Moderation filter state
  const [isModerationAlertOpen, setIsModerationAlertOpen] = useState(false);
  const [blockedWord, setBlockedWord] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const activeMessages = messagesMap[activeChatId] || [];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, activeChatId]);

  // Publish profile & sync registered accounts + firestore public profiles
  useEffect(() => {
    const curUser = getCurrentUser();
    const currentUid = curUser?.id || 'u1';
    const cName = curUser?.fullName || currentUserName;
    const cAvatar = curUser?.avatar || currentUserAvatar;

    // Publish current user's profile to Firestore
    publishPublicProfileToFirestore({
      uid: currentUid,
      fullName: cName,
      username: curUser?.username || cName,
      avatar: cAvatar,
      statusBio: 'פעיל ב-HabitHero 🚀',
      level: 1,
      bestStreak: 1,
    });

    // Merge registered local users into contacts list
    const stored = getStoredUsers();
    if (stored.length > 0) {
      setContacts((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newFromStored: ContactPerson[] = stored
          .filter((u) => u.id !== currentUid && !existingIds.has(u.id))
          .map((u, idx) => ({
            id: u.id,
            name: u.fullName,
            avatar: u.avatar || '🦸‍♂️',
            phoneOrEmail: u.username,
            inviteCode: `USER-${u.username.toUpperCase()}`,
            statusBio: 'משתמש רשום במערכת 🌟',
            level: 5 + idx,
            bestStreak: 7 + idx,
            habitsCount: 3,
            online: true,
          }));
        return [...prev, ...newFromStored];
      });
    }

    // Subscribe to Firestore Public Profiles for live discovery
    const unsubscribeProfiles = subscribeToPublicProfiles((pubProfiles) => {
      if (pubProfiles && pubProfiles.length > 0) {
        setContacts((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          pubProfiles.forEach((p) => {
            if (p.uid && p.uid !== currentUid) {
              map.set(p.uid, {
                id: p.uid,
                name: p.fullName || 'משתמש',
                avatar: p.avatar || '🦸‍♂️',
                phoneOrEmail: p.username || 'user',
                inviteCode: `USER-${(p.username || p.uid).substring(0, 6).toUpperCase()}`,
                statusBio: p.statusBio || 'מחובר בלייב ⚡',
                level: p.level || 1,
                bestStreak: p.bestStreak || 0,
                habitsCount: 3,
                online: true,
              });
            }
          });
          return Array.from(map.values());
        });
      }
    });

    // Subscribe to Status Stories in real-time
    const unsubscribeStatuses = subscribeToStatusStories((fsStatuses) => {
      if (fsStatuses && fsStatuses.length > 0) {
        setStatuses((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const incomingNew = fsStatuses
            .filter((s) => s.id && !existingIds.has(s.id))
            .map((s) => ({
              id: s.id,
              userId: s.userId || 'u_remote',
              userName: s.userName || 'חבר',
              userAvatar: s.userAvatar || '🦸‍♂️',
              timestamp: s.timestamp || 'עכשיו',
              type: s.type || 'text',
              textContent: s.textContent,
              imageUrl: s.imageUrl,
              bgColor: s.bgColor || 'from-emerald-800 to-teal-900',
              viewsCount: s.viewsCount || 1,
              likesCount: s.likesCount || 0,
            }));
          return [...incomingNew, ...prev];
        });
      }
    });

    return () => {
      unsubscribeProfiles();
      unsubscribeStatuses();
    };
  }, [currentUserName, currentUserAvatar]);

  // Subscribe to real-time chat messages for activeChatId
  useEffect(() => {
    if (!activeChatId) return;

    const unsubscribeMessages = subscribeToChatMessages(activeChatId, (incomingMsgs) => {
      if (incomingMsgs && incomingMsgs.length > 0) {
        setMessagesMap((prev) => {
          const currentList = prev[activeChatId] || [];
          const existingIds = new Set(currentList.map((m) => m.id));
          const newItems = incomingMsgs.filter((m) => m.id && !existingIds.has(m.id));

          if (newItems.length === 0) return prev;

          const formattedNew: ChatMessage[] = newItems.map((m) => ({
            id: m.id,
            chatId: activeChatId,
            senderId: m.senderId || 'remote',
            senderName: m.senderName || 'חבר',
            senderAvatar: m.senderAvatar || '🦸‍♂️',
            timestamp: m.timestampStr || m.timestamp || new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            text: m.text || '',
            type: m.type || 'text',
            challengeData: m.challengeData,
            imageUrl: m.imageUrl,
            imageCaption: m.imageCaption,
            voiceDuration: m.voiceDuration,
            reactions: m.reactions,
          }));

          // Also update chat session last message
          const lastMsg = formattedNew[formattedNew.length - 1];
          if (lastMsg) {
            setChats((prevChats) =>
              prevChats.map((c) =>
                c.id === activeChatId
                  ? { ...c, lastMessage: `${lastMsg.senderName}: ${lastMsg.text}`, lastTime: lastMsg.timestamp }
                  : c
              )
            );
          }

          return {
            ...prev,
            [activeChatId]: [...currentList, ...formattedNew],
          };
        });
      }
    });

    return () => {
      unsubscribeMessages();
    };
  }, [activeChatId]);

  // Voice recording timer handle
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecordingVoice]);

  // Call duration timer handle
  useEffect(() => {
    if (activeCall) {
      callTimerRef.current = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, seconds: prev.seconds + 1 } : null));
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [activeCall !== null]);

  // Send Normal Text Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeChatId) return;

    const mod = checkContentModeration(inputMessage);
    if (!mod.isClean) {
      setBlockedWord(mod.blockedWord || '');
      setIsModerationAlertOpen(true);
      return;
    }

    const nowStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const curUser = getCurrentUser();
    const curUid = curUser?.id || 'u1';

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      chatId: activeChatId,
      senderId: curUid,
      senderName: currentUserName,
      senderAvatar: userProfileAvatar,
      timestamp: nowStr,
      text: inputMessage.trim(),
      type: 'text',
    };

    publishChatMessageToFirestore(activeChatId, newMsg);

    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessage: `${currentUserName}: ${inputMessage.trim()}`, lastTime: nowStr }
          : c
      )
    );

    setInputMessage('');
    soundFX.playCompleteSound();
  };

  // Send Voice Message Simulation
  const handleFinishVoiceRecord = () => {
    setIsRecordingVoice(false);
    if (recordingSeconds < 1) return;

    const nowStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const curUser = getCurrentUser();
    const curUid = curUser?.id || 'u1';

    const newMsg: ChatMessage = {
      id: `msg_voice_${Date.now()}`,
      chatId: activeChatId,
      senderId: curUid,
      senderName: currentUserName,
      senderAvatar: userProfileAvatar,
      timestamp: nowStr,
      text: `הודעה קולית (${recordingSeconds} שניות)`,
      type: 'voice',
      voiceDuration: recordingSeconds,
    };

    publishChatMessageToFirestore(activeChatId, newMsg);

    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessage: `🎤 הודעה קולית (${recordingSeconds} שניות)`, lastTime: nowStr }
          : c
      )
    );

    triggerToast('ההודעה הקולית נשלחה בהצלחה! 🎙️');
  };

  // Send Photo / Image Message
  const handleSendPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const photoToUse = customPhotoInput.trim() || selectedPhotoUrl;
    if (!photoToUse || !activeChatId) return;

    if (photoCaption) {
      const mod = checkContentModeration(photoCaption);
      if (!mod.isClean) {
        setBlockedWord(mod.blockedWord || '');
        setIsModerationAlertOpen(true);
        return;
      }
    }

    const nowStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const curUser = getCurrentUser();
    const curUid = curUser?.id || 'u1';

    const newMsg: ChatMessage = {
      id: `msg_img_${Date.now()}`,
      chatId: activeChatId,
      senderId: curUid,
      senderName: currentUserName,
      senderAvatar: userProfileAvatar,
      timestamp: nowStr,
      text: photoCaption.trim() || 'תמונה שותפה בצ\'אט 📷',
      type: 'image',
      imageUrl: photoToUse,
      imageCaption: photoCaption.trim(),
    };

    publishChatMessageToFirestore(activeChatId, newMsg);

    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessage: `📷 תמונה: ${photoCaption.trim() || 'שיתוף תמונה'}`, lastTime: nowStr }
          : c
      )
    );

    setIsShareImageModalOpen(false);
    setSelectedPhotoUrl('');
    setCustomPhotoInput('');
    setPhotoCaption('');
    triggerToast('התמונה שותפה בהצלחה בצ\'אט! 📸');
  };

  // Add Emoji Reaction to Message
  const handleAddReaction = (messageId: string, emoji: string) => {
    const curUser = getCurrentUser();
    const curUid = curUser?.id || 'u1';

    setMessagesMap((prev) => {
      const msgs = prev[activeChatId] || [];
      const updated = msgs.map((m) => {
        if (m.id === messageId) {
          const currentReactions = m.reactions || {};
          const usersForEmoji = (currentReactions[emoji] as string[]) || [];
          const hasReacted = usersForEmoji.includes(curUid);
          const nextUsers = hasReacted
            ? usersForEmoji.filter((u) => u !== curUid)
            : [...usersForEmoji, curUid];

          const newReactions = {
            ...currentReactions,
            [emoji]: nextUsers,
          };

          const updatedMsg = { ...m, reactions: newReactions };
          publishChatMessageToFirestore(activeChatId, updatedMsg);
          return updatedMsg;
        }
        return m;
      });
      return { ...prev, [activeChatId]: updated };
    });
  };

  // Create New Status Story
  const handleCreateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim() && !statusImageUrl.trim()) return;

    if (statusText) {
      const mod = checkContentModeration(statusText);
      if (!mod.isClean) {
        setBlockedWord(mod.blockedWord || '');
        setIsModerationAlertOpen(true);
        return;
      }
    }

    const curUser = getCurrentUser();
    const curUid = curUser?.id || 'u1';

    const newStory: UserStatusStory = {
      id: `status_${Date.now()}`,
      userId: curUid,
      userName: currentUserName,
      userAvatar: userProfileAvatar,
      timestamp: 'עכשיו',
      type: statusImageUrl ? 'image' : 'text',
      imageUrl: statusImageUrl.trim() || undefined,
      textContent: statusText.trim() || undefined,
      bgColor: statusBgColor,
      viewsCount: 1,
      likesCount: 0,
      hasSeen: true,
    };

    publishStatusStoryToFirestore(newStory);

    setStatuses([newStory, ...statuses]);
    setIsCreateStatusModalOpen(false);
    setStatusText('');
    setStatusImageUrl('');
    triggerToast('הסטטוס החדש שלך פורסם בהצלחה! 🌟');
  };

  // Send Inline Challenge Invitation Card
  const handleSendChallengeInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChalTitle.trim()) return;

    const mod = checkContentModeration(newChalTitle);
    if (!mod.isClean) {
      setBlockedWord(mod.blockedWord || '');
      setIsModerationAlertOpen(true);
      return;
    }

    const nowStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const curUser = getCurrentUser();
    const curUid = curUser?.id || 'u1';

    const newMsg: ChatMessage = {
      id: `msg_chal_${Date.now()}`,
      chatId: activeChatId,
      senderId: curUid,
      senderName: currentUserName,
      senderAvatar: userProfileAvatar,
      timestamp: nowStr,
      text: `שלחתי הזמנה לאתגר: ${newChalTitle.trim()}`,
      type: 'challenge_invite',
      challengeData: {
        id: `chal_${Date.now()}`,
        title: newChalTitle.trim(),
        durationDays: parseInt(newChalDays) || 7,
        rewardPoints: parseInt(newChalPoints) || 100,
        status: 'pending',
      },
    };

    publishChatMessageToFirestore(activeChatId, newMsg);

    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessage: `🏆 הזמנה לאתגר: ${newChalTitle.trim()}`, lastTime: nowStr }
          : c
      )
    );

    setIsSendChallengeModalOpen(false);
    setNewChalTitle('');
    triggerToast('כרטיס ההזמנה לאתגר נשלח לחלון השיחה! 🚀');
  };

  // Respond to Challenge Card inside Chat
  const handleChallengeAction = (messageId: string, accept: boolean) => {
    setMessagesMap((prev) => {
      const chatMsgs = prev[activeChatId] || [];
      const updated = chatMsgs.map((msg) => {
        if (msg.id === messageId && msg.challengeData) {
          return {
            ...msg,
            challengeData: {
              ...msg.challengeData,
              status: (accept ? 'accepted' : 'declined') as 'accepted' | 'declined',
            },
          };
        }
        return msg;
      });
      return { ...prev, [activeChatId]: updated };
    });

    if (accept) {
      triggerToast('הצטרפת בהצלחה לאתגר! בהצלחה בתחרות 🏆');
    } else {
      triggerToast('ההזמנה לאתגר נדחתה.');
    }
  };

  // Create New Group
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const modName = checkContentModeration(newGroupName);
    const modDesc = checkContentModeration(newGroupDesc);

    if (!modName.isClean || !modDesc.isClean) {
      setBlockedWord(modName.blockedWord || modDesc.blockedWord || '');
      setIsModerationAlertOpen(true);
      return;
    }

    const newChat: ChatSession = {
      id: `chat_group_${Date.now()}`,
      name: newGroupName.trim(),
      avatar: newGroupAvatar,
      isGroup: true,
      statusText: newGroupDesc.trim() || 'קבוצת אתגר חדשה',
      unreadCount: 0,
      lastMessage: 'קבוצה חדשה נוצרה!',
      lastTime: 'עכשיו',
      members: [
        { id: 'u1', name: currentUserName, avatar: userProfileAvatar, score: 100, rank: 1, progressDays: 1 },
      ],
    };

    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setIsCreateGroupModalOpen(false);
    setNewGroupName('');
    setNewGroupDesc('');
    triggerToast(`קבוצת האתגר "${newChat.name}" נוצרה בהצלחה! 🎉`);
  };

  // Add Contact by Code
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactCode.trim()) return;

    const cleanCode = newContactCode.trim().toUpperCase();
    const existing = contacts.find((c) => c.inviteCode.toUpperCase() === cleanCode);
    if (existing) {
      triggerToast(`איש הקשר ${existing.name} כבר נמצא ברשימה שלך!`);
      setIsAddContactModalOpen(false);
      setNewContactCode('');
      return;
    }

    const newContact: ContactPerson = {
      id: `u_${Date.now()}`,
      name: `חבר קשר ${cleanCode}`,
      avatar: '🌟',
      phoneOrEmail: '050-8889900',
      inviteCode: cleanCode,
      statusBio: 'מתמיד ומשיג יעדים! 💪',
      level: 10,
      bestStreak: 14,
      habitsCount: 3,
      online: true,
    };

    setContacts([newContact, ...contacts]);
    setIsAddContactModalOpen(false);
    setNewContactCode('');
    triggerToast(`איש הקשר התווסף בהצלחה למכשיר! 📱`);
  };

  // Direct Start Chat with Contact
  const handleStartChatWithContact = (contact: ContactPerson) => {
    let existingChat = chats.find((c) => c.name === contact.name && !c.isGroup);
    if (!existingChat) {
      existingChat = {
        id: `chat_${contact.id}`,
        name: contact.name,
        avatar: contact.avatar,
        isGroup: false,
        statusText: contact.statusBio,
        unreadCount: 0,
        lastMessage: 'שיחה חדשה נפתחה',
        lastTime: 'עכשיו',
        members: [
          { id: 'u1', name: currentUserName, avatar: userProfileAvatar, score: 100, rank: 1, progressDays: 1 },
          { id: contact.id, name: contact.name, avatar: contact.avatar, score: 80, rank: 2, progressDays: 1 },
        ],
      };
      setChats([existingChat, ...chats]);
    }
    setActiveChatId(existingChat.id);
    setSidebarTab('chats');
  };

  // Import Google Contacts handler
  const handleImportGoogleContacts = async () => {
    try {
      setIsImportingGoogleContacts(true);
      const googleContacts = await fetchGoogleContacts();
      if (googleContacts.length === 0) {
        triggerToast('לא נמצאו אנשי קשר בחשבון ה-Google שלך.');
        return;
      }

      const convertedContacts: ContactPerson[] = googleContacts.map((gc, index) => ({
        id: `google_${gc.id}_${index}`,
        name: gc.name,
        avatar: gc.photoUrl ? '👤' : '🦸‍♂️',
        phoneOrEmail: gc.email || gc.phone || 'Google Contact',
        inviteCode: `GOOGLE-${gc.name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}`,
        statusBio: gc.email ? `מייבא מ-Google (${gc.email})` : 'איש קשר מ-Google',
        level: 1,
        bestStreak: 0,
        habitsCount: 0,
        online: true,
      }));

      setContacts((prev) => {
        const existingNames = new Set(prev.map((c) => c.name));
        const filtered = convertedContacts.filter((c) => !existingNames.has(c.name));
        return [...prev, ...filtered];
      });

      triggerToast(`יובאו ${googleContacts.length} אנשי קשר מ-Google Contacts בהצלחה! 🎉`);
      setIsAddContactModalOpen(false);
    } catch (err: any) {
      console.error('Google contacts import error:', err);
      triggerToast(err.message || 'שגיאה ביבוא אנשי קשר מ-Google');
    } finally {
      setIsImportingGoogleContacts(false);
    }
  };

  // Trigger Simulated Call
  const handleStartCall = (isVideo: boolean) => {
    if (!activeChat) return;
    setActiveCall({
      contactName: activeChat.name,
      contactAvatar: activeChat.avatar,
      isVideo,
      seconds: 0,
      isMuted: false,
    });

    // Add to call logs
    const newLog: CallLogItem = {
      id: `call_${Date.now()}`,
      contactName: activeChat.name,
      contactAvatar: activeChat.avatar,
      type: 'outgoing',
      isVideo,
      timestamp: 'עכשיו',
    };
    setCallLogs([newLog, ...callLogs]);
  };

  const filteredChats = chats.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.statusText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Background wallpapers for WhatsApp Chat Window
  const wallpaperClasses = {
    dark: 'bg-[#0b141a] bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]',
    doodle: 'bg-[#0b141a] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]',
    emerald: 'bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#0f172a]',
    midnight: 'bg-slate-950',
  };

  return (
    <div className="bento-box p-0 overflow-hidden dir-rtl text-right h-[740px] flex flex-col font-sans max-w-7xl mx-auto" dir="rtl">
      {/* Content Moderation Alert Modal */}
      <ModerationAlertModal
        isOpen={isModerationAlertOpen}
        blockedWord={blockedWord}
        onClose={() => setIsModerationAlertOpen(false)}
      />

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-2xl animate-bounce flex items-center gap-2 border border-emerald-300">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN WHATSAPP GRID */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= SIDEBAR (RTL RIGHT) ================= */}
        <div className="w-full sm:w-80 md:w-96 bg-slate-950 border-l border-slate-800/80 flex flex-col shrink-0">
          
          {/* Sidebar Top Header */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsProfilePictureModalOpen(true)}
                className="relative group transition transform active:scale-95"
                title="ערוך פרופיל ותמונה"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-xl overflow-hidden shadow-sm">
                  {userProfileAvatar.startsWith('http') ? (
                    <img src={userProfileAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{userProfileAvatar}</span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-slate-950 rounded-full p-0.5 border border-slate-900">
                  <Camera className="w-2.5 h-2.5" />
                </span>
              </button>

              <div>
                <h3 className="font-black text-xs text-white leading-tight">{currentUserName}</h3>
                <span className="text-[10px] font-bold text-emerald-400 truncate block max-w-[140px]">{userStatusBio}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAddContactModalOpen(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="הוסף איש קשר חדש"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Sidebar Tabs Row (WhatsApp Icons + Labels) */}
          <div className="grid grid-cols-5 bg-slate-900 border-b border-slate-800 p-1 gap-0.5 text-center">
            <button
              onClick={() => setSidebarTab('chats')}
              className={`py-2 text-[11px] font-black rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${
                sidebarTab === 'chats' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>שיחות</span>
            </button>

            <button
              onClick={() => setSidebarTab('statuses')}
              className={`py-2 text-[11px] font-black rounded-xl transition flex flex-col items-center justify-center gap-0.5 relative ${
                sidebarTab === 'statuses' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
              <span>סטטוס</span>
              {statuses.some((s) => !s.hasSeen) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1.5 left-2" />
              )}
            </button>

            <button
              onClick={() => setSidebarTab('contacts')}
              className={`py-2 text-[11px] font-black rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${
                sidebarTab === 'contacts' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>אנשי קשר</span>
            </button>

            <button
              onClick={() => setSidebarTab('challenges')}
              className={`py-2 text-[11px] font-black rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${
                sidebarTab === 'challenges' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>אתגרים</span>
            </button>

            <button
              onClick={() => setSidebarTab('calls')}
              className={`py-2 text-[11px] font-black rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${
                sidebarTab === 'calls' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>שיחות</span>
            </button>
          </div>

          {/* TAB 1: CHATS LIST */}
          {sidebarTab === 'chats' && (
            <>
              {/* Action Buttons */}
              <div className="p-2.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>צור קבוצת אתגר</span>
                </button>
                <button
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>קשר</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="p-2.5 bg-slate-950">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חפש שיחה, איש קשר או קבוצה..."
                    className="w-full pr-9 pl-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Chats List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                {filteredChats.map((chat) => {
                  const isSelected = chat.id === activeChatId;
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`w-full p-3 text-right flex items-start gap-3 transition relative ${
                        isSelected ? 'bg-slate-800/90 border-r-4 border-emerald-500' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-2xl shrink-0">
                        {chat.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-xs text-slate-100 truncate flex items-center gap-1">
                            <span>{chat.name}</span>
                            {chat.isPinned && <Pin className="w-3 h-3 text-amber-400 rotate-45" />}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500">{chat.lastTime}</span>
                        </div>

                        <p className="text-[11px] font-medium text-slate-400 truncate mt-1">
                          {chat.lastMessage}
                        </p>

                        {chat.isGroup && (
                          <span className="inline-block text-[9px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">
                            🏆 אתגר קבוצתי
                          </span>
                        )}
                      </div>

                      {chat.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: STATUSES (STORIES) */}
          {sidebarTab === 'statuses' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl">
                      {userProfileAvatar}
                    </div>
                    <button
                      onClick={() => setIsCreateStatusModalOpen(true)}
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-black text-xs shadow-md hover:scale-110 transition"
                    >
                      +
                    </button>
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-white">הסטטוס שלי</h4>
                    <p className="text-[10px] text-slate-400 font-medium">פרסם עדכון תמונה או טקסט</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateStatusModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition"
                >
                  פרסם
                </button>
              </div>

              <div>
                <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  עדכוני סטטוס אחרונים ({statuses.length})
                </h5>

                <div className="space-y-2">
                  {statuses.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setActiveStoryView(st);
                        setStatuses((prev) =>
                          prev.map((s) => (s.id === st.id ? { ...s, hasSeen: true } : s))
                        );
                      }}
                      className="w-full p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 rounded-2xl flex items-center justify-between text-right transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full p-0.5 transition ${
                            st.hasSeen
                              ? 'border-2 border-slate-700'
                              : 'bg-gradient-to-tr from-emerald-400 via-teal-400 to-indigo-500 animate-pulse'
                          }`}
                        >
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xl overflow-hidden">
                            {st.imageUrl ? (
                              <img src={st.imageUrl} alt="Status" className="w-full h-full object-cover" />
                            ) : (
                              <span>{st.userAvatar}</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-xs text-white group-hover:text-emerald-400 transition">
                            {st.userName}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold">{st.timestamp}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-xl">
                        <Eye className="w-3 h-3" />
                        <span>צפה</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACTS & FRIENDS */}
          {sidebarTab === 'contacts' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Google Contacts Banner */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-800/60 rounded-2xl p-3 shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-sm font-black text-indigo-300 shrink-0">
                    G
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">סנכרון Google Contacts</h4>
                    <p className="text-[10px] text-indigo-200">יבא אנשי קשר מחשבון ה-Google שלך בלחיצה אחת</p>
                  </div>
                </div>

                <button
                  onClick={handleImportGoogleContacts}
                  disabled={isImportingGoogleContacts}
                  className="w-full mt-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {isImportingGoogleContacts ? (
                    <span>טוען אנשי קשר מ-Google...</span>
                  ) : (
                    <>
                      <span>יבא מ-Google Contacts</span>
                      <Users className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-xs font-black text-slate-300">אנשי קשר שמורים ({contacts.length})</h4>
                <button
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>הוסף קשר</span>
                </button>
              </div>

              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-right"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                          {contact.avatar}
                        </div>
                        {contact.online && (
                          <span className="w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full absolute bottom-0 right-0" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-black text-xs text-white flex items-center gap-1">
                          <span>{contact.name}</span>
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                            רמה {contact.level}
                          </span>
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium">{contact.statusBio}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartChatWithContact(contact)}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition"
                        title="פתוח שיחה בוואטסאפ"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GROUPS & CHALLENGES */}
          {sidebarTab === 'challenges' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-xs font-black text-slate-300">קבוצות אתגר פעילות</h4>
                <button
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>אתגר חדש</span>
                </button>
              </div>

              {chats.filter((c) => c.isGroup).map((grp) => (
                <div
                  key={grp.id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-right"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{grp.avatar}</span>
                      <div>
                        <h4 className="font-black text-xs text-white">{grp.name}</h4>
                        <p className="text-[10px] text-amber-400 font-bold">{grp.statusText}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveChatId(grp.id);
                        setSidebarTab('chats');
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition"
                    >
                      כנס לקבוצה
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>{grp.members.length} משתתפים באתגר</span>
                    <span className="text-emerald-400">מוביל: {grp.members[0]?.name || 'אני'} 🏆</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: CALLS LOG */}
          {sidebarTab === 'calls' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <h4 className="text-xs font-black text-slate-300 mb-2 px-1">יומן שיחות אחרונות</h4>
              {callLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                      {log.contactAvatar}
                    </div>
                    <div>
                      <h5 className="font-black text-xs text-white">{log.contactName}</h5>
                      <span
                        className={`text-[10px] font-bold ${
                          log.type === 'missed' ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {log.timestamp} • {log.type === 'incoming' ? 'נכנסת' : log.type === 'outgoing' ? 'יוצאת' : 'שיחה שלא נענתה'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartCall(log.isVideo)}
                    className="p-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition"
                  >
                    {log.isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ================= MAIN CHAT WINDOW ================= */}
        <div className={`flex-1 flex flex-col min-w-0 ${wallpaperClasses[wallpaperTheme]}`}>
          
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl">
                💬
              </div>
              <h3 className="text-lg font-black text-white">אין שיחה נבחרת</h3>
              <p className="text-xs max-w-sm">
                בחר שיחה מהרשימה או לחץ על איש קשר כדי להתחיל צ'אט חי!
              </p>
              <button
                onClick={() => setSidebarTab('contacts')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                צפה באנשי קשר
              </button>
            </div>
          ) : (
            <>
              {/* Chat Window Top Bar */}
              <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shadow-md z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    {activeChat.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-white truncate">{activeChat.name}</h3>
                    <p className="text-[11px] font-medium text-emerald-400 truncate">{activeChat.statusText}</p>
                  </div>
                </div>

                {/* Header Right Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartCall(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl transition"
                    title="שיחה קולית"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleStartCall(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl transition"
                    title="שיחת וידאו"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsShareImageModalOpen(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl transition"
                    title="שתף תמונה בצ'אט"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {activeChat.isGroup && (
                    <button
                      onClick={() => setIsLeaderboardOpen(true)}
                      className="px-2.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-xl flex items-center gap-1 transition"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden md:inline">לוח מובילים</span>
                    </button>
                  )}

                  {/* Wallpaper Theme Selector */}
                  <button
                    onClick={() => {
                      const themes: ('dark' | 'doodle' | 'emerald' | 'midnight')[] = ['dark', 'doodle', 'emerald', 'midnight'];
                      const nextIdx = (themes.indexOf(wallpaperTheme) + 1) % themes.length;
                      setWallpaperTheme(themes[nextIdx]);
                      triggerToast(`רקע הצ'אט שונה בסגנון! 🎨`);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    title="שנה רקע צ'אט"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                </div>
              </div>

          {/* Messages List Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {activeMessages.map((msg) => {
              const isMe = msg.senderId === 'u1';
              const isSystem = msg.type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="my-2 flex justify-center">
                    <div className="bg-slate-800/90 border border-amber-500/30 text-amber-300 px-4 py-1.5 rounded-2xl text-center text-xs font-bold shadow-xs">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0 overflow-hidden">
                    {msg.senderAvatar?.startsWith('http') ? (
                      <img src={msg.senderAvatar} alt="Sender" className="w-full h-full object-cover" />
                    ) : (
                      <span>{msg.senderAvatar}</span>
                    )}
                  </div>

                  <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-bold text-slate-400">{msg.senderName}</span>
                      <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-sky-400" />}
                      </span>
                    </div>

                    {/* Standard Text Message */}
                    {msg.type === 'text' && (
                      <div
                        className={`p-3 rounded-2xl text-xs font-bold leading-relaxed shadow-xs relative ${
                          isMe
                            ? 'bg-[#005c4b] text-white rounded-tr-xs'
                            : 'bg-[#202c33] text-slate-100 border border-slate-700/80 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    {/* Voice Message */}
                    {msg.type === 'voice' && (
                      <div
                        className={`p-3 rounded-2xl text-xs font-bold shadow-md flex items-center gap-3 ${
                          isMe ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-slate-100 border border-slate-700'
                        }`}
                      >
                        <button
                          onClick={() => soundFX.playCompleteSound()}
                          className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black"
                        >
                          <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                        </button>
                        <div className="space-y-1">
                          <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="w-1/2 h-full bg-emerald-400 rounded-full animate-pulse" />
                          </div>
                          <span className="text-[10px] text-slate-300 font-bold block">
                            הודעה קולית • 0:{msg.voiceDuration || 5}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Image Attachment Message */}
                    {msg.type === 'image' && msg.imageUrl && (
                      <div className="bg-[#202c33] border border-slate-700 rounded-2xl overflow-hidden shadow-lg max-w-sm">
                        <button
                          onClick={() => setLightboxImageUrl(msg.imageUrl || null)}
                          className="relative group w-full block bg-slate-950 overflow-hidden"
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Shared photo"
                            className="w-full max-h-64 object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1 text-xs font-extrabold">
                            <Maximize2 className="w-4 h-4" />
                            <span>להגדלה</span>
                          </div>
                        </button>
                        {msg.imageCaption && (
                          <div className="p-2.5 text-xs font-bold text-slate-100 text-right bg-[#202c33]">
                            {msg.imageCaption}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Challenge Card */}
                    {msg.type === 'challenge_invite' && msg.challengeData && (
                      <div className="bg-gradient-to-br from-slate-900 to-slate-850 border-2 border-amber-500/60 rounded-3xl p-4 shadow-xl space-y-3 text-right max-w-sm">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>הזמנה לאתגר אישי / קבוצתי</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {msg.challengeData.durationDays} ימים
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-sm text-white">{msg.challengeData.title}</h4>
                          <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
                            פרס סיום: +{msg.challengeData.rewardPoints} נקודות מוניטין 🌟
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800">
                          {msg.challengeData.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleChallengeAction(msg.id, true)}
                                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>אשר השתתפות</span>
                              </button>
                              <button
                                onClick={() => handleChallengeAction(msg.id, false)}
                                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                              >
                                דחה
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`p-2 rounded-xl text-center text-xs font-bold ${
                                msg.challengeData.status === 'accepted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {msg.challengeData.status === 'accepted' ? 'אושר! הנך משתתף באתגר ✓' : 'ההזמנה נדחתה'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Emoji Reaction Pills */}
                    {msg.reactions && Object.keys(msg.reactions).some((k) => ((msg.reactions![k] as string[]) || []).length > 0) && (
                      <div className="flex items-center gap-1 mt-1">
                        {Object.entries(msg.reactions).map(([emoji, uIdsList]) => {
                          const uIds = (uIdsList as string[]) || [];
                          if (!uIds || uIds.length === 0) return null;
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg.id, emoji)}
                              className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 shadow-xs hover:bg-slate-700 transition"
                            >
                              <span>{emoji}</span>
                              <span className="text-[10px] text-amber-400 font-black">{uIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Reaction Quick Picker on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition absolute top-0 left-0 bg-slate-900 border border-slate-700 rounded-full px-2 py-1 flex items-center gap-1 shadow-lg z-10">
                      {['❤️', '👍', '🔥', '😂', '😮', '🙏'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className="hover:scale-125 transition text-xs"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Bottom Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setIsShareImageModalOpen(true)}
              className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl font-bold text-xs transition shrink-0"
              title="שתף תמונה בצ'אט"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSendChallengeModalOpen(true)}
              className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition shrink-0"
              title="שלח הזמנה לאתגר"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Voice Message Record Button */}
            {!isRecordingVoice ? (
              <button
                onClick={() => setIsRecordingVoice(true)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-bold text-xs transition shrink-0"
                title="הקלט הודעה קולית"
              >
                <Mic className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex-1 bg-rose-950/80 border border-rose-600/60 rounded-2xl px-4 py-2 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-rose-300 font-black text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>מקליט הודעה קולית... ({recordingSeconds} שניות)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleFinishVoiceRecord}
                    className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md"
                  >
                    שלח
                  </button>
                  <button
                    onClick={() => setIsRecordingVoice(false)}
                    className="px-2 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    בטל
                  </button>
                </div>
              </div>
            )}

            {!isRecordingVoice && (
              <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="כתוב הודעה... (סינון שפה פוגענית פעיל)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold transition shrink-0 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  </div>

      {/* ================= ALL MODALS ================= */}

      {/* 1. Status Story Viewer Modal */}
      {activeStoryView && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800">
            {activeStoryView.type === 'image' && activeStoryView.imageUrl ? (
              <img
                src={activeStoryView.imageUrl}
                alt="Story background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${activeStoryView.bgColor || 'from-indigo-900 to-purple-900'}`} />
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />

            <div className="relative z-10 p-4 space-y-3">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 animate-[pulse_5s_ease-in-out]" />
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-lg overflow-hidden">
                    {activeStoryView.userAvatar}
                  </div>
                  <div>
                    <h4 className="font-black text-xs">{activeStoryView.userName}</h4>
                    <span className="text-[10px] text-slate-300 font-bold">{activeStoryView.timestamp}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStoryView(null)}
                  className="p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative z-10 p-6 text-center my-auto">
              {activeStoryView.textContent && (
                <div className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl text-white font-black text-base sm:text-lg leading-relaxed shadow-xl">
                  {activeStoryView.textContent}
                </div>
              )}
            </div>

            <div className="relative z-10 p-4 space-y-3">
              <div className="flex items-center justify-between text-white/80 text-xs font-bold px-1">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{activeStoryView.viewsCount} צפיות</span>
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>{activeStoryView.likesCount} לייקים</span>
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="השב לסטטוס זה..."
                  className="flex-1 bg-slate-900/90 border border-white/20 rounded-2xl px-4 py-2 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={() => {
                    triggerToast(`שלחת תגובה לסטטוס של ${activeStoryView.userName}! 💬`);
                    setActiveStoryView(null);
                  }}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs transition shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Create Status Modal */}
      {isCreateStatusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-emerald-400" />
                <span>פרסום סטטוס חדש (Story)</span>
              </h3>
              <button onClick={() => setIsCreateStatusModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">תוכן / טקסט הסטטוס</label>
                <textarea
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="רשום עדכון הרגל או מסר מעורר השראה..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">קישור לתמונה (אופציונלי)</label>
                <input
                  type="url"
                  value={statusImageUrl}
                  onChange={(e) => setStatusImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateStatusModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  בטל
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md"
                >
                  פרסם סטטוס
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Image Sharing Modal */}
      {isShareImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <span>שתף תמונת הרגל בצ'אט</span>
              </h3>
              <button onClick={() => setIsShareImageModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendPhotoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">בחר תמונה מוכנה מאוסף ההרגלים:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_HABIT_PHOTOS.map((ph, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPhotoUrl(ph.url);
                        setCustomPhotoInput('');
                      }}
                      className={`relative rounded-2xl overflow-hidden border-2 text-right transition ${
                        selectedPhotoUrl === ph.url ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={ph.url} alt={ph.title} className="w-full h-20 object-cover" />
                      <span className="block p-1 bg-slate-950/80 text-[10px] font-bold truncate text-center">{ph.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">או הכנס קישור לתמונה משלך (URL):</label>
                <input
                  type="url"
                  value={customPhotoInput}
                  onChange={(e) => {
                    setCustomPhotoInput(e.target.value);
                    setSelectedPhotoUrl('');
                  }}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">כיתוב לתמונה (Caption):</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="לדוגמה: יעד המים היומי הושלם! 💧"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsShareImageModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  בטל
                </button>
                <button
                  type="submit"
                  disabled={!selectedPhotoUrl && !customPhotoInput}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md"
                >
                  שלח תמונה בצ'אט
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>הוספת איש קשר לפי קוד אישי</span>
              </h3>
              <button onClick={() => setIsAddContactModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              {/* Google Contacts Quick Import */}
              <div className="bg-indigo-950/60 border border-indigo-800/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    G
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">יבוא מהיר מ-Google Contacts</h4>
                    <p className="text-[10px] text-indigo-300">אתר חברים מאיש הקשר השמורים ב-Google שלך</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleImportGoogleContacts}
                  disabled={isImportingGoogleContacts}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {isImportingGoogleContacts ? (
                    <span>מייבא אנשי קשר...</span>
                  ) : (
                    <>
                      <span>סנכרן Google Contacts</span>
                      <Users className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-500 uppercase">או הזן קוד ידנית</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">הכנס קוד חבר (לדוגמה: DANI-8812):</label>
                <input
                  type="text"
                  value={newContactCode}
                  onChange={(e) => setNewContactCode(e.target.value)}
                  placeholder="קוד הזמנה של חבר..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  בטל
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md"
                >
                  הוסף איש קשר
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create Group Challenge Modal */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>יצירת קבוצת אתגר חדשה</span>
              </h3>
              <button onClick={() => setIsCreateGroupModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">שם הקבוצה</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="לדוגמה: אלופי הכושר 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">תיאור האתגר</label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="תיאור מטרת האתגר..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  בטל
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md"
                >
                  צור קבוצה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Send Challenge Invitation Card Modal */}
      {isSendChallengeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>שליחת הזמנה לאתגר אישי בצ'אט</span>
              </h3>
              <button onClick={() => setIsSendChallengeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendChallengeInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">כותרת האתגר</label>
                <input
                  type="text"
                  value={newChalTitle}
                  onChange={(e) => setNewChalTitle(e.target.value)}
                  placeholder="לדוגמה: 10,000 צעדים ביום"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">משך בימים</label>
                  <input
                    type="number"
                    value={newChalDays}
                    onChange={(e) => setNewChalDays(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">נקודות בונוס</label>
                  <input
                    type="number"
                    value={newChalPoints}
                    onChange={(e) => setNewChalPoints(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSendChallengeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  בטל
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md"
                >
                  שלח הזמנה בצ'אט
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Live Leaderboard Modal for Group */}
      {isLeaderboardOpen && activeChat.isGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>טבלת מובילים - {activeChat.name}</span>
              </h3>
              <button onClick={() => setIsLeaderboardOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activeChat.members.map((mem, i) => (
                <div
                  key={mem.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm w-6 text-center text-amber-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
                      {mem.avatar}
                    </div>
                    <div>
                      <h5 className="font-black text-xs text-white">{mem.name}</h5>
                      <span className="text-[10px] text-slate-400 font-bold">{mem.progressDays} ימים ברצף</span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                    {mem.score} נקודות
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsLeaderboardOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-2xl transition"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* 8. Lightbox Image Preview Modal */}
      {lightboxImageUrl && (
        <div
          onClick={() => setLightboxImageUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-3xl w-full text-center space-y-3">
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-10 left-0 p-2 text-white hover:text-rose-400 font-bold text-sm transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={lightboxImageUrl} alt="Enlarged" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* 9. Profile Picture & Status Bio Modal */}
      {isProfilePictureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <span>עריכת פרופיל וואטסאפ</span>
              </h3>
              <button onClick={() => setIsProfilePictureModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">בחר אווטאר אימוג'י או קישור לתמונה:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userProfileAvatar}
                    onChange={(e) => setUserProfileAvatar(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="אימוג'י או URL..."
                  />
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {userProfileAvatar.startsWith('http') ? (
                      <img src={userProfileAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>{userProfileAvatar}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">סטטוס אישי (Bio):</label>
                <input
                  type="text"
                  value={userStatusBio}
                  onChange={(e) => setUserStatusBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => {
                  setIsProfilePictureModalOpen(false);
                  triggerToast('פרטי הפרופיל עודכנו בהצלחה! 🌟');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition"
              >
                שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Simulated Call Screen Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-8 text-white">
          <div className="text-center space-y-2 mt-8">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-xs border border-emerald-500/30 inline-block">
              {activeCall.isVideo ? 'שיחת וידאו וואטסאפ 📹' : 'שיחה קולית וואטסאפ 📞'}
            </span>
            <h2 className="text-2xl font-black">{activeCall.contactName}</h2>
            <p className="text-sm font-bold text-slate-400">
              {Math.floor(activeCall.seconds / 60)
                .toString()
                .padStart(2, '0')}
              :
              {(activeCall.seconds % 60).toString().padStart(2, '0')}
            </p>
          </div>

          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-emerald-500/50 flex items-center justify-center text-6xl shadow-2xl animate-pulse">
            {activeCall.contactAvatar}
          </div>

          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={() => setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted })}
              className={`p-4 rounded-full transition ${
                activeCall.isMuted ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white'
              }`}
            >
              {activeCall.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={() => {
                setActiveCall(null);
                triggerToast('השיחה הסתיימה 📞');
              }}
              className="p-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-2xl transition scale-110"
            >
              <Phone className="w-7 h-7 rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
