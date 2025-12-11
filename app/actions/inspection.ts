'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

import { syncInspectionToTicket, createServiceTicket } from '@/app/actions/service';

// Helper to get user context securely
async function getUserContext() {
    const session = await auth();
    if (!session?.user?.id || !session.user.companyId) {
        throw new Error("Unauthorized");
    }
    return {
        id: session.user.id,
        companyId: session.user.companyId,
        lotId: session.user.lotId,
        roles: session.user.roles,
        permissions: session.user.permissions
    };
}

export async function createInspection(data: any) {
    try {
        const user = await getUserContext();
        const { vehicleVin, name, date, info, codes } = data;

        const inspection = await prisma.inspection.create({
            data: {
                vehicleVin,
                companyId: user.companyId, // Inject Tenancy
                lotId: user.lotId,
                name,
                date: new Date(date),
                info,
                needsMechanicalRecon: data.needsMechanicalRecon || false,
                needsCosmeticRecon: data.needsCosmeticRecon || false,
                mechanicalReconData: data.mechanicalReconData ? JSON.stringify(data.mechanicalReconData) : null,
                cosmeticReconData: data.cosmeticReconData ? JSON.stringify(data.cosmeticReconData) : null,
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

        // Sync or Create Service Ticket
        try {
            if ((data.needsMechanicalRecon || data.needsCosmeticRecon)) {
                // Check vehicle status first
                const vehicle = await prisma.vehicle.findUnique({
                    where: { vin: vehicleVin },
                    select: { status: true }
                });

                // ONLY auto-create if NOT Sold. 
                // If Sold, the UI handles "Client Car" ticket creation explicitly.
                if (vehicle?.status !== 'SOLD') {
                    // Determine description based on recon needs
                    const issues = [];
                    if (data.needsMechanicalRecon) issues.push("Mechanical Recon");
                    if (data.needsCosmeticRecon) issues.push("Cosmetic Recon");

                    // Create new ticket
                    await createServiceTicket({
                        vehicleVin,
                        description: `Inspection: ${issues.join(' & ')}`,
                        inspectionId: inspection.id,
                        repairDifficulty: 'Medium', // Default
                        priority: 'Normal',
                        type: 'RECON'
                    });
                }
            } else {
                // Just link to existing active ticket if any
                await syncInspectionToTicket(inspection.id, vehicleVin);
            }
        } catch (syncError) {
            console.error('Error syncing/creating ticket:', syncError);
            return { success: true, inspection, warning: `Inspection saved, but Service Ticket failed: ${syncError instanceof Error ? syncError.message : 'Unknown Error'}` };
        }

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
                    info,
                    needsMechanicalRecon: data.needsMechanicalRecon || false,
                    needsCosmeticRecon: data.needsCosmeticRecon || false,
                    mechanicalReconData: data.mechanicalReconData ? JSON.stringify(data.mechanicalReconData) : null,
                    cosmeticReconData: data.cosmeticReconData ? JSON.stringify(data.cosmeticReconData) : null,
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
            // Sync to Service Ticket
            try {
                await syncInspectionToTicket(id, updatedInspection.vehicleVin);
            } catch (syncError) {
                console.error('Error syncing inspection to ticket:', syncError);
            }

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

export async function getDiagnosticCodeDescription(code: string) {
    // Mock implementation for now
    const mockCodes: Record<string, string> = {
        'P0300': 'Random/Multiple Cylinder Misfire Detected',
        'P0171': 'System Too Lean (Bank 1)',
        'P0420': 'Catalyst System Efficiency Below Threshold (Bank 1)',
        'P0442': 'Evaporative Emission Control System Leak Detected (Small Leak)',
        'P0455': 'Evaporative Emission Control System Leak Detected (Gross Leak)',
    };
    return mockCodes[code] || 'Unknown Diagnostic Code';
}
