'use server';

import { prisma } from '@/lib/prisma';
import { driveService } from '@/lib/drive';
import { revalidatePath } from 'next/cache';
import { SystemLogger } from '@/lib/logger';
import { auth } from '@/lib/auth';


export async function syncVehicleImages(vin: string, folderUrl: string) {
    const session = await auth();
    if (!folderUrl) throw new Error('No Folder URL provided');


    const folderId = driveService.getFolderIdFromUrl(folderUrl);
    if (!folderId) throw new Error('Invalid Google Drive Folder URL');

    // CRITICAL FIX: Persist the Drive URL to the Vehicle record immediately
    await prisma.vehicle.update({
        where: { vin },
        data: { googleDriveUrl: folderUrl }
    });

    // Enqueue the heavy sync job
    const { Queue } = await import('@/lib/queue'); // Dynamic import to avoid cycles/init issues
    await Queue.enqueue('SYNC_DRIVE_FOLDER', { vin, folderId, companyId: 'todo-context' });
    await SystemLogger.log('DRIVE_SYNC_STARTED', { vin, folderId }, { id: session?.user?.id, name: session?.user?.name, companyId: session?.user?.companyId });
    // Note: passing companyId might be needed for stricter multi-tenancy worker


    // Return immediate feedback
    return {
        success: true,
        count: 0,
        deleted: 0,
        message: 'Sync started in background. Images will appear shortly.',
        images: [] // Client should handle empty list or Optimistic updates
    };
}

export async function reorderImages(vin: string, imageIds: string[]) {
    // Update order based on the array index
    const updates = imageIds.map((id, index) =>
        prisma.vehicleImage.update({
            where: { id },
            data: { order: index }
        })
    );

    await prisma.$transaction(updates);
    await prisma.$transaction(updates);
    // await prisma.$transaction(updates); // Duplicate call?
    const session = await auth();
    await SystemLogger.log('VEHICLE_IMAGES_REORDERED', { vin, count: imageIds.length }, { id: session?.user?.id, name: session?.user?.name, companyId: session?.user?.companyId });
    revalidatePath(`/inventory/${vin}`);

    revalidatePath(`/inventory/${vin}/edit`);
}

export async function toggleImageVisibility(vin: string, imageId: string, isPublic: boolean) {
    console.log(`[Server] Toggling image ${imageId} to public=${isPublic} for VIN ${vin}`);
    try {
        await prisma.vehicleImage.update({
            where: { id: imageId },
            data: { isPublic }
        });
        revalidatePath(`/inventory/${vin}`);
        revalidatePath(`/inventory/${vin}/edit`);
        const session = await auth();
        await SystemLogger.log('VEHICLE_IMAGE_VISIBILITY_UPDATED', { vin, imageId, isPublic }, { id: session?.user?.id, name: session?.user?.name, companyId: session?.user?.companyId });
        console.log(`[Server] Toggle successful`);

    } catch (error) {
        console.error(`[Server] Toggle failed:`, error);
        throw error;
    }
}
