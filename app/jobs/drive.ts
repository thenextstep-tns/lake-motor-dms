
import { prisma } from '@/lib/prisma';
import { driveService } from '@/lib/drive';
import { Queue } from '@/lib/queue';

// This is the "Worker" logic. 
// It is designed to be called by the Queue, not directly by the user action.

export async function syncDriveFolderWorker(payload: { vin: string, folderId: string, companyId: string }) {
    const { vin, folderId, companyId } = payload;
    console.log(`[Worker] Syncing Drive Folder for VIN: ${vin} (Folder: ${folderId})`);

    // 1. Fetch files from Google Drive (Read-Only)
    const files = await driveService.listFilesInFolder(folderId);
    console.log(`[Worker] Found ${files.length} files in Drive.`);

    if (files.length === 0) return;

    // 2. Sync to Database
    // Fetch existing images to determine what's new and what's deleted (orphans)
    const existingImages = await prisma.vehicleImage.findMany({
        where: { vehicleVin: vin }
    });

    const driveFileMap = new Map(files.map((f: any) => [f.id, f]));
    const existingIsMap = new Map(existingImages.map(img => [img.driveId, img]));

    // A. Handle Orphans (In DB, but not in Drive)
    const orphans = existingImages.filter(img => img.driveId && !driveFileMap.has(img.driveId));
    if (orphans.length > 0) {
        console.log(`[Worker] Deleting ${orphans.length} orphaned images.`);
        await prisma.vehicleImage.deleteMany({
            where: { id: { in: orphans.map(o => o.id) } }
        });
    }

    // B. Add New Images
    const newFiles = files.filter((f: any) => !existingIsMap.has(f.id));
    console.log(`[Worker] Adding ${newFiles.length} new images.`);

    // Determine starting order
    const maxOrder = existingImages.reduce((max, img) => (img.order > max ? img.order : max), -1);
    let nextOrder = maxOrder + 1;

    // Reset order if we deleted everything (fresh sync)
    // Using a simple heuristic: if we have orphans and distinct count is 0? 
    // Just appending is safer.

    for (const file of newFiles) {
        await prisma.vehicleImage.create({
            data: {
                vehicleVin: vin,
                driveId: file.id,
                publicUrl: file.thumbnailLink || file.webViewLink,
                isPublic: true,
                mimeType: file.mimeType,
                name: file.name,
                order: nextOrder++
            }
        });
    }

    // 3. Update Vehicle's Main Drive URL if missing
    const vehicle = await prisma.vehicle.findUnique({ where: { vin } });
    if (vehicle && !vehicle.googleDriveUrl) {
        await prisma.vehicle.update({
            where: { vin },
            data: {
                googleDriveUrl: `https://drive.google.com/drive/folders/${folderId}`
            }
        });
    }

    console.log(`[Worker] Sync Complete for ${vin}`);
}

// Register this worker with the Queue
Queue.register('SYNC_DRIVE_FOLDER', syncDriveFolderWorker);
