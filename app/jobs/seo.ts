
import { prisma } from '@/lib/prisma';

export async function generateSeoWorker(data: any) {
    const { vin, companyId } = data;
    console.log(`[Worker] Generating SEO for ${vin}...`);

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { vin },
            include: { serviceTickets: true }
        });

        if (!vehicle) {
            console.error('[Worker] Vehicle not found for SEO generation');
            return;
        }

        // Mock AI Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const description = `Check out this amazing ${vehicle.year} ${vehicle.make} ${vehicle.model}! 
        Finished in a stunning ${vehicle.color}, this vehicle has only ${vehicle.odometer} miles. 
        Fully inspected and serviced, it's ready for the road. 
        Visit Lake Motor Group today to test drive this ${vehicle.trim} edition.`;

        await prisma.vehicle.update({
            where: { vin },
            data: { seoDescription: description }
        });

        console.log(`[Worker] SEO Generated for ${vin}`);
    } catch (err) {
        console.error('[Worker] SEO Generation Failed:', err);
    }
}
