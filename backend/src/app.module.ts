import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    // ── Migrated NestJS feature modules ──
    AuthModule,
    // TODO: UsersModule, TenantsModule, FinanceModule, HrModule, SupplyModule...
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // global rate limiting
  ],
})
export class AppModule {}
