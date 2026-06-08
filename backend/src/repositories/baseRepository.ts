import { PrismaClient } from '@prisma/client';
import prisma from '../config/database';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient = prisma;

  abstract findAll(tenantId: string, params?: any): Promise<T[]>;
  abstract findById(id: string): Promise<T | null>;
  abstract create(data: any): Promise<T>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<void>;

  protected paginate(page = 1, limit = 20) {
    return { skip: (page - 1) * limit, take: limit };
  }
}
