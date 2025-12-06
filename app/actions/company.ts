'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/session';

export async function getCompanySettings(companyId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Verify user belongs to company? Assuming implicit check for now or handled by middleware/context

    return await prisma.company.findUnique({
        where: { id: companyId },
        include: {
            contacts: true,
        },
    });
}

export async function updateCompanySettings(
    companyId: string,
    data: {
        name: string;
        address?: string;
        workingHours?: string;
        contacts?: { type: string; value: string; label?: string }[];
    }
) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Update basic info
    await prisma.company.update({
        where: { id: companyId },
        data: {
            name: data.name,
            address: data.address,
            workingHours: data.workingHours,
        },
    });

    // Handle contacts - simplistic replace strategy for now
    if (data.contacts) {
        // Delete existing
        await prisma.companyContact.deleteMany({
            where: { companyId },
        });

        // Create new
        if (data.contacts.length > 0) {
            await prisma.companyContact.createMany({
                data: data.contacts.map((c) => ({
                    companyId,
                    type: c.type,
                    value: c.value,
                    label: c.label,
                })),
            });
        }
    }

    revalidatePath('/settings/company');
    return { success: true };
}
