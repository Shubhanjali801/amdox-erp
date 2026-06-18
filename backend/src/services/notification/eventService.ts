/**
 * Event Service — M5 / F-10
 * Catalog of domain events + emit(): a single call that fans out to
 * in-app notifications AND any subscribed outbound webhooks.
 */
import { notificationService } from './notificationService';
import { webhookService } from './webhookService';

// Supported domain events (what webhooks can subscribe to)
export const EVENT_CATALOG = [
  { event: 'invoice.created',   description: 'A new AP/AR invoice was created' },
  { event: 'invoice.paid',      description: 'An invoice was fully paid' },
  { event: 'payment.recorded',  description: 'A payment was recorded' },
  { event: 'po.received',       description: 'Goods received against a purchase order' },
  { event: 'stock.low',         description: 'Inventory item dropped below reorder point' },
  { event: 'leave.requested',   description: 'An employee submitted a leave request' },
  { event: 'leave.approved',    description: 'A leave request was approved' },
  { event: 'payroll.run',       description: 'A payroll run completed' },
  { event: 'task.assigned',     description: 'A project task was assigned' },
  { event: 'forecast.ready',    description: 'A demand forecast was generated' },
  { event: 'webhook.test',      description: 'Test event for webhook setup' },
];

export const eventService = {
  catalog() {
    return EVENT_CATALOG;
  },

  getByName(event: string) {
    const found = EVENT_CATALOG.find((e) => e.event === event);
    if (!found) throw new Error('EVENT_NOT_FOUND');
    return found;
  },

  // ── Emit a domain event: notify a user + dispatch webhooks ─
  async emit(tenantId: string, input: { event: string; userId: string; title: string; message: string; type?: any; resourceId?: string }) {
    const notification = await notificationService.notify({
      tenantId,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      event: input.event,
      resourceId: input.resourceId,
    });
    const webhookResult = await webhookService.dispatch(tenantId, input.event, {
      title: input.title, message: input.message, resourceId: input.resourceId,
    });
    return { event: input.event, notification, webhooks: webhookResult };
  },
};
