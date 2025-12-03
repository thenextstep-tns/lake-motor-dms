import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
// Strip 'file:' prefix as better-sqlite3 expects a path
const dbPath = databaseUrl.replace('file:', '');

const adapter = new PrismaBetterSqlite3({
    url: dbPath
});

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: ['query'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
