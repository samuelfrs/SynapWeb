import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      if (process.env.DATABASE_URL) {
        await this.$connect();
        this.logger.log('Connected to PostgreSQL (optional)');
      }
    } catch (error: any) {
      this.logger.warn(`Could not connect to PostgreSQL: ${error?.message || 'Offline'}. Running in 100% stateless / local-first mode.`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // Safe exit
    }
  }
}
