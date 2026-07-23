import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Habit, GamificationStats, FeedItem } from '../types';

/**
 * Recursively remove undefined fields from objects/arrays to prevent Firestore errors
 */
export function removeUndefinedFields<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedFields(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        sanitized[key] = removeUndefinedFields(val);
      }
    }
    return sanitized as T;
  }
  return data;
}

/**
 * Save habits to Firestore under /users/{userId}/habits/{habitId}
 */
export async function saveHabitsToFirestore(userId: string, habits: Habit[]): Promise<void> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return;
  try {
    for (const habit of habits) {
      const habitRef = doc(db, 'users', userId, 'habits', habit.id);
      const sanitizedDescription = habit.description ? habit.description.slice(0, 500) : '';
      const sanitizedName = habit.name.slice(0, 150);

      const rawLogs = habit.logs || {};
      const cleanLogs: Record<string, any> = {};
      for (const [dateKey, logObj] of Object.entries(rawLogs)) {
        if (logObj) {
          const sanitizedLog: Record<string, any> = {
            date: logObj.date || dateKey,
            completed: !!logObj.completed,
            value: logObj.value ?? 0,
          };
          if (logObj.notes) sanitizedLog.notes = logObj.notes;
          if (logObj.audioUrl) sanitizedLog.audioUrl = logObj.audioUrl;
          if (logObj.audioDuration !== undefined && logObj.audioDuration !== null) {
            sanitizedLog.audioDuration = logObj.audioDuration;
          }
          if (logObj.completedAt) sanitizedLog.completedAt = logObj.completedAt;
          cleanLogs[dateKey] = sanitizedLog;
        }
      }

      const habitData = removeUndefinedFields({
        id: habit.id,
        userId,
        name: sanitizedName,
        description: sanitizedDescription,
        category: habit.category || 'personal',
        type: habit.type || 'boolean',
        targetValue: habit.targetValue ?? 0,
        unit: habit.unit ?? '',
        color: habit.color || 'bg-indigo-500',
        icon: habit.icon || 'Check',
        createdAt: habit.createdAt || new Date().toISOString(),
        archived: !!habit.archived,
        frequency: habit.frequency || { type: 'daily' },
        reminders: habit.reminders || [],
        logs: cleanLogs,
      });

      await setDoc(habitRef, habitData, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/habits`);
  }
}

/**
 * Load user habits from Firestore
 */
export async function loadHabitsFromFirestore(userId: string): Promise<Habit[] | null> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return null;
  const path = `users/${userId}/habits`;
  try {
    const habitsCol = collection(db, 'users', userId, 'habits');
    const snapshot = await getDocs(habitsCol);
    if (snapshot.empty) return null;

    const habits: Habit[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      habits.push({
        id: data.id || docSnap.id,
        name: data.name || 'הרגל ללא שם',
        description: data.description || '',
        category: data.category || 'personal',
        type: data.type || 'boolean',
        targetValue: data.targetValue,
        unit: data.unit,
        frequency: data.frequency || { type: 'daily' },
        color: data.color || 'bg-indigo-500',
        icon: data.icon || 'Check',
        createdAt: data.createdAt || new Date().toISOString(),
        archived: data.archived || false,
        reminders: data.reminders || [],
        logs: data.logs || {},
      });
    });
    return habits;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Save Gamification Stats to Firestore
 */
export async function saveGamificationStatsToFirestore(userId: string, stats: GamificationStats): Promise<void> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}/gamification/stats`;
  try {
    const statsRef = doc(db, 'users', userId, 'gamification', 'stats');
    const statsData = removeUndefinedFields({
      userId,
      xp: stats.xp || 0,
      level: stats.level || 1,
      unlockedBadgeIds: stats.unlockedBadgeIds || [],
      totalEarlyCompletions: stats.totalEarlyCompletions || 0,
      unlockedBadgesHistory: stats.unlockedBadgesHistory || [],
      updatedAt: new Date().toISOString(),
    });
    await setDoc(statsRef, statsData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load Gamification Stats from Firestore
 */
export async function loadGamificationStatsFromFirestore(userId: string): Promise<GamificationStats | null> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return null;
  const path = `users/${userId}/gamification/stats`;
  try {
    const statsRef = doc(db, 'users', userId, 'gamification', 'stats');
    const snap = await getDoc(statsRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      xp: data.xp || 0,
      level: data.level || 1,
      unlockedBadgeIds: data.unlockedBadgeIds || [],
      totalEarlyCompletions: data.totalEarlyCompletions || 0,
      unlockedBadgesHistory: data.unlockedBadgesHistory || [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Publish Feed Item to Firestore
 */
export async function publishFeedItemToFirestore(feedItem: FeedItem): Promise<void> {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    // Skip if not authenticated in Firebase
    return;
  }
  const path = `feed/${feedItem.id}`;
  try {
    const feedRef = doc(db, 'feed', feedItem.id);
    const feedData = removeUndefinedFields({
      id: feedItem.id,
      userId: currentUid,
      userName: feedItem.userName,
      userAvatar: feedItem.userAvatar || '🦸‍♂️',
      habitName: feedItem.habitName,
      category: feedItem.category || 'general',
      streakCount: feedItem.streakCount || 0,
      timestamp: new Date().toISOString(),
    });
    await setDoc(feedRef, feedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to realtime Feed Items from Firestore
 */
export function subscribeToFeedItems(onUpdate: (items: FeedItem[]) => void) {
  const path = 'feed';
  try {
    const q = query(collection(db, 'feed'), limit(30));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: FeedItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: d.id || docSnap.id,
            userId: d.userId || '',
            userName: d.userName || 'חבר',
            userAvatar: d.userAvatar || '🦸‍♂️',
            habitName: d.habitName || 'הרגל',
            category: d.category || 'health',
            streakCount: d.streakCount || 0,
            timestamp: d.timestamp || new Date().toISOString(),
            kudosList: d.kudosList || [],
          });
        });
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Publish Public Profile for Multi-User Discovery
 */
export async function publishPublicProfileToFirestore(profile: {
  uid: string;
  fullName: string;
  username: string;
  avatar: string;
  statusBio?: string;
  level?: number;
  bestStreak?: number;
}): Promise<void> {
  if (!profile.uid) return;
  const path = `public_profiles/${profile.uid}`;
  try {
    const profRef = doc(db, 'public_profiles', profile.uid);
    const data = removeUndefinedFields({
      uid: profile.uid,
      fullName: profile.fullName,
      username: profile.username || profile.fullName,
      avatar: profile.avatar || '🦸‍♂️',
      statusBio: profile.statusBio || 'משתמש פעיל ב-HabitHero 🚀',
      level: profile.level || 1,
      bestStreak: profile.bestStreak || 0,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(profRef, data, { merge: true });
  } catch (error) {
    console.warn('Could not publish public profile:', error);
  }
}

/**
 * Subscribe to Public Profiles
 */
export function subscribeToPublicProfiles(onUpdate: (profiles: any[]) => void) {
  try {
    const q = query(collection(db, 'public_profiles'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Public profiles subscription notice:', error);
      }
    );
  } catch (error) {
    return () => {};
  }
}

/**
 * Publish Real-time Chat Message to Firestore
 */
export async function publishChatMessageToFirestore(chatId: string, message: any): Promise<void> {
  if (!chatId || !message.id) return;
  const path = `chats/${chatId}/messages/${message.id}`;
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', message.id);
    const data = removeUndefinedFields({
      ...message,
      chatId,
      timestampStr: message.timestamp || new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    });
    await setDoc(msgRef, data, { merge: true });
  } catch (error) {
    console.warn('Could not publish chat message to firestore:', error);
  }
}

/**
 * Subscribe to Chat Messages in Real-time
 */
export function subscribeToChatMessages(chatId: string, onUpdate: (messages: any[]) => void) {
  if (!chatId) return () => {};
  try {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: any[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push(docSnap.data());
        });
        onUpdate(msgs);
      },
      (error) => {
        console.warn(`Chat messages snapshot notice for ${chatId}:`, error);
      }
    );
  } catch (error) {
    return () => {};
  }
}

/**
 * Publish WhatsApp Status Story to Firestore
 */
export async function publishStatusStoryToFirestore(story: any): Promise<void> {
  if (!story.id) return;
  try {
    const storyRef = doc(db, 'statuses', story.id);
    const data = removeUndefinedFields({
      ...story,
      createdAt: new Date().toISOString(),
    });
    await setDoc(storyRef, data, { merge: true });
  } catch (error) {
    console.warn('Could not publish status story:', error);
  }
}

/**
 * Subscribe to Status Stories in Real-time
 */
export function subscribeToStatusStories(onUpdate: (stories: any[]) => void) {
  try {
    const q = query(collection(db, 'statuses'), limit(30));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Status stories snapshot notice:', error);
      }
    );
  } catch (error) {
    return () => {};
  }
}

