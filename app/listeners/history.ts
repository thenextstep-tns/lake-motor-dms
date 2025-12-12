
import { prisma } from '@/lib/prisma';
import { DomainEvents } from '@/lib/events';

// This Listener decouples the "Action" of changing a vehicle
// from the "Side Effect" of logging that change.

export function registerHistoryListeners() {
    console.log('[Listener] Registering History Listeners...');

    DomainEvents.on('VEHICLE_UPDATED', async (event) => {
        const { vin, changes, user, timestamp } = event;

        console.log(`[HistoryListener] Logging update for ${vin} by ${user.name}`);

        // The 'changes' object is expected to be { field: { old: X, new: Y } }
        // or we can adapt based on what we send.
        // Let's assume we iterate over keys to create multiple log entries if needed,
        // or one dynamic entry?
        // The current DB schema has 'field', 'oldValue', 'newValue'.

        // If 'changes' is an array of changed fields:
        for (const [key, value] of Object.entries(changes)) {
            const change = value as { old: any, new: any };

            // Skip if no change (sanity check)
            if (change.old === change.new) continue;

            await prisma.vehicleHistory.create({
                data: {
                    vehicleId: vin,
                    userId: user.id,
                    userName: user.name,
                    companyId: user.companyId,
                    field: key,
                    oldValue: String(change.old ?? ''),
                    newValue: String(change.new ?? ''),
                    timestamp: timestamp
                }
            });
        }
    });

    DomainEvents.on('ROLE_UPDATED', async (event) => {
        // Implement Audit for Roles later
        console.log(`[HistoryListener] Role Updated: ${event.action} ${event.roleId}`);
    });
}
