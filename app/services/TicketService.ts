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
            const currentVehicle = await prisma.vehicle.findUnique({
                where: { vin: data.vehicleVin },
                select: { status: true }
            });

            // Rule: "We add an inspection report, and the vehicle has not been posted or sold -> Inspected."
            const isPostedOrSold = ['POSTED', 'SOLD'].includes(currentVehicle?.status?.toUpperCase() || '');

            if (!isPostedOrSold) {
                await prisma.vehicle.update({
                    where: { vin: data.vehicleVin },
                    data: { status: 'Inspected' }
                });
            }
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
                        userName: user.name || 'Unknown',
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
                userName: user.name || 'Unknown',
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
                userName: user.name || 'Unknown',
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
            select: { status: true, vehicleVin: true, type: true, techId: true }
        });
        if (!ticket) throw new Error("Ticket not found");

        const shouldAssign = !ticket.techId;

        // Rule: "Anyone gets assigned a service ticket -> In repair" (or In Detailing for detailing tickets)
        // User workflow Step 3 & 5
        const targetAttributes: any = { status: 'In Repair' };
        if (ticket.type === 'DETAILING') {
            targetAttributes.status = 'In Detailing';
        }

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
                data: {
                    status: TicketStatus.InProgress,
                    techId: shouldAssign ? user.id : undefined
                }
            }),
            prisma.vehicle.update({
                where: { vin: ticket.vehicleVin },
                data: targetAttributes
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

        // --- Status Logic ---
        // User Rules:
        // 1. Detailers -> QC
        // 2. Managers -> Bypass QC (Straight to Completed)

        const bypassRoles = [
            'SystemAdmin', 'CompanyOwner', 'LocationManager', 'ServiceManager', 'ShopManager',
            // Add Display Names (Space-separated) to catch mismatched session formats
            'System Admin', 'Company Owner', 'Location Manager', 'Service Manager', 'Shop Manager'
        ];

        // Debug Log
        console.log(`[TicketService.complete] User: ${user.name}, Roles: ${JSON.stringify(user.roles)}, Ticket Status: ${ticket.status}`);

        // Check if user has ANY of the bypass roles
        // user.roles is just string[] based on UserContext interface
        const canBypassQA = user.roles ? user.roles.some(r => bypassRoles.includes(r)) : false;

        let newStatus = TicketStatus.QualityControl;

        if (canBypassQA) {
            // Managers always complete directly
            newStatus = TicketStatus.Completed;
        } else {
            // Technicians / Detailers
            if (ticket.status === TicketStatus.QualityControl) {
                // If already in QC, a non-manager cannot complete it
                throw new Error("Permission Denied: Quality Control approval required.");
            }
            newStatus = TicketStatus.QualityControl;
        }

        // Perform the status update first
        await prisma.serviceTicket.update({
            where: { id: ticketId },
            data: { status: newStatus }
        });

        // WORKFLOW AUTOMATION (Only if completed)
        if (newStatus === TicketStatus.Completed) {
            // Rule 4 & 6
            // 1. Check if ANY other active tickets (Status != Completed)
            const activeTicketsCount = await prisma.serviceTicket.count({
                where: {
                    vehicleVin: ticket.vehicleVin,
                    status: { not: TicketStatus.Completed },
                    markedForDeletion: false
                }
            });

            if (activeTicketsCount === 0) {
                // 2. Check for Previous "POSTED" or "SOLD" status in History
                // "If yes -> Back to posted or sold, whichever was last"
                const history = await prisma.vehicleHistory.findFirst({
                    where: {
                        vehicleId: ticket.vehicleVin,
                        newValue: { in: ['POSTED', 'SOLD'] }, // Check for these specific statuses
                        companyId: user.companyId!
                    },
                    orderBy: { timestamp: 'desc' },
                });

                if (history && history.newValue) {
                    // Revert to history
                    const targetStatus = history.newValue.replace(/"/g, ''); // cleanup quotes if any
                    await prisma.vehicle.update({
                        where: { vin: ticket.vehicleVin },
                        data: { status: targetStatus }
                    });
                } else {
                    // 3. If NOT posted/sold (New Inventory Flow)
                    if (ticket.type === 'RECON') {
                        // "Repaired, and create a Detailing ticket"
                        await prisma.vehicle.update({
                            where: { vin: ticket.vehicleVin },
                            data: { status: 'Repaired' }
                        });

                        // Create Detailing Ticket
                        // Use a simplified internal create (avoiding permission checks loop if possible, or use standard create)
                        // We need to fetch vehicle stock for ID gen, or re-use create logic. 
                        // It is safer to use TicketService.create but we need to mock UserContext or reuse `user`.

                        // ID Gen logic copy is safer here to avoid circular dep or heavy refactor
                        // Or just call TicketService.create with current context
                        await TicketService.create(user, {
                            vehicleVin: ticket.vehicleVin,
                            description: 'Post-Repair Detailing',
                            priority: 'Normal',
                            type: 'DETAILING'
                        });

                    } else if (ticket.type === 'DETAILING') {
                        // "Detailed"
                        await prisma.vehicle.update({
                            where: { vin: ticket.vehicleVin },
                            data: { status: 'Detailed' }
                        });
                    }
                }
            }
        }

        return { success: true };
    }


    static async assignTech(user: UserContext, ticketId: string, techId: string) {
        PermissionService.require(user, ActionType.Update, ResourceType.ServiceTicket);

        const ticket = await prisma.serviceTicket.findUnique({
            where: { id: ticketId, companyId: user.companyId! }
        });
        if (!ticket) throw new Error("Ticket not found");

        const status = ticket.status === TicketStatus.Queue ? TicketStatus.Assigned : ticket.status;

        const targetAttributes: any = { status: 'In Repair' };
        if (ticket.type === 'DETAILING') {
            targetAttributes.status = 'In Detailing';
        }

        await prisma.$transaction([
            prisma.serviceTicket.update({
                where: { id: ticketId },
                data: {
                    techId,
                    status
                }
            }),
            prisma.vehicle.update({
                where: { vin: ticket.vehicleVin },
                data: targetAttributes
            })
        ]);
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
