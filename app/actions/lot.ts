'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/session';
import { SystemLogger } from '@/lib/logger';


export async function getCompanyLots(companyId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return await prisma.lot.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
        include: {
            contacts: true,
            _count: {
                select: { vehicles: true }
            }
        }
    });
}

export async function createLot(
    companyId: string,
    data: {
        name: string;
        address?: string;
        timezone?: string;
        workingHours?: string;
        contacts?: { type: string; value: string; label?: string }[]
    }
) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    try {
        console.log('Creating Lot:', { companyId, data });
        const lot = await prisma.lot.create({
            data: {
                name: data.name,
                address: data.address,
                timezone: data.timezone,
                workingHours: data.workingHours,
                companyId,
                contacts: {
                    create: data.contacts?.map(c => ({
                        type: c.type,
                        value: c.value,
                        label: c.label
                    }))
                }
            },
        });
        console.log('Lot created:', lot.id);
        await SystemLogger.log('LOT_CREATED', { id: lot.id, name: data.name }, { id: user.id, name: user.name, companyId: user.companyId });

        revalidatePath('/settings/lots');
        return lot;
    } catch (error) {
        console.error('Error creating lot:', error);
        throw error;
    }
}

export async function updateLot(
    lotId: string,
    data: {
        name: string;
        address?: string;
        timezone?: string;
        workingHours?: string;
        contacts?: { type: string; value: string; label?: string }[]
    }
) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    try {
        console.log('Updating Lot:', { lotId, data });
        // Transaction to handle contacts replacement
        const lot = await prisma.$transaction(async (tx) => {
            if (data.contacts) {
                await tx.lotContact.deleteMany({ where: { lotId } });
            }

            return await tx.lot.update({
                where: { id: lotId },
                data: {
                    name: data.name,
                    address: data.address,
                    timezone: data.timezone,
                    workingHours: data.workingHours,
                    contacts: data.contacts ? {
                        create: data.contacts.map(c => ({
                            type: c.type,
                            value: c.value,
                            label: c.label
                        }))
                    } : undefined
                },
            });
        });

        console.log('Lot updated:', lot.id);
        await SystemLogger.log('LOT_UPDATED', { id: lot.id, updates: data }, { id: user.id, name: user.name, companyId: user.companyId });
        revalidatePath('/settings/lots');

        return lot;
    } catch (error) {
        console.error('Error updating lot:', error);
        throw error;
    }
}

export async function deleteLot(lotId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    try {
        await prisma.lot.delete({
            where: { id: lotId },
        });
        await SystemLogger.log('LOT_DELETED', { id: lotId }, { id: user.id, name: user.name, companyId: user.companyId });
        revalidatePath('/settings/lots');

    } catch (error) {
        console.error('Error deleting lot:', error);
        throw error;
    }
}
