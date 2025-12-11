
// Use relative path to avoid alias issues if not configured in tsx
import { prisma } from '../lib/prisma';
import { TicketService } from '../app/services/TicketService';
import { UserContext } from '../app/services/PermissionService';

// const prisma = new PrismaClient(); // Removed local instantiation

// Mock User Context
const mockUser: UserContext = {
    id: 'test-user',
    companyId: 'test-company',
    lotId: 'test-lot',
    roles: ['Admin'],
    permissions: ['create:ServiceTicket', 'update:ServiceTicket', 'read:ServiceTicket', 'delete:ServiceTicket']
};

async function runVerification() {
    console.log('Starting Verification...');

    // Setup Dependencies
    const companyId = 'test-comp-' + Date.now();
    const lotId = 'test-lot-' + Date.now();

    // Create Company & Lot (assuming simple requirements, adjust based on schema if needed)
    // Note: If Company/Lot have many required fields, this might be verbose.
    // Let's check schema first.
    // Based on standard schemas:
    try {
        await prisma.company.create({
            data: {
                id: companyId,
                name: 'Test Company',
                // Add other required fields if any found in schema view
            }
        });
        await prisma.lot.create({
            data: {
                id: lotId,
                companyId: companyId,
                name: 'Test Lot'
            }
        });
        console.log(`Created Company: ${companyId} and Lot: ${lotId}`);
    } catch (e) {
        console.log('Error creating Company/Lot (might exist or schema mismatch):', e);
        // If they fail, we might try to proceed if we think they exist, but better to fail.
        // Or strictly rely on what I see in schema.
    }

    // Update mockUser
    mockUser.companyId = companyId;
    mockUser.lotId = lotId;

    // Setup
    const vehicleVin = 'TEST-VIN-FLOW-' + Date.now();
    await prisma.vehicle.create({
        data: {
            vin: vehicleVin,
            year: 2024,
            make: 'Test',
            model: 'Flow',
            status: 'PURCHASED',
            companyId: companyId,
            lotId: lotId,
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
    console.log(`Created Vehicle: ${vehicleVin}`);

    try {
        // Scenario 1: Standard Recon -> Auto-Create Detailing
        console.log('\n--- Scenario 1: Standard Recon ---');
        const ticket = await TicketService.create(mockUser, {
            vehicleVin,
            description: 'TEST-FLOW: Standard Recon',
            type: 'RECON',
            priority: 'Normal'
        });
        console.log('Created Recon Ticket:', JSON.stringify(ticket, null, 2));
        console.log('Ticket Type (Explicit):', (ticket as any).type); // Check if undefined

        await TicketService.complete(mockUser, ticket.id);
        console.log('Completed Recon Ticket');

        const vehicleAfterRecon = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
        console.log('Vehicle Status:', vehicleAfterRecon?.status);
        if (vehicleAfterRecon?.status !== 'REPAIRED') throw new Error(`Expected REPAIRED, got ${vehicleAfterRecon?.status}`);

        const activeTickets = await prisma.serviceTicket.findMany({
            where: { vehicleVin, status: { not: 'Completed' } }
        });
        console.log('Active Tickets:', activeTickets.length);
        if (activeTickets.length !== 1) throw new Error('Expected 1 active ticket (Detailing)');
        if (activeTickets[0].type !== 'DETAILING') throw new Error(`Expected DETAILING ticket, got ${activeTickets[0].type}`);
        console.log('Verified: Detailing Ticket Created');

        // Scenario 2: Detailing
        console.log('\n--- Scenario 2: Detailing ---');
        const detailingTicket = activeTickets[0];
        await TicketService.complete(mockUser, detailingTicket.id);
        console.log('Completed Detailing Ticket');

        const vehicleAfterDetail = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
        console.log('Vehicle Status:', vehicleAfterDetail?.status);
        if (vehicleAfterDetail?.status !== 'DETAILED') throw new Error(`Expected DETAILED, got ${vehicleAfterDetail?.status}`);

        // Scenario 3: Post-Sale Client Repair
        console.log('\n--- Scenario 3: Client Repair ---');
        await prisma.vehicle.update({ where: { vin: vehicleVin }, data: { status: 'SOLD' } });
        console.log('Set Vehicle to SOLD');

        const clientTicket = await TicketService.create(mockUser, {
            vehicleVin,
            description: 'TEST-FLOW: Client Repair',
            type: 'CLIENT_REQ',
            priority: 'Critical'
        });
        console.log('Created Client Ticket:', clientTicket.id);

        await TicketService.complete(mockUser, clientTicket.id);
        console.log('Completed Client Ticket');

        const vehicleAfterClient = await prisma.vehicle.findUnique({ where: { vin: vehicleVin } });
        console.log('Vehicle Status:', vehicleAfterClient?.status);
        if (vehicleAfterClient?.status !== 'READY_FOR_PICKUP') throw new Error(`Expected READY_FOR_PICKUP, got ${vehicleAfterClient?.status}`);

        console.log('\nSUCCESS: All Scenarios Verified!');

    } catch (e) {
        console.error('VERIFICATION FAILED:', e);
    } finally {
        // Cleanup
        console.log('\nCleaning up...');
        await prisma.serviceTicket.deleteMany({ where: { vehicleVin } });
        await prisma.vehicle.deleteMany({ where: { vin: vehicleVin } });
    }
}

runVerification();
