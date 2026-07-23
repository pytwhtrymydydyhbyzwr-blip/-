import { SocialGroup, SocialGroupMessage, FeedItem, FeedKudos, Challenge, LeaderboardUser, UserContact, ChallengeInvite } from '../types';

const STORAGE_GROUPS_KEY = 'habit_social_groups_v2';
const STORAGE_MESSAGES_KEY = 'habit_social_messages_v2';
const STORAGE_FEED_KEY = 'habit_social_feed_v2';
const STORAGE_CHALLENGES_KEY = 'habit_social_challenges_v2';
const STORAGE_CONTACTS_KEY = 'habit_social_contacts_v2';
const STORAGE_INVITES_KEY = 'habit_social_invites_v2';

// Default Contacts List (Empty - populated exclusively by real registered users & accounts)
const DEFAULT_CONTACTS: UserContact[] = [];

// Default Challenge Invites List
const DEFAULT_INVITES: ChallengeInvite[] = [];

// Initial Clean Groups
const DEFAULT_GROUPS: SocialGroup[] = [
  {
    id: 'group_morning_heroes',
    name: 'אלופי הבוקר והכושר 🌅',
    description: 'קבוצת תמיכה למי שקם מוקדם, עושה כושר ושומר על אנרגיה שיא',
    avatar: '🏃‍♂️',
    membersCount: 1,
    lastMessage: 'ברוכים הבאים לקבוצת אלופי הבוקר!',
    lastMessageTime: 'עכשיו',
    unreadCount: 0,
  },
  {
    id: 'group_reading_mind',
    name: 'מועדון הקריאה והלמידה 📚',
    description: 'קוראים ספרים, מתפתחים יחד ומשתפים רשמים יומיים',
    avatar: '📖',
    membersCount: 1,
    lastMessage: 'ברוכים הבאים למועדון הקריאה!',
    lastMessageTime: 'עכשיו',
    unreadCount: 0,
  },
  {
    id: 'group_water_health',
    name: 'אתגר בריאות ומים 2L 💧',
    description: 'שותים מים, אוכלים בריא ונלחמים בעייפות',
    avatar: '💧',
    membersCount: 1,
    lastMessage: 'ברוכים הבאים לאתגר שתיית המים!',
    lastMessageTime: 'עכשיו',
    unreadCount: 0,
  },
];

// Initial Messages (Empty - populated by real users)
const DEFAULT_MESSAGES: SocialGroupMessage[] = [];

// Initial Feed Items (Empty - populated by real user habit completion events)
const DEFAULT_FEED: FeedItem[] = [];

// Initial Challenges (Clean - for real users to join)
const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'chal_reading_7days',
    title: 'אתגר קריאה רצופה 7 ימים 📚',
    description: 'מי יצליח לקרוא לפחות 15 דקות בכל יום במשך שבוע שלם?',
    category: 'learning',
    targetDays: 7,
    rewardPoints: 150,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'active',
    createdByName: 'מערכת HabitHero',
    participants: [
      { userId: 'current_user', userName: 'אני (אתה)', userAvatar: '🦸‍♂️', progressDays: 1, points: 25, isCurrentUser: true },
    ],
  },
  {
    id: 'chal_water_strike',
    title: 'אתגר שותים מים בריא 💧',
    description: 'משיגים 2000 מ"ל מים בכל יום ושומרים על חיוניות אנרגטית!',
    category: 'health',
    targetDays: 10,
    rewardPoints: 200,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    status: 'active',
    createdByName: 'מערכת HabitHero',
    participants: [
      { userId: 'current_user', userName: 'אני (אתה)', userAvatar: '🦸‍♂️', progressDays: 1, points: 25, isCurrentUser: true },
    ],
  },
];

// Loaders & Savers
export function loadSocialGroups(): SocialGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_GROUPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(DEFAULT_GROUPS));
  return DEFAULT_GROUPS;
}

export function saveSocialGroups(groups: SocialGroup[]) {
  localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups));
}

export function loadSocialMessages(): SocialGroupMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(DEFAULT_MESSAGES));
  return DEFAULT_MESSAGES;
}

export function saveSocialMessages(messages: SocialGroupMessage[]) {
  localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
}

export function loadSocialFeed(): FeedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_FEED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_FEED_KEY, JSON.stringify(DEFAULT_FEED));
  return DEFAULT_FEED;
}

