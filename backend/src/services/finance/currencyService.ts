/**
 * Currency / FX Rate Service — M3 / F-02
 * Exchange rates are GLOBAL (shared across tenants — no tenantId).
 * Supports upserting daily rates and converting amounts.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface UpsertRateInput {
  fromCurrency: string;
  toCurrency:   string;
  rate:         number;
  date?:        string;   // defaults to today
  source?:      string;   // ECB | manual | OpenExchangeRates
}

export interface ListRateParams {
  fromCurrency?: string;
  toCurrency?:   string;
  page?:         number;
  limit?:        number;
}

const dayStart = (d?: string) => {
  const date = d ? new Date(d) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const currencyService = {

  // ── List rates ───────────────────────────────────────────
  async list(params: ListRateParams) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 50);
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (params.fromCurrency) where.fromCurrency = params.fromCurrency.toUpperCase();
    if (params.toCurrency)   where.toCurrency   = params.toCurrency.toUpperCase();

    const [data, total] = await Promise.all([
      prisma.currencyRate.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      prisma.currencyRate.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  // ── Get one ──────────────────────────────────────────────
  async getById(id: string) {
    const rate = await prisma.currencyRate.findUnique({ where: { id } });
    if (!rate) throw new Error('RATE_NOT_FOUND');
    return rate;
  },

  // ── Upsert a rate (unique per from+to+date) ──────────────
  async upsert(input: UpsertRateInput) {
    const from = input.fromCurrency.toUpperCase();
    const to   = input.toCurrency.toUpperCase();
    if (from === to) throw new Error('SAME_CURRENCY');
    const date = dayStart(input.date);

    const rate = await prisma.currencyRate.upsert({
      where: {
        fromCurrency_toCurrency_date: { fromCurrency: from, toCurrency: to, date },
      },
      update: { rate: input.rate, source: input.source || 'manual' },
      create: {
        fromCurrency: from,
        toCurrency:   to,
        rate:         input.rate,
        date,
        source:       input.source || 'manual',
      },
    });

    logger.info(`FX rate set: 1 ${from} = ${input.rate} ${to} (${rate.date.toISOString().slice(0, 10)})`);
    return rate;
  },

  // ── Convert an amount using the latest rate ──────────────
  async convert(from: string, to: string, amount: number) {
    from = from.toUpperCase();
    to   = to.toUpperCase();
    if (from === to) return { from, to, amount, rate: 1, converted: amount };

    // Direct rate (latest)
    const direct = await prisma.currencyRate.findFirst({
      where: { fromCurrency: from, toCurrency: to },
      orderBy: { date: 'desc' },
    });
    if (direct) {
      const rate = Number(direct.rate);
      return { from, to, amount, rate, converted: Math.round(amount * rate * 100) / 100, date: direct.date };
    }

    // Inverse rate
    const inverse = await prisma.currencyRate.findFirst({
      where: { fromCurrency: to, toCurrency: from },
      orderBy: { date: 'desc' },
    });
    if (inverse) {
      const rate = 1 / Number(inverse.rate);
      return { from, to, amount, rate: Math.round(rate * 1e6) / 1e6, converted: Math.round(amount * rate * 100) / 100, date: inverse.date };
    }

    throw new Error('NO_RATE_FOUND');
  },

  // ── Delete a rate ────────────────────────────────────────
  async remove(id: string) {
    const rate = await prisma.currencyRate.findUnique({ where: { id } });
    if (!rate) throw new Error('RATE_NOT_FOUND');
    await prisma.currencyRate.delete({ where: { id } });
    logger.info(`FX rate deleted: ${rate.fromCurrency}->${rate.toCurrency}`);
  },
};
