export interface Notification   { id: string; tenantId: string; userId: string; title: string; body: string; type: string; channel: string; isRead: boolean; createdAt: string; }
export interface NotifPreference{ id: string; userId: string; type: string; emailEnabled: boolean; pushEnabled: boolean; smsEnabled: boolean; inAppEnabled: boolean; }
export interface Webhook        { id: string; tenantId: string; name: string; url: string; events: string[]; isActive: boolean; }
