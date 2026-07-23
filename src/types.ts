export type HabitType = 'boolean' | 'numeric' | 'timer';

export type DaysOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 6=Saturday

export interface HabitFrequency {
  type: 'daily' | 'specific_days' | 'times_per_week';
  days?: DaysOfWeek[]; // For specific days
  timesPerWeek?: number; // For times_per_week
}

export type HabitCategory = 'health' | 'fitness' | 'mindset' | 'productivity' | 'learning' | 'personal';

export interface HabitLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number; // Current numeric value (e.g., 1500 ml) or seconds completed
  notes?: string;
  audioUrl?: string; // base64 or blob URL of recorded voice note
  audioDuration?: number; // duration in seconds
  completedAt?: string; // ISO timestamp
}

export interface PrivacySettings {
  shareProfile: boolean;
  shareStreaks: boolean;
  shareHabitNames: boolean;
  allowEncouragement: boolean;
  myInviteCode: string;
}

export interface FriendCheer {
  id: string;
  fromFriendId: string;
  fromFriendName: string;
  fromFriendAvatar: string;
  message: string;
  emoji: string;
  timestamp: string;
  habitName?: string;
}

export interface FriendHabit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  inviteCode: string;
  level: number;
  bestStreak: number;
  totalCompletions: number;
  status: 'connected' | 'pending_sent' | 'pending_received';
  habits: FriendHabit[];
  privacy: {
    shareStreaks: boolean;
    shareHabitNames: boolean;
    allowEncouragement: boolean;
  };
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  type: HabitType;
  targetValue?: number; // For numeric (e.g. 2000) or timer (e.g. 1200 seconds)
  unit?: string; // For numeric (ml, pages, reps, steps, etc.)
  frequency: HabitFrequency;
  targetTime?: string; // e.g., "08:00"
  color: string; // Tailwind color class / hex identifier
  icon: string; // Lucide icon identifier
  createdAt: string; // YYYY-MM-DD
  archived?: boolean;
  reminders?: string[]; // e.g. ["08:00", "20:00"]
  logs: Record<string, HabitLog>; // key is YYYY-MM-DD
}

export interface UserStats {
  totalCompletions: number;
  currentStreak: number;
  bestStreak: number;
  perfectDays: number;
}

export interface HabitStreakInfo {
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  completionRate: number; // percentage 0-100
}

export interface SocialGroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isSystemMessage?: boolean;
  habitName?: string;
  streakCount?: number;
}

export interface SocialGroup {
  id: string;
  name: string;
  description: string;
  avatar: string;
  membersCount: number;
  isPrivate?: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface FeedKudos {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  emoji: string;
  text: string;
  timestamp: string;
}

export interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  habitName: string;
  category: string;
  streakCount: number;
  timestamp: string;
  kudosList: FeedKudos[];
}

export interface ChallengeParticipant {
  userId: string;
  userName: string;
  userAvatar: string;
  progressDays: number;
  points: number;
  isCurrentUser?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDays: number;
  rewardPoints: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'completed';
  participants: ChallengeParticipant[];
  createdByName: string;
}

export interface LeaderboardUser {
  userId: string;
  name: string;
  avatar: string;
  level: number;
  currentStreak: number;
  totalCompletions: number;
  kudosPoints: number;
  totalPoints: number;
  isCurrentUser?: boolean;
}

export type BadgeCategory = 'streak' | 'early_bird' | 'milestone' | 'social' | 'ai';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // e.g. 3
  maxProgress: number; // e.g. 7
  rewardXP: number;
}

export interface GamificationStats {
  xp: number;
  level: number;
  unlockedBadgeIds: string[];
  totalEarlyCompletions: number; // completions before 09:00 AM
  unlockedBadgesHistory: { badgeId: string; unlockedAt: string }[];
}

export type FilterTimeOfDay = 'all' | 'morning' | 'afternoon' | 'evening';
export type ActiveTab =
  | 'dashboard'
  | 'social'
  | 'analytics'
  | 'habits_manage'
  | 'settings';

export interface UserContact {
  id: string;
  name: string;
  phoneOrEmail: string;
  avatar: string;
  inviteCode: string;
  status: 'connected' | 'invited' | 'pending';
  addedAt: string;
  level?: number;
  streak?: number;
}

export interface ChallengeInvite {
  id: string;
  challengeId: string;
  challengeTitle: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toContactId: string;
  toContactName: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
}