export function saveSocialFeed(feed: FeedItem[]) {
  localStorage.setItem(STORAGE_FEED_KEY, JSON.stringify(feed));
}

export function loadChallenges(): Challenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHALLENGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_CHALLENGES_KEY, JSON.stringify(DEFAULT_CHALLENGES));
  return DEFAULT_CHALLENGES;
}

export function saveChallenges(challenges: Challenge[]) {
  localStorage.setItem(STORAGE_CHALLENGES_KEY, JSON.stringify(challenges));
}

/**
 * Automatically triggers Flow:
 * When user completes a habit:
 * 1. Post automated message to Group Chat.
 * 2. Post automated item to Feed.
 * 3. Update active challenge points.
 */
export function publishHabitCompletionEvent(
  userName: string,
  userAvatar: string,
  habitName: string,
  streakCount: number,
  category: string = 'health'
) {
  const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  // 1. Send system message to groups
  const messages = loadSocialMessages();
  const groups = loadSocialGroups();

  const newSystemMessage: SocialGroupMessage = {
    id: `sys_msg_${Date.now()}`,
    groupId: groups[0]?.id || 'group_morning_heroes',
    senderId: 'system_bot',
    senderName: 'מערכת HabitHero',
    senderAvatar: '🤖',
    text: `🎉 ${userName} השלים את ההרגל "${habitName}" וצבר ${streakCount} ימי רצף! 🔥`,
    timestamp: timeStr,
    isSystemMessage: true,
    habitName,
    streakCount,
  };

  saveSocialMessages([newSystemMessage, ...messages]);

  // Update group last message preview
  const updatedGroups = groups.map((g, idx) =>
    idx === 0
      ? {
          ...g,
          lastMessage: `${userName} השלים: ${habitName}`,
          lastMessageTime: 'עכשיו',
        }
      : g
  );
  saveSocialGroups(updatedGroups);

  // 2. Post item to Feed
  const feed = loadSocialFeed();
  const newFeedItem: FeedItem = {
    id: `feed_${Date.now()}`,
    userId: 'current_user',
    userName,
    userAvatar,
    habitName,
    category,
    streakCount,
    timestamp: 'עכשיו',
    kudosList: [],
  };
  saveSocialFeed([newFeedItem, ...feed]);
  
  // Also publish to Firestore if online
  import('../lib/firestoreSync').then(({ publishFeedItemToFirestore }) => {
    publishFeedItemToFirestore(newFeedItem);
  }).catch(() => {});

  // 3. Update Challenge points for current user
  const challenges = loadChallenges();
  const updatedChallenges = challenges.map((c) => {
    if (c.status === 'active') {
      const updatedParts = c.participants.map((p) => {
        if (p.isCurrentUser || p.userId === 'current_user') {
          return {
            ...p,
            progressDays: Math.min(c.targetDays, p.progressDays + 1),
            points: p.points + 25, // Completion bonus
          };
        }
        return p;
      });
      return { ...c, participants: updatedParts };
    }
    return c;
  });
  saveChallenges(updatedChallenges);
}

/**
 * Add Quick Kudos to a Feed Post & award bonus points + post to chat
 */
export function addQuickKudosToFeed(
  feedItemId: string,
  fromUserName: string,
  fromUserAvatar: string,
  emoji: string,
  text: string
) {
  const feed = loadSocialFeed();
  let targetPostAuthor = '';

  const updatedFeed = feed.map((item) => {
    if (item.id === feedItemId) {
      targetPostAuthor = item.userName;
      const newKudos: FeedKudos = {
        id: `kud_${Date.now()}`,
        fromUserId: 'current_user',
        fromUserName,
        fromUserAvatar,
        emoji,
        text,
        timestamp: 'עכשיו',
      };
      return { ...item, kudosList: [newKudos, ...item.kudosList] };
    }
    return item;
  });

  saveSocialFeed(updatedFeed);

  // Post cheer message in main group chat
  const messages = loadSocialMessages();
  const groups = loadSocialGroups();
  const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  const cheerMsg: SocialGroupMessage = {
    id: `cheer_msg_${Date.now()}`,
    groupId: groups[0]?.id || 'group_morning_heroes',
    senderId: 'current_user',
    senderName: fromUserName,
    senderAvatar: fromUserAvatar,
    text: `${emoji} ${text} (נשלח עידוד ל-${targetPostAuthor})`,
    timestamp: timeStr,
  };

  saveSocialMessages([cheerMsg, ...messages]);
}

