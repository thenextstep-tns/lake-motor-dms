
import { SystemLogger } from '../lib/logger';
import { prisma } from '../lib/prisma';

async function verifyEventSystem() {
    console.log("---------------------------------------------------");
    console.log("🔍 STARTING EVENT SYSTEM HEALTH CHECK");
    console.log("---------------------------------------------------");

    // 1. Check Table Existence
    console.log("\n1️⃣  Checking Database Schema...");
    try {
        const count = await prisma.systemEvent.count();
        console.log(`✅ Table 'SystemEvent' exists. Current Record Count: ${count}`);
    } catch (e) {
        console.error("❌ CRITICAL: 'SystemEvent' table is MISSING or inaccessible.");
        console.error(e);
        process.exit(1);
    }

    // 2. Perform Write Test (Blocking)
    const testId = `verify-${Date.now()}`;
    console.log(`\n2️⃣  Testing Blocking Write (SystemLogger.log)...`);
    const startTime = Date.now();

    try {
        await SystemLogger.log('SYSTEM_HEALTH_CHECK', { testId, status: 'RUNNING' }, { name: 'HealthCheckScript' });
        const duration = Date.now() - startTime;
        console.log(`✅ Write operation completed in ${duration}ms.`);
    } catch (e) {
        console.error("❌ Failed to write log.");
        console.error(e);
        process.exit(1);
    }

    // 3. Perform Read Verification
    console.log(`\n3️⃣  Verifying Persistence (Reading back log)...`);
    const log = await prisma.systemEvent.findFirst({
        where: { type: 'SYSTEM_HEALTH_CHECK', payload: { contains: testId } }
    });

    if (log) {
        console.log(`✅ Log Found! ID: ${log.id}`);
        console.log(`   Timestamp: ${log.timestamp}`);
        console.log(`   Payload: ${log.payload}`);
    } else {
        console.error("❌ CRITICAL: Log was written but COULD NOT BE FOUND via query.");
        process.exit(1);
    }

    console.log("\n---------------------------------------------------");
    console.log("🟢 SYSTEM VERIFICATION PASSED");
    console.log("The event logging system is active, writing to DB, and readable.");
    console.log("---------------------------------------------------");
}

verifyEventSystem()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
