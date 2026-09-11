import { AppNotification } from '../types';

class NotificationService {
  private permissionGranted: boolean = false;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined') {
        this.permissionGranted = Notification.permission === 'granted';
      }
    } catch {
      this.permissionGranted = false;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof Notification === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      if (typeof Notification.requestPermission === 'function') {
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
        return this.permissionGranted;
      }
      return false;
    } catch {
      return false;
    }
  }

  public hasPermission(): boolean {
    try {
      if (typeof window !== 'undefined' && typeof Notification !== 'undefined' && 'Notification' in window) {
        return Notification.permission === 'granted';
      }
    } catch {
      return false;
    }
    return false;
  }

  public sendPush(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    try {
      if (Notification.permission === 'granted') {
        // Guard against environments (e.g. mobile Chrome / iframes) where `new Notification()` throws Illegal constructor
        try {
          if (typeof Notification === 'function') {
            const notif = new Notification(title, {
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              ...options,
            });
            setTimeout(() => {
              try {
                notif.close();
              } catch {
                // Ignore close errors
              }
            }, 5000);
          }
        } catch {
          // Ignore when browser restricts direct Notification constructor
        }
      }
    } catch {
      // Ignore permission access issues
    }
  }

  public createNotification(
    title: string,
    message: string,
    type: AppNotification['type'] = 'info',
    taskId?: string
  ): AppNotification {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Safely attempt push notification
    try {
      if (this.hasPermission()) {
        this.sendPush(title, { body: message });
      }
    } catch {
      // Continue without push
    }

    return {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      title,
      message,
      time,
      type,
      read: false,
      taskId,
    };
  }
}

export const notificationService = new NotificationService();
