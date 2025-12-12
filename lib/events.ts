
import { EventEmitter } from 'events';

// --- Event Definitions ---
// We define the shape of every event here. 
// This acts as a contract between the "Broadcaster" and the "Listener".

export interface VehicleUpdatedEvent {
    vin: string;
    changes: Record<string, any>;
    user: { id: string; name: string; companyId: string };
    timestamp: Date;
}

export interface InspectionCompletedEvent {
    inspectionId: string;
    vehicleVin: string;
    findings: { needsMechanical: boolean; needsCosmetic: boolean };
    priority?: string;
    notes?: string;
    detailedFindings?: {
        mechanical?: any;
        cosmetic?: any;
    };
    user: { id: string; companyId: string };
}

export interface RoleUpdatedEvent {
    roleId: string;
    companyId: string;
    action: 'CREATED' | 'UPDATED' | 'DELETED';
}

export interface DepositCreatedEvent {
    depositId: string;
    vehicleVin: string;
    amount: number;
    user: { id: string; companyId: string };
}

export interface TaskCompletedEvent {
    taskId: string;
    completedBy: string;
    vehicleVin?: string;
}

// Map Event Names to Interfaces
interface DomainEventMap {
    'VEHICLE_UPDATED': VehicleUpdatedEvent;
    'INSPECTION_COMPLETED': InspectionCompletedEvent;
    'ROLE_UPDATED': RoleUpdatedEvent;
    'DEPOSIT_CREATED': DepositCreatedEvent;
    'TASK_COMPLETED': TaskCompletedEvent;
    // Add more as we build them...
}

// --- The Broadcaster (EventBus) ---
class TypedEventBus extends EventEmitter {
    // Typed Emit: Ensures you can't broadcast an event with wrong data
    emit<K extends keyof DomainEventMap>(event: K, payload: DomainEventMap[K]): boolean {
        // console.log(`[EventBus] Broadcasting: ${event}`, { payloadSummary: Object.keys(payload) });

        // Fire and forget persistence to avoid blocking the main thread
        // We use a dynamic import to avoid circular dependencies if any, 
        // though typically prisma lib is fine.
        (async () => {
            try {
                // Extract user info if available in payload
                const pl = payload as any;
                const user = pl.user;
                // If user is inside payload, we extract it for the logger columns,
                // but we also pass the whole payload including user.
                const { SystemLogger } = await import('@/lib/logger');
                await SystemLogger.log(event, payload, user);
            } catch (err) {
                console.error(`[EventBus] Failed to persist event ${event}`, err);
            }
        })();

        return super.emit(event, payload);
    }

    // Typed On: Ensures you can't listen for a typo
    on<K extends keyof DomainEventMap>(event: K, listener: (payload: DomainEventMap[K]) => void): this {
        return super.on(event, listener);
    }
}

// Singleton Instance Pattern for Next.js (prevents multiple instances in Dev)
const globalForEvents = globalThis as unknown as { domainEvents: TypedEventBus };

export const DomainEvents = globalForEvents.domainEvents || new TypedEventBus();

if (process.env.NODE_ENV !== 'production') {
    globalForEvents.domainEvents = DomainEvents;
}
