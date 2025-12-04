'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createInspection(data: any) {
    try {
        const { vehicleVin, name, date, info, codes } = data;

        const inspection = await prisma.inspection.create({
            data: {
                vehicleVin,
                name,
                date: new Date(date),
                info,
                codes: {
                    create: codes.map((c: any) => ({
                        code: c.code,
                        description: c.description
                    }))
                }
            },
            include: {
                codes: true
            }
        });

        revalidatePath(`/inventory/${vehicleVin}`);
        revalidatePath(`/inventory/${vehicleVin}/edit`);
        return { success: true, inspection };
    } catch (error) {
        console.error('Error creating inspection:', error);
        return { success: false, error: 'Failed to create inspection' };
    }
}

export async function updateInspection(id: string, data: any) {
    try {
        const { name, date, info, codes } = data;

        // Transaction to handle codes update (delete all and recreate is simplest for now, or careful update)
        // For simplicity, we'll delete existing codes and create new ones
        await prisma.$transaction(async (tx) => {
            // Update basic info
            await tx.inspection.update({
                where: { id },
                data: {
                    name,
                    date: new Date(date),
                    info
                }
            });

            // Delete existing codes
            await tx.inspectionCode.deleteMany({
                where: { inspectionId: id }
            });

            // Create new codes
            if (codes && codes.length > 0) {
                await tx.inspectionCode.createMany({
                    data: codes.map((c: any) => ({
                        inspectionId: id,
                        code: c.code,
                        description: c.description
                    }))
                });
            }
        });

        // Fetch updated inspection to get VIN for revalidation
        const updatedInspection = await prisma.inspection.findUnique({
            where: { id },
            select: { vehicleVin: true }
        });

        if (updatedInspection) {
            revalidatePath(`/inventory/${updatedInspection.vehicleVin}`);
            revalidatePath(`/inventory/${updatedInspection.vehicleVin}/edit`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating inspection:', error);
        return { success: false, error: 'Failed to update inspection' };
    }
}

export async function deleteInspection(id: string, vin: string) {
    try {
        await prisma.inspection.delete({
            where: { id }
        });

        revalidatePath(`/inventory/${vin}`);
        revalidatePath(`/inventory/${vin}/edit`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting inspection:', error);
        return { success: false, error: 'Failed to delete inspection' };
    }
}
