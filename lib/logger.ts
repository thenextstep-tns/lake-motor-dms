
import { prisma } from '@/lib/prisma';

export class SystemLogger {
    /**
     * Persist a system event log.
     * This method is awaitable and ensures the log is written before resolving.
     */
    static async log(type: string, payload: any, user?: { id?: string, name?: string | null, companyId?: string | null }) {
        try {
            // Normalize Payload
            const safePayload = JSON.stringify(payload || {});

            // Normalize User
            const userId = user?.id || null;
            const userName = user?.name || 'System';
            const companyId = user?.companyId || null;

            await prisma.systemEvent.create({
                data: {
                    type,
                    payload: safePayload,
                    userId,
                    userName,
                    companyId,
                    timestamp: new Date()
                }
            });
            // console.log(`[SystemLogger] Logged: ${type}`);
        } catch (error) {
            console.error(`[SystemLogger] Failed to log event: ${type}`, error);
            // We do not throw here to prevent logging failures from crashing the app logic
        }
    }

    /**
     * Fire-and-forget logging. Use only when blocking is not acceptable.
     */
    static dispatch(type: string, payload: any, user?: { id?: string, name?: string | null, companyId?: string | null }) {
        this.log(type, payload, user).catch(err => console.error("Dispatch Error", err));
    }
}
