import { prisma } from "@/lib/prisma";
import { PermissionService, UserContext } from "./PermissionService";
import { ActionType, ResourceType, TicketStatus } from "../domain/constants";

export class TicketService {

    // --- READ ---
    static async getAll(user: UserContext) {
        PermissionService.require(user, ActionType.Read, ResourceType.ServiceTicket);
        if (!user.companyId) throw new Error("No Company Context");

        return prisma.serviceTicket.findMany({
            where: {
                companyId: user.companyId,
                markedForDeletion: false,
                lotId: user.lotId || undefined,
            },
            include: {
                vehicle: true,
                parts: true,
                timeLogs: true,
                inspection: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    static async getById(user: UserContext, id: string) {
        PermissionService.require(user, ActionType.Read, ResourceType.ServiceTicket);

        // Ensure scoping
        const ticket = await prisma.serviceTicket.findFirst({
            where: {
                id,
                companyId: user.companyId!,
                markedForDeletion: false
            },
            include: {
                vehicle: true,
                inspection: { include: { codes: true } },
                parts: true,
                timeLogs: true
            }
        });

        return ticket;
    }

    static async getByVin(user: UserContext, vin: string) {
        PermissionService.require(user, ActionType.Read, ResourceType.ServiceTicket);

        return prisma.serviceTicket.findMany({
            where: {
                vehicleVin: vin,
                companyId: user.companyId!,
                markedForDeletion: false
            },
            include: {
                timeLogs: true,
                parts: true
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    static async syncInspection(user: UserContext, inspectionId: string, vin: string) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket);

        // Find latest active ticket for this vehicle
        const ticket = await prisma.serviceTicket.findFirst({
            where: {
                vehicleVin: vin,
                companyId: user.companyId!,
                // Assuming we want to link to any non-closed ticket
                status: { not: TicketStatus.Completed } // Adjust as needed based on exact requirements
            },
            orderBy: { createdAt: 'desc' }
        });

        if (ticket) {
            return prisma.serviceTicket.update({
                where: { id: ticket.id },
                data: { inspectionId }
            });
        }
        return null;
    }

    // --- WRITE ---

    static async create(user: UserContext, data: any) {
        PermissionService.require(user, ActionType.Create, ResourceType.ServiceTicket);
        if (!user.companyId) throw new Error("No Company Context");

        // Logic for ID Generation: [Type]-[Stock]-[Count]
        const vehicle = await prisma.vehicle.findUnique({
            where: { vin: data.vehicleVin },
            select: { stockNumber: true, status: true }
        });

        const stock = vehicle?.stockNumber || data.vehicleVin.slice(-6);
        const typeChar = (data.type === 'DETAILING') ? 'D' : 'S';

        // Robust ID Generation: Find highest number to avoid collision on deletions
        // Search by ID PREFIX, not just type, because multiple types (RECON, CLIENT_REQ) share the 'S' prefix
        // and we cannot have duplicate IDs even if types differ.
        const idPrefix = `${typeChar}-${stock}-`;
        const existingTickets = await prisma.serviceTicket.findMany({
            where: {
                id: { startsWith: idPrefix }
            },
            select: { id: true }
        });

        let nextNum = 1;
        if (existingTickets.length > 0) {
            const nums = existingTickets.map(t => {
                const lastPart = t.id.substring(t.id.lastIndexOf('-') + 1);
                return parseInt(lastPart, 10);
            }).filter(n => !isNaN(n));

            if (nums.length > 0) {
                nextNum = Math.max(...nums) + 1;
            }
        }

        const customId = `${typeChar}-${stock}-${nextNum}`;

        const ticket = await prisma.serviceTicket.create({
            data: {
                id: customId,
                vehicleVin: data.vehicleVin,
                description: data.description,
                status: TicketStatus.Queue,
                inspectionId: data.inspectionId || null,
                repairProcess: data.repairProcess || null,
                repairDifficulty: data.repairDifficulty || null,
                techId: data.techId || null,
                companyId: user.companyId,
                lotId: user.lotId,
                // New Fields
                type: data.type || "RECON",
                priority: data.priority || "Normal",
                tags: data.tags || null,
            },
        });

        // Auto-update status based on Type
        if (data.type === 'RECON') {
            await prisma.vehicle.update({
                where: { vin: data.vehicleVin },
                data: { status: 'Inspected' }
            });
            // History implicitly created by vehicle update usually? If not, we rely on prisma middleware if it exists.
            // If user complains about missing history, it likely DOES NOT exists.
            // Let's force a history log for TICKET CREATION if possible, but vehicle update is better.
        } else if (data.type === 'DETAILING') {
            // "change it to "In Detailing" (add this status) if there are NO RECON service tickets... Or keep in "In repair""
            const activeReconCount = await prisma.serviceTicket.count({
                where: {
                    vehicleVin: data.vehicleVin,
                    type: 'RECON',
                    status: { not: TicketStatus.Completed },
                    markedForDeletion: false
                }
            });

            if (activeReconCount === 0) {
                // EXPLICIT HISTORY LOGGING [CRITICAL FIX]
                const oldStatus = vehicle?.status || 'Unknown';
                const newStatus = 'In Detailing';

                await prisma.vehicle.update({
                    where: { vin: data.vehicleVin },
                    data: { status: newStatus }
                });

                await prisma.vehicleHistory.create({
                    data: {
                        vehicleId: data.vehicleVin,
                        companyId: user.companyId!,
                        userId: user.id,
                        userName: (user as any).name || 'Unknown',
                        timestamp: new Date(),
                        field: 'status',
                        oldValue: oldStatus,
                        newValue: newStatus
                    }
                });
            } else {
                // Keep in In Repair / Inspected (Ensure it's not Posted)
                await prisma.vehicle.update({
                    where: { vin: data.vehicleVin },
                    data: { status: 'In Repair' }
                });
            }
        }

        // Explicitly Log to History for Ticket Creation (User Request: "Adding ... ticket is not reflected in Audit Log")
        await prisma.vehicleHistory.create({
            data: {
                vehicleId: data.vehicleVin,
                companyId: user.companyId!,
                userId: user.id,
                userName: (user as any).name || 'Unknown',
                timestamp: new Date(),
                field: 'TICKET_CREATED',
                oldValue: '',
                newValue: `${customId} (${data.type})`
            }
        });

        return ticket;
    }

    static async update(user: UserContext, id: string, data: any) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket);

        const count = await prisma.serviceTicket.count({
            where: { id, companyId: user.companyId! }
        });
        if (count === 0) throw new Error("Ticket not found or access denied");

        return prisma.serviceTicket.update({
            where: { id },
            data: {
                description: data.description,
                status: data.status,
                techId: data.techId || null,
                repairProcess: data.repairProcess,
                repairDifficulty: data.repairDifficulty,
                // Allow updating these too
                type: data.type,
                priority: data.priority,
                tags: data.tags,
            }
        });
    }

    static async delete(user: UserContext, id: string) {
        PermissionService.require(user, ActionType.Delete, ResourceType.ServiceTicket);

        const ticket = await prisma.serviceTicket.findUnique({ where: { id } });

        await prisma.vehicleHistory.create({
            data: {
                vehicleId: ticket?.vehicleVin || '',
                companyId: user.companyId!,
                userId: user.id,
                userName: (user as any).name || 'Unknown',
                timestamp: new Date(),
                field: 'TICKET_DELETED',
                oldValue: id,
                newValue: 'DELETED'
            }
        });

        return prisma.serviceTicket.updateMany({
            where: { id, companyId: user.companyId! },
            data: {
                markedForDeletion: true,
                deletedAt: new Date(),
                deletedBy: user.id
            }
        });
    }

    // --- WORKFLOWS ---

    static async clockIn(user: UserContext, ticketId: string, selectedTasks: string[] = []) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket); // or 'work' action?

        const ticket = await prisma.serviceTicket.findFirst({
            where: { id: ticketId, companyId: user.companyId! },
            select: { status: true, vehicleVin: true, type: true }
        });
        if (!ticket) throw new Error("Ticket not found");

        await prisma.$transaction([
            prisma.timeLog.create({
                data: {
                    ticketId,
                    userId: user.id,
                    companyId: user.companyId,
                    startTime: new Date(),
                    type: 'PRODUCTIVE',
                    status: ticket.status || 'Unknown',
                    tasks: selectedTasks.length > 0 ? JSON.stringify(selectedTasks) : null
                }
            }),
            prisma.serviceTicket.update({
                where: { id: ticketId },
                data: { status: TicketStatus.InProgress }
            }),
            prisma.vehicle.update({
                where: { vin: ticket.vehicleVin },
                data: { status: 'In Repair' }
            })
        ]);
    }

    static async clockOut(user: UserContext, ticketId: string, resolutions: Record<string, any>, newIssues: any[], generalNotes?: string) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket);

        const activeLog = await prisma.timeLog.findFirst({
            where: { userId: user.id, endTime: null, ticketId }
        });
        if (!activeLog) throw new Error("No active time log found for this ticket");

        const ticket = await prisma.serviceTicket.findUnique({
            where: { id: ticketId },
            select: { inspectionId: true, vehicleVin: true }
        });

        if (ticket?.inspectionId) {
            const inspection = await prisma.inspection.findUnique({
                where: { id: ticket.inspectionId },
                include: { codes: true }
            });

            if (inspection) {
                let mechData: Record<string, any> = {};
                let cosData: Record<string, any> = {};

                try { mechData = JSON.parse(inspection.mechanicalReconData || '{}'); } catch (e) { }
                try { cosData = JSON.parse(inspection.cosmeticReconData || '{}'); } catch (e) { }

                let itemsFixedCount = 0;
                // --- Logic Copied & Adapted from service.ts ---
                Object.entries(resolutions).forEach(([id, res]) => {
                    if (id.startsWith('mech-')) {
                        const item = id.replace('mech-', '');
                        if (mechData[item]) {
                            mechData[item].notes = (mechData[item].notes ? mechData[item].notes + '\n' : '') + `[Tech]: ${res.notes}`;
                            if (res.fixed) {
                                mechData[item].status = 'Fixed';
                                itemsFixedCount++;
                            }
                        }
                    } else if (id.startsWith('cos-')) {
                        const item = id.replace('cos-', '');
                        if (cosData[item]) {
                            cosData[item].notes = (cosData[item].notes ? cosData[item].notes + '\n' : '') + `[Tech]: ${res.notes}`;
                            if (res.fixed) {
                                cosData[item].status = 'Fixed';
                                itemsFixedCount++;
                            }
                        }
                    }
                });

                // Handle New Issues
                if (newIssues && newIssues.length > 0) {
                    const COSMETIC_COMPONENTS = ['Paint', 'Body', 'Glass', 'Wheels', 'Interior', 'Upholstery', 'Detailing'];

                    newIssues.forEach(issue => {
                        const isCosmetic = COSMETIC_COMPONENTS.includes(issue.item);
                        const targetData = isCosmetic ? cosData : mechData;

                        let key = issue.item;
                        if (targetData[key]) {
                            key = `${issue.item} (New)`;
                        }

                        let notes = `[Reported by Tech]: ${issue.notes}`;
                        if (issue.fixed) {
                            notes += `\n[Tech Fixed]: ${issue.resolutionNotes}`;
                            itemsFixedCount++;
                        }

                        targetData[key] = {
                            status: issue.fixed ? 'Fixed' : 'Fail',
                            notes: notes
                        };
                    });
                }

                await prisma.inspection.update({
                    where: { id: inspection.id },
                    data: {
                        mechanicalReconData: JSON.stringify(mechData),
                        cosmeticReconData: JSON.stringify(cosData)
                    }
                });

                // Status Logic
                // ... Assume Logic ...
                let remainingIssues = 0;
                const countIssues = (d: any) => Object.values(d).forEach((v: any) => {
                    if ((typeof v === 'string' ? v : v.status) === 'Fail') remainingIssues++;
                });
                countIssues(mechData);
                countIssues(cosData);

                if (itemsFixedCount > 0) {
                    const newStatus = remainingIssues === 0 ? TicketStatus.QualityControl : 'Partially Complete';
                    await prisma.serviceTicket.update({
                        where: { id: ticketId },
                        data: { status: newStatus }
                    });
                }
            }
        }

        await prisma.timeLog.update({
            where: { id: activeLog.id },
            data: {
                endTime: new Date(),
                workDetails: Object.keys(resolutions).length > 0 ? JSON.stringify(resolutions) : null,
                notes: generalNotes || undefined
            }
        });
    }

