'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addDeposit(data: {
    vehicleVin: string;
    buyerName: string;
    amount: number;
    method: string;
    date: Date;
    expiryDate: Date;
    notes?: string;
}) {
    try {
        const deposit = await prisma.deposit.create({
            data: {
                vehicleVin: data.vehicleVin,
                buyerName: data.buyerName,
                amount: data.amount,
                method: data.method,
                date: data.date,
                expiryDate: data.expiryDate,
                notes: data.notes,
            },
        });

        // Update vehicle status to ON_HOLD
        await prisma.vehicle.update({
            where: { vin: data.vehicleVin },
            data: { status: 'ON_HOLD' },
        });

        revalidatePath('/inventory');
        revalidatePath(`/inventory/${data.vehicleVin}`);
        revalidatePath('/public/inventory');
        revalidatePath(`/public/inventory/${data.vehicleVin}`);

        return { success: true, deposit };
    } catch (error) {
        console.error('Error adding deposit:', error);
        return { success: false, error: 'Failed to add deposit' };
    }
}
