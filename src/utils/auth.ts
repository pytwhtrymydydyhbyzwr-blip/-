import { Habit } from '../types';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  passwordHash: string; // Stored securely in localStorage
  avatar: string;
  createdAt: string;
}

const USERS_STORAGE_KEY = 'habit_tracker_registered_users_v1';
const CURRENT_USER_KEY = 'habit_tracker_active_user_v1';

// Simple hash utility for local password validation
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

export const getStoredUsers = (): UserAccount[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    // Seed a default demo user
    const defaultUser: UserAccount = {
      id: 'demo-user-1',
      username: 'demo',
      fullName: 'משתמש מדגם',
      passwordHash: hashPassword('123456'),
      avatar: '🌟',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([defaultUser]));
    return [defaultUser];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getCurrentUser = (): UserAccount | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const registerUser = (
  username: string,
  fullName: string,
  password: string,
  avatar: string = '🦸'
): { success: boolean; user?: UserAccount; error?: string } => {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'שם המשתמש חייב להכיל לפחות 3 תווים' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'הסיסמה חייבת להכיל לפחות 4 תווים' };
  }

  const users = getStoredUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'שם משתמש זה כבר תפוס, אנא בחר שם אחר' };
  }

  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    fullName: fullName.trim() || cleanUsername,
    passwordHash: hashPassword(password),
    avatar,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

  return { success: true, user: newUser };
};

export const loginUser = (
  username: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const cleanUsername = username.trim().toLowerCase();
  const users = getStoredUsers();
  const user = users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    return { success: false, error: 'שם המשתמש אינו קיים במערכת' };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'הסיסמה שנרשמה אינה נכונה' };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true, user };
};

export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const getUserHabitsKey = (userId: string): string => {
  return `habit_tracker_user_habits_${userId}`;
};
