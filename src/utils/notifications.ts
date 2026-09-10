import { AppNotification } from '../types';

class NotificationService {
  private permissionGranted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    } catch {
      return false;
    }
  }

  public hasPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  public sendPush(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch {
        // Fallback or ignore in strict iframe environments
      }
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
    
    // Also try browser push
    if (this.hasPermission()) {
      this.sendPush(title, { body: message });
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
