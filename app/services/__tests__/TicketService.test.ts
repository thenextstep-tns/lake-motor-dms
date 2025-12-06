import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketService } from '../TicketService';
import { UserContext } from '../PermissionService';
import { prisma } from '@/lib/prisma';
import { ActionType, ResourceType } from '../../domain/constants';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        serviceTicket: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            count: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        vehicle: {
            update: vi.fn(),
        }
    }
}));

describe('TicketService', () => {
    const mockUser: UserContext = {
        id: 'user-1',
        companyId: 'comp-1',
        lotId: 'lot-1',
        permissions: [
            `${ActionType.Read}:${ResourceType.ServiceTicket}`,
            `${ActionType.Create}:${ResourceType.ServiceTicket}`,
            `${ActionType.Update}:${ResourceType.ServiceTicket}`,
        ]
    };

    const restrictedUser: UserContext = {
        id: 'user-2',
        companyId: 'comp-1',
        permissions: [] // No permissions
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        it('should fetch tickets for the company', async () => {
            await TicketService.getAll(mockUser);
            expect(prisma.serviceTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    companyId: 'comp-1',
                    lotId: 'lot-1'
                })
            }));
        });

        it('should throw if user lacks permission', async () => {
            await expect(TicketService.getAll(restrictedUser))
                .rejects.toThrow('Permission Denied');
        });
    });

    describe('create', () => {
        it('should create a ticket and update vehicle status', async () => {
            const data = {
                vehicleVin: 'VIN123',
                description: 'Test Ticket'
            };

            (prisma.serviceTicket.create as any).mockResolvedValue({ id: 'ticket-1', ...data });

            await TicketService.create(mockUser, data);

            expect(prisma.serviceTicket.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    vehicleVin: 'VIN123',
                    companyId: 'comp-1',
                    lotId: 'lot-1'
                })
            }));

            expect(prisma.vehicle.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { vin: 'VIN123' },
                data: { status: 'Inspected' }
            }));
        });
    });

    describe('update', () => {
        it('should throw if ticket does not exist in company scope', async () => {
            (prisma.serviceTicket.count as any).mockResolvedValue(0);
            await expect(TicketService.update(mockUser, 'bad-id', {}))
                .rejects.toThrow('Ticket not found or access denied');
        });
    });
});