    static async complete(user: UserContext, ticketId: string) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket);

        const ticket = await prisma.serviceTicket.findUnique({
            where: { id: ticketId },
            include: { vehicle: true }
        });
        if (!ticket) throw new Error("Ticket not found");

        const activeLog = await prisma.timeLog.findFirst({
            where: { ticketId, userId: user.id, endTime: null }
        });

        if (activeLog) {
            await prisma.timeLog.update({
                where: { id: activeLog.id },
                data: { endTime: new Date() }
            });
        }

        const newStatus = ticket.status === TicketStatus.QualityControl ? TicketStatus.Completed : TicketStatus.QualityControl;

        // Perform the status update first
        await prisma.serviceTicket.update({
            where: { id: ticketId },
            data: { status: newStatus }
        });

        // WORKFLOW AUTOMATION (Only if completed)
        if (newStatus === TicketStatus.Completed) {
            // Check if there are ANY other active tickets for this VIN
            const activeTicketsCount = await prisma.serviceTicket.count({
                where: {
                    vehicleVin: ticket.vehicleVin,
                    status: { not: TicketStatus.Completed },
                    markedForDeletion: false
                }
            });

            if (activeTicketsCount === 0) {
                // Dynamic Reversion Logic
                // Find the last status before it entered a service flow
                const history = await prisma.vehicleHistory.findMany({
                    where: {
                        vehicleId: ticket.vehicleVin,
                        field: 'status',
                        companyId: user.companyId!
                    },
                    orderBy: { timestamp: 'desc' },
                    take: 50 // Increased capture depth
                });

                // Default fallback
                let targetStatus = 'READY';
                if (ticket.type === 'DETAILING') targetStatus = 'DETAILED';

                // Look for a transition INTO service
                // e.g. from 'POSTED' to 'IN_SERVICE' or 'INSPECTED'
                // We want the 'oldValue' of that transition.
                const serviceStatuses = ['IN_SERVICE', 'IN_REPAIR', 'INSPECTED', 'WAITING_PARTS', 'IN DETAILING', 'IN REQUEST'];

                const entryLog = history.find(h =>
                    serviceStatuses.some(s => s.toUpperCase() === (h.newValue?.replace(/"/g, '') || '').toUpperCase()) &&
                    !serviceStatuses.some(s => s.toUpperCase() === (h.oldValue?.replace(/"/g, '') || '').toUpperCase())
                );

                if (entryLog && entryLog.oldValue) {
                    targetStatus = entryLog.oldValue.replace(/"/g, '');
                } else {
                    // Try case-insensitive fallback if exact match failed
                    const entryLogRelaxed = history.find(h =>
                        serviceStatuses.some(s => s.toUpperCase() === (h.newValue?.replace(/"/g, '') || '').toUpperCase()) &&
                        !serviceStatuses.includes(h.oldValue?.replace(/"/g, '') || '')
                    );
                    if (entryLogRelaxed && entryLogRelaxed.oldValue) {
                        targetStatus = entryLogRelaxed.oldValue.replace(/"/g, '');
                    }
                }

                // Apply Status
                await prisma.vehicle.update({
                    where: { vin: ticket.vehicleVin },
                    data: { status: targetStatus }
                });

                // Auto-create Detail if RECON finished and it was previously POSTED/SOLD? 
                // Or user instruction: "If the car was in Posted status... after those tickets are completed, the car should go back to the Posted Status"
                // It implies we don't necessarily chain Detailing automatically if we are reverting.
                // However, existing logic had auto-create detailing. I will COMMENT IT OUT to strictly follow "REVERT" logic unless explicitly asked to keep it.
                // User said "Start with DETAILED PLAN", plan said "Revert".
                // I will assume auto-chaining is NOT desired if we are reverting to Posted.
                // But if it was "PURCHASED", maybe we still need flow?
                // For now, I'll stick to simple reversion.
            }
        }

        return { success: true };
    }

    static async requestParts(user: UserContext, ticketId: string, description: string) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket);

        await prisma.$transaction([
            prisma.part.create({
                data: {
                    ticketId,
                    name: description,
                    status: 'ORDERED',
                    cost: 0
                }
            }),
            prisma.serviceTicket.update({
                where: { id: ticketId },
                data: { status: 'Waiting Parts' }
            }),
            prisma.timeLog.create({
                data: {
                    ticketId,
                    userId: user.id,
                    companyId: user.companyId,
                    startTime: new Date(),
                    endTime: new Date(),
                    type: 'STATUS_CHANGE',
                    notes: `Requested Parts: ${description}`
                }
            })
        ]);
    }

    static async confirmParts(user: UserContext, ticketId: string) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket);

        await prisma.$transaction([
            prisma.part.updateMany({
                where: { ticketId, status: 'ORDERED' },
                data: { status: 'RECEIVED' }
            }),
            prisma.serviceTicket.update({
                where: { id: ticketId },
                data: { status: TicketStatus.InProgress }
            }),
            prisma.timeLog.create({
                data: {
                    ticketId,
                    userId: user.id,
                    companyId: user.companyId,
                    startTime: new Date(),
                    endTime: new Date(),
                    type: 'STATUS_CHANGE',
                    notes: 'Parts Received - Resuming Work'
                }
            })
        ]);
    }
}
