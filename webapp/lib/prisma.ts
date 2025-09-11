import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  const baseOptions: any = {
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  };
  // Only pass datasources override if DATABASE_URL is provided; otherwise let Prisma use defaults
  if (process.env.DATABASE_URL) {
    baseOptions.datasources = {
      db: { url: process.env.DATABASE_URL },
    };
  }
  return new PrismaClient(baseOptions);
};

export const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
