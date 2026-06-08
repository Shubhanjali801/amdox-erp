export interface IWebhook      { id: string; tenantId: string; name: string; url: string; events: string[]; isActive: boolean; secret?: string; }

