
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStatusFlow() {
    console.log('Testing Status Flow Reversion...');

    // 1. Setup: Find or Create a Vehicle in POSTED status
    let vin = 'TEST-VIN-' + Date.now();
    await prisma.vehicle.create({
        data: {
            vin: vin,
            year: 2020,
            make: 'Test',
            model: 'Car',
            status: 'POSTED',
            stockNumber: 'STK001'
        }
    });

    console.log(`Created Vehicle ${vin} with status POSTED`);

    // 2. Create Service Ticket (This should change status to IN_SERVICE probably? Or Queue?)
    // Note: Our TicketService.create actually calls:
    // "Transition vehicle to IN_SERVICE (or appropriate status) upon ticket creation."
    // Let's verify existing logic. Using 'RECON' type usually triggers 'Inspected' in my code logic unless I changed it.
    // In my edit to TicketService: "Transition vehicle to IN_SERVICE (or appropriate status) upon ticket creation."
    // Actually the code says:
    // if (data.type === 'RECON') { await prisma.vehicle.update(..., { status: 'Inspected' }) }

    // Simulating calling TicketService.create logic manually for test
    await prisma.serviceTicket.create({
        data: {
            id: 'S-TEST-1',
            vehicleVin: vin,
            description: 'Test Ticket',
            status: 'Queue',
            type: 'RECON',
            priority: 'Normal',
            companyId: 'test-co', // Mock
        }
    });

    // Simulate Status Change to IN_SERVICE
    await prisma.vehicle.update({
        where: { vin },
        data: { status: 'IN_SERVICE' } // This creates a History Entry
    });
    console.log(`Vehicle ${vin} moved to IN_SERVICE`);

    // 3. Complete Ticket -> Should Revert
    // Verify History Exists
    const history = await prisma.vehicleHistory.findMany({ where: { vehicleId: vin } });
    console.log('History Records:', history.length); // Should be at least Creation + Status Change

    // Simulate complete logic (Dynamic Reversion) from TicketService.complete
    console.log('Completing Ticket...');

    // Re-fetch history to be sure
    const historyFetch = await prisma.vehicleHistory.findMany({
        where: { vehicleId: vin, field: 'status' },
        orderBy: { timestamp: 'desc' }
    });

    const serviceStatuses = ['IN_SERVICE', 'IN_REPAIR', 'INSPECTED', 'WAITING_PARTS'];
    // Logic from TicketService
    const entryLog = historyFetch.find(h =>
        serviceStatuses.includes(h.newValue?.replace(/"/g, '') || '') &&
        !serviceStatuses.includes(h.oldValue?.replace(/"/g, '') || '')
    );

    let targetStatus = 'READY';
    if (entryLog && entryLog.oldValue) {
        targetStatus = entryLog.oldValue.replace(/"/g, '');
    }

    console.log(`Detected Reversion Target: ${targetStatus}`);

    if (targetStatus === 'POSTED') {
        console.log('SUCCESS: Logic correctly identified POSTED as previous status.');
    } else {
        console.error(`FAILURE: Expected POSTED, got ${targetStatus}`);
        // Log details
        console.log('History Dump:', JSON.stringify(historyFetch, null, 2));
    }

    // Cleanup
    await prisma.serviceTicket.deleteMany({ where: { vehicleVin: vin } });
    await prisma.vehicle.delete({ where: { vin } });
}

testStatusFlow()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
