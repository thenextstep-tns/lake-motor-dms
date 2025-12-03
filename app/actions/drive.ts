'use server';

import { prisma } from '@/lib/prisma';
import { driveService } from '@/lib/drive';
import { revalidatePath } from 'next/cache';

export async function syncVehicleImages(vin: string, folderUrl: string) {
    if (!folderUrl) throw new Error('No Folder URL provided');

    const folderId = driveService.getFolderIdFromUrl(folderUrl);
    if (!folderId) throw new Error('Invalid Google Drive Folder URL');

    const files = await driveService.listFilesInFolder(folderId);

    if (!files || files.length === 0) {
        return { success: true, count: 0, message: 'No files found in folder' };
    }

    // Get existing images to determine order and identify orphans
    const existingImages = await prisma.vehicleImage.findMany({
        where: { vehicleVin: vin },
        orderBy: { order: 'asc' }
    });

    // 1. Identify and Delete Orphans (Images in DB but not in new Drive Folder)
    const driveFileIds = new Set(files.map((f: any) => f.id));
    const orphans = existingImages.filter(img => img.driveId && !driveFileIds.has(img.driveId));

    if (orphans.length > 0) {
        await prisma.vehicleImage.deleteMany({
            where: {
                id: { in: orphans.map(o => o.id) }
            }
        });
        console.log(`Deleted ${orphans.length} orphaned images for VIN ${vin}`);
    }

    // 2. Add New Images
    let nextOrder = existingImages.length > 0
        ? (existingImages[existingImages.length - 1].order || 0) + 1
        : 0;

    // Reset order if we deleted everything? 
    // If we deleted everything (e.g. new folder), nextOrder should probably start at 0.
    // But if we just deleted some, we append. 
    // If the user switched folders completely, 'orphans' would be ALL existing images.
    // So existingImages.length would be equal to orphans.length.
    if (orphans.length === existingImages.length) {
        nextOrder = 0;
    }

    let count = 0;
    for (const file of files) {
        // Check if image already exists (in the remaining set)
        const exists = existingImages.find(img => img.driveId === file.id);

        if (!exists && file.id) {
            await prisma.vehicleImage.create({
                data: {
                    vehicleVin: vin,
                    driveId: file.id,
                    publicUrl: file.thumbnailLink || file.webViewLink, // Fallback
                    mimeType: file.mimeType,
                    name: file.name,
                    order: nextOrder++,
                    isPublic: true // Default to visible
                }
            });
            count++;
        }
    }

    revalidatePath(`/inventory/${vin}`);
    revalidatePath(`/inventory/${vin}/edit`);
    revalidatePath('/inventory');

    return {
        success: true,
        count,
        deleted: orphans.length,
        message: `Synced: Added ${count} new, Removed ${orphans.length} old`
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
        console.log(`[Server] Toggle successful`);
    } catch (error) {
        console.error(`[Server] Toggle failed:`, error);
        throw error;
    }
}
