/**
 * Utility functions for managing browser Notification API
 */

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export const STORAGE_REMINDERS_ENABLED_KEY = 'habits_app_reminders_enabled';
export const STORAGE_FIRED_REMINDERS_KEY_PREFIX = 'habits_reminder_fired_';

/**
 * Check if Notification API is supported by the current browser environment
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission from the browser user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return getNotificationPermission();
  }
}

/**
 * Check if global reminders are enabled in settings
 */
export function getStoredRemindersEnabled(): boolean {
  try {
    const item = localStorage.getItem(STORAGE_REMINDERS_ENABLED_KEY);
    return item === null ? true : item === 'true';
  } catch {
    return true;
  }
}

/**
 * Set global reminders enabled state in settings
 */
export function setStoredRemindersEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_REMINDERS_ENABLED_KEY, String(enabled));
  } catch (e) {
    console.error('Error saving reminders enabled state:', e);
  }
}

/**
 * Send a browser notification if permissions are granted
 */
export function sendBrowserNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClickUrl?: string;
    onClose?: () => void;
  }
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notifOptions: any = {
      body: options?.body || '',
      icon: options?.icon || '🔥',
      tag: options?.tag,
      renotify: !!options?.tag,
    };
    const notification = new Notification(title, notifOptions);

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (options?.onClickUrl) {
        window.location.href = options.onClickUrl;
      }
      notification.close();
    };

    if (options?.onClose) {
      notification.onclose = options.onClose;
    }

    return true;
  } catch (err) {
    console.warn('Failed to fire browser notification:', err);
    return false;
  }
}

/**
 * Send a test notification to verify browser notification setup
 */
export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      message: 'הדפדפן שלך אינו תומך בהתראות דפדפן (Notification API).',
    };
  }

  let permission = getNotificationPermission();
  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    return {
      success: false,
      message: 'הרשאת התראות דפדפן נדחתה. יש לאשר התראות בהגדרות הדפדפן.',
    };
  }

  const fired = sendBrowserNotification('🔥 תזכורת בדיקה - הרגלים טובים', {
    body: 'התראות הדפדפן שלך פועלות בהצלחה! תקבל תזכורות בזמן שהגדרת להרגלים שלך.',
    tag: 'test-notification',
  });

  if (fired) {
    return {
      success: true,
      message: 'התראת בדיקה נשלחה בהצלחה!',
    };
  } else {
    return {
      success: false,
      message: 'לא ניתן היה לשלוח את התראת הבדיקה.',
    };
  }
}

/**
 * Get fired reminders record for today
 */
export function getFiredRemindersToday(dateStr: string): Set<string> {
  try {
    const key = `${STORAGE_FIRED_REMINDERS_KEY_PREFIX}${dateStr}`;
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

/**
 * Mark a reminder as fired today
 */
export function markReminderFiredToday(dateStr: string, reminderKey: string): void {
  try {
    const firedSet = getFiredRemindersToday(dateStr);
    firedSet.add(reminderKey);
    const key = `${STORAGE_FIRED_REMINDERS_KEY_PREFIX}${dateStr}`;
    localStorage.setItem(key, JSON.stringify(Array.from(firedSet)));
  } catch (e) {
    console.error('Error saving fired reminder:', e);
  }
}
