'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SystemLogger } from '@/lib/logger';


export async function saveTablePreferences(preferences: Record<string, string[]>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        const currentPrefs = user?.tablePreferences ? JSON.parse(user.tablePreferences) : {};

        const newPrefs = { ...currentPrefs, ...preferences };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { tablePreferences: JSON.stringify(newPrefs) }
        });
        await SystemLogger.log('USER_PREFERENCES_UPDATED', { keys: Object.keys(preferences) }, { id: session.user.id, name: session.user.name, companyId: session.user.companyId });
        return { success: true };

    } catch (error) {
        console.error("Failed to save preferences", error);
        return { success: false, error: String(error) };
    }
}
