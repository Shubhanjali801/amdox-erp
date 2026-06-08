import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../src/config/database', () => ({ __esModule: true, default: mockDeep<PrismaClient>() }));

import prisma from '../../src/config/database';
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => mockReset(prismaMock));