// Contacts Management Functions
export function loadUserContacts(): UserContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONTACTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(DEFAULT_CONTACTS));
  return DEFAULT_CONTACTS;
}

export function saveUserContacts(contacts: UserContact[]) {
  localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(contacts));
}

export function loadChallengeInvites(): ChallengeInvite[] {
  try {
    const raw = localStorage.getItem(STORAGE_INVITES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_INVITES_KEY, JSON.stringify(DEFAULT_INVITES));
  return DEFAULT_INVITES;
}

export function saveChallengeInvites(invites: ChallengeInvite[]) {
  localStorage.setItem(STORAGE_INVITES_KEY, JSON.stringify(invites));
}

/**
 * Send an invitation to a contact for a specific challenge
 */
export function sendChallengeInvitation(
  challengeId: string,
  challengeTitle: string,
  fromUserName: string,
  fromUserAvatar: string,
  toContact: UserContact
): ChallengeInvite {
  const invites = loadChallengeInvites();
  const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  const newInvite: ChallengeInvite = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    challengeId,
    challengeTitle,
    fromUserId: 'current_user',
    fromUserName,
    fromUserAvatar,
    toContactId: toContact.id,
    toContactName: toContact.name,
    status: 'pending',
    sentAt: `היום, ${timeStr}`,
  };

  const updatedInvites = [newInvite, ...invites];
  saveChallengeInvites(updatedInvites);

  // Update contact status to invited if not already connected
  const contacts = loadUserContacts();
  const updatedContacts = contacts.map((c) =>
    c.id === toContact.id && c.status !== 'connected' ? { ...c, status: 'invited' as const } : c
  );
  saveUserContacts(updatedContacts);

  return newInvite;
}

/**
 * Respond to a challenge invitation (accept or decline)
 */
export function respondToChallengeInvitation(
  inviteId: string,
  accept: boolean,
  currentUserName: string = 'אני (אתה)',
  currentUserAvatar: string = '🦸‍♂️'
) {
  const invites = loadChallengeInvites();
  const invite = invites.find((i) => i.id === inviteId);
  if (!invite) return;

  const updatedInvites = invites.map((i) =>
    i.id === inviteId ? { ...i, status: (accept ? 'accepted' : 'declined') as 'accepted' | 'declined' } : i
  );
  saveChallengeInvites(updatedInvites);

  if (accept) {
    // Add participant to the challenge
    const challenges = loadChallenges();
    const updatedChallenges = challenges.map((c) => {
      if (c.id === invite.challengeId) {
        const exists = c.participants.some(
          (p) => p.isCurrentUser || p.userId === 'current_user' || p.userName === currentUserName
        );
        if (!exists) {
          return {
            ...c,
            participants: [
              ...c.participants,
              {
                userId: 'current_user',
                userName: currentUserName,
                userAvatar: currentUserAvatar,
                progressDays: 1,
                points: 25,
                isCurrentUser: true,
              },
            ],
          };
        }
      }
      return c;
    });
    saveChallenges(updatedChallenges);
  }
}

import { getStoredUsers, getCurrentUser } from './auth';

/**
 * Import real registered accounts from system into user's contacts
 */
export function importSampleDeviceContacts(): UserContact[] {
  const current = loadUserContacts();
  const storedUsers = getStoredUsers();
  const curUser = getCurrentUser();

  const realContacts: UserContact[] = storedUsers
    .filter((u) => u.id !== curUser?.id)
    .map((u, idx) => ({
      id: `contact_real_${u.id}`,
      name: u.fullName,
      phoneOrEmail: u.username,
      avatar: u.avatar || '🦸‍♂️',
      inviteCode: `USER-${u.username.toUpperCase()}`,
      status: 'connected' as const,
      addedAt: new Date().toISOString().split('T')[0],
      level: 1,
      streak: 1,
    }));

  const existingIds = new Set(current.map((c) => c.id));
  const newToAdd = realContacts.filter((c) => !existingIds.has(c.id));

  const updated = [...current, ...newToAdd];
  saveUserContacts(updated);
  return updated;
}

