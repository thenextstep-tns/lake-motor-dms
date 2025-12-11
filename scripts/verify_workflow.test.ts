
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TicketService } from '../app/services/TicketService';
import { UserContext } from '../app/services/PermissionService';

const prisma = new PrismaClient();

// Mock User Context
const mockUser: UserContext = {
    id: 'test-user',
    companyId: 'test-company',
    lotId: 'test-lot',
    roles: ['Admin'],
    permissions: ['create:ServiceTicket', 'update:ServiceTicket', 'read:ServiceTicket', 'delete:ServiceTicket']
};

describe('Post-Sale & Detailing Workflows', () => {
    let vehicleVin: string;

    beforeAll(async () => {
        // Clean up
        await prisma.serviceTicket.deleteMany({ where: { description: { contains: 'TEST-FLOW' } } });
        await prisma.vehicle.deleteMany({ where: { vin: 'TEST-VIN-FLOW' } });

        // Create Test Vehicle
        vehicleVin = 'TEST-VIN-FLOW';
        await prisma.vehicle.create({
            data: {
                vin: vehicleVin,
                year: 2024,
                make: 'Test',
                model: 'Flow',
                status: 'PURCHASED',
                companyId: mockUser.companyId!,
                lotId: mockUser.lotId!,
                purchasePrice: 1000,
                salePrice: 2000,
                odometer: 100,
                color: 'White',
                interiorColor: 'Black',
                bodyStyle: 'SUV',
                condition: 'Used',
                titleStatus: 'Clean'
            }
        });
    });

    afterAll(async () => {
        // Cleanup handled primarily by unique VIN, but good practice
        await prisma.serviceTicket.deleteMany({ where: { vehicleVin: vehicleVin } });
        await prisma.vehicle.deleteMany({ where: { vin: vehicleVin } });
    });

    it('Scenario 1: Standard Recon -> Auto-Create Detailing', async () => {
        // 1. Create Recon Ticket
        const ticket = await TicketService.create(mockUser, {
            vehicleVin,
            description: 'TEST-FLOW: Standard Recon',
            type: 'RECON',
            priority: 'Normal'
        });
        expect(ticket.status).toBe('Queue');

        // 2. Complete Ticket
        await TicketService.complete(mockUser, ticket.id);

        // 3. Verify Vehicle Status and New Ticket
        const vehicle = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
        expect(vehicle?.status).toBe('REPAIRED');

        const activeTickets = await prisma.serviceTicket.findMany({
            where: { vehicleVin, status: { not: 'Completed' } }
        });
        expect(activeTickets.length).toBe(1);
        expect(activeTickets[0].type).toBe('DETAILING');
    });

    it('Scenario 2: Detailing Completion', async () => {
        // Find the detailing ticket from Scenario 1
        const detailingTicket = await prisma.serviceTicket.findFirst({
            where: { vehicleVin, type: 'DETAILING', status: { not: 'Completed' } }
        });
        expect(detailingTicket).toBeDefined();

        // Complete it
        await TicketService.complete(mockUser, detailingTicket!.id);

        // Verify Status
        const vehicle = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
        expect(vehicle?.status).toBe('DETAILED');
    });

    it('Scenario 3: Post-Sale Client Repair', async () => {
        // 1. Set Vehicle to SOLD
        await prisma.vehicle.update({ where: { vin: vehicleVin }, data: { status: 'SOLD' } });

        // 2. Create Client Ticket (Manual trigger simulation)
        const ticket = await TicketService.create(mockUser, {
            vehicleVin,
            description: 'TEST-FLOW: Client Repair',
            type: 'CLIENT_REQ',
            priority: 'Critical'
        });

        // 3. Complete Ticket
        await TicketService.complete(mockUser, ticket.id);

        // 4. Verify Status
        const vehicle = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
        expect(vehicle?.status).toBe('READY_FOR_PICKUP');
    });
});
