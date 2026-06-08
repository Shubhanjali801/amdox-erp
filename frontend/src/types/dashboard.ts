export interface Dashboard      { id: string; tenantId: string; name: string; isDefault: boolean; widgets: Widget[]; }
export interface Widget         { id: string; dashboardId: string; title: string; type: string; posX: number; posY: number; width: number; height: number; }
export interface ScheduledReport{ id: string; tenantId: string; name: string; reportType: string; format: string; schedule: string; isActive: boolean; }
