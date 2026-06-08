export interface Project        { id: string; tenantId: string; projectCode: string; name: string; status: string; priority: string; startDate: string; budget: number; spentBudget: number; }
export interface Task           { id: string; projectId: string; title: string; status: string; priority: string; assigneeId: string; dueDate: string; estimatedHours: number; loggedHours: number; }
export interface Milestone      { id: string; projectId: string; name: string; dueDate: string; status: string; }
export interface ProjectResource{ id: string; projectId: string; employeeId: string; role: string; allocationPct: number; }
