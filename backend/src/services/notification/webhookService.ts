/**
 * Webhook Service — M5 / F-10
 * Outbound webhooks: tenant registers a URL + subscribed events; we POST
 * a signed payload and log each delivery in WebhookDelivery.
 */
import crypto from 'crypto';
import axios from 'axios';
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

function sign(secret: string, body: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export const webhookService = {
  async list(tenantId: string) {
    return prisma.webhook.findMany({
      where: { tenantId }, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { deliveries: true } } },
    });
  },

  async getById(tenantId: string, id: string) {
    const wh = await prisma.webhook.findFirst({
      where: { id, tenantId },
      include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!wh) throw new Error('WEBHOOK_NOT_FOUND');
    return wh;
  },

  async create(tenantId: string, input: any) {
    const secret = input.secret || crypto.randomBytes(16).toString('hex');
    const wh = await prisma.webhook.create({
      data: { tenantId, name: input.name, url: input.url, events: input.events, secret },
    });
    logger.info(`Webhook created: ${wh.name} → ${wh.url}`);
    return wh;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.webhook.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    // FK on webhook_deliveries is RESTRICT — remove delivery logs first.
    await prisma.$transaction([
      prisma.webhookDelivery.deleteMany({ where: { webhookId: id } }),
      prisma.webhook.delete({ where: { id } }),
    ]);
    logger.info(`Webhook deleted: ${id}`);
  },

  // ── Deliver a payload to one webhook (records the attempt) ─
  async deliver(webhook: any, event: string, payload: any) {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = sign(webhook.secret, body);
    let statusCode: number | null = null;
    let responseText: string | null = null;
    let ok = false;
    try {
      const resp = await axios.post(webhook.url, JSON.parse(body), {
        headers: { 'Content-Type': 'application/json', 'X-Amdox-Signature': signature, 'X-Amdox-Event': event },
        timeout: 5000,
        validateStatus: () => true,
      });
      statusCode = resp.status;
      responseText = typeof resp.data === 'string' ? resp.data.slice(0, 500) : JSON.stringify(resp.data).slice(0, 500);
      ok = resp.status >= 200 && resp.status < 300;
    } catch (e: any) {
      responseText = e.message?.slice(0, 500) || 'delivery failed';
    }
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id, event, payload, statusCode, response: responseText,
        succeededAt: ok ? new Date() : null, failedAt: ok ? null : new Date(),
      },
    });
    if (ok) await prisma.webhook.update({ where: { id: webhook.id }, data: { lastUsedAt: new Date() } });
    return { ok, statusCode, delivery };
  },

  // Test delivery with a sample payload
  async test(tenantId: string, id: string) {
    const wh = await this.getById(tenantId, id);
    return this.deliver(wh, 'webhook.test', { hello: 'from Amdox ERP', webhookId: id });
  },

  // Fire all active webhooks subscribed to an event
  async dispatch(tenantId: string, event: string, payload: any) {
    const hooks = await prisma.webhook.findMany({ where: { tenantId, isActive: true, events: { has: event } } });
    const results = [];
    for (const h of hooks) results.push(await this.deliver(h, event, payload));
    return { dispatched: results.length, results };
  },
};
