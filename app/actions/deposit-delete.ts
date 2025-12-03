'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteDeposit(depositId: string, vehicleVin: string) {
    try {
        await prisma.deposit.delete({
            where: { id: depositId },
        });

        // Check if there are other active deposits
        const remainingDeposits = await prisma.deposit.count({
            where: { vehicleVin },
        });

        if (remainingDeposits === 0) {
            // Revert status to POSTED if no deposits left
            // Or should we check if it was SOLD? 
            // The requirement says "changes the status of the vehicle back to POSTED"
            await prisma.vehicle.update({
                where: { vin: vehicleVin },
                data: { status: 'POSTED' },
            });
        }

        revalidatePath('/inventory');
        revalidatePath(`/inventory/${vehicleVin}`);
        revalidatePath('/public/inventory');
        revalidatePath(`/public/inventory/${vehicleVin}`);

        return { success: true };
    } catch (error) {
        console.error('Error deleting deposit:', error);
        return { success: false, error: 'Failed to delete deposit' };
    }
}
