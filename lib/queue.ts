
import { prisma } from '@/lib/prisma';
import { DomainEvents } from './events';

// Define the shape of a Job Handler
type JobHandler = (payload: any) => Promise<void>;

export class JobQueue {
    private handlers: Map<string, JobHandler> = new Map();
    private isProcessing = false;
    private pollInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start polling when the queue is initialized (singleton)
        // In a serverless env like Vercel, this might need a Cron Job endpoint instead.
        // For this local/VPS setup, a simple interval works.
        this.startPolling();
    }

    // 1. Register a Worker (e.g., "I know how to sync drive folders")
    register(type: string, handler: JobHandler) {
        console.log(`[JobQueue] Registered worker for: ${type}`);
        this.handlers.set(type, handler);
    }

    // 2. Enqueue a Job (e.g., "Please sync folder X")
    async enqueue(type: string, payload: any) {
        console.log(`[JobQueue] Enqueuing: ${type}`);
        const job = await prisma.job.create({
            data: {
                type,
                payload: JSON.stringify(payload),
                status: 'PENDING'
            }
        });

        // Trigger immediate process check (don't wait for poll)
        this.processNext();
        return job;
    }

    // 3. The "Engine" - Polls and executes
    private startPolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => this.processNext(), 5000); // Check every 5s
    }

    private async processNext() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Fetch next pending job
            const job = await prisma.job.findFirst({
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'asc' }
            });

            if (!job) {
                this.isProcessing = false;
                return;
            }

            console.log(`[JobQueue] Processing Job #${job.id} (${job.type})`);

            const handler = this.handlers.get(job.type);
            if (!handler) {
                console.error(`[JobQueue] No handler for type: ${job.type}`);
                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', error: 'No handler registered' }
                });
                this.isProcessing = false;
                return;
            }

            // Mark as PROCESSING
            await prisma.job.update({
                where: { id: job.id },
                data: { status: 'PROCESSING' }
            });

            // EXECUTE
            try {
                const payload = JSON.parse(job.payload);
                await handler(payload);

                // Success
                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED' }
                });
                console.log(`[JobQueue] Job #${job.id} COMPLETED`);

            } catch (err: any) {
                console.error(`[JobQueue] Job #${job.id} FAILED:`, err);

                // Retry Logic
                if (job.retries < job.maxRetries) {
                    await prisma.job.update({
                        where: { id: job.id },
                        data: {
                            status: 'PENDING',
                            retries: { increment: 1 },
                            error: err.message
                        }
                    });
                    // Exponential backoff could go here (runAt update)
                } else {
                    await prisma.job.update({
                        where: { id: job.id },
                        data: { status: 'FAILED', error: err.message }
                    });
                }
            }

        } catch (error) {
            console.error('[JobQueue] Critical Engine Error:', error);
        } finally {
            this.isProcessing = false;
            // Immediate recurse if we processed something, to drain the queue
            // But let's verify we actually did something?
            // Simple approach: just exit, next poll or enqueue will trigger again.
        }
    }
}

// Singleton
export const Queue = new JobQueue();
