'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generateSeoDescription(vin: string) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { vin },
        include: { serviceTickets: true }, // Include tickets to get inspection notes
    });

    if (!vehicle) throw new Error('Vehicle not found');

    // Mock AI Call
    // In reality:
    // const prompt = `Write an SEO description for a ${vehicle.year} ${vehicle.make} ${vehicle.model}...`;
    // const description = await openai.chat.completions.create(...)

    const description = `Check out this amazing ${vehicle.year} ${vehicle.make} ${vehicle.model}! 
  Finished in a stunning ${vehicle.color}, this vehicle has only ${vehicle.odometer} miles. 
  Fully inspected and serviced, it's ready for the road. 
  Visit Lake Motor Group today to test drive this ${vehicle.trim} edition.`;

    // We could store this in a new field 'seoDescription' on the Vehicle model
    // For now, we'll just return it to the UI to be copied or used
    return description;
}
