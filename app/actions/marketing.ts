'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/session';
import { SystemLogger } from '@/lib/logger';


export async function generateSeoDescription(vin: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  // Enqueue Job
  // Dynamic import to avoid cycle if Queue imports actions
  const { Queue } = await import('@/lib/queue');

  await Queue.enqueue('SEO_GENERATE', { vin, companyId: user.companyId });

  return "SEO Description generation started in background...";
}

/**
 * Get all marketing labels
 */
export async function getMarketingLabels() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) return []; // Return empty if no context

  return prisma.marketingLabel.findMany({
    where: {
      OR: [
        { companyId: user.companyId },
        { companyId: null }
      ]
    },
    orderBy: { name: 'asc' }
  });
}

export async function createMarketingLabel(data: { name: string, colorCode: string }) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  const label = await prisma.marketingLabel.create({
    data: {
      name: data.name,
      colorCode: data.colorCode,
      companyId: user.companyId
    }
  });
  await SystemLogger.log('MARKETING_LABEL_CREATED', { id: label.id, name: label.name }, { id: user.id, name: user.name, companyId: user.companyId });
  revalidatePath('/inventory/add');

  revalidatePath('/inventory/[vin]/edit');
  revalidatePath('/settings/marketing');
  return { success: true, label };
}

export async function updateMarketingLabel(id: string, data: { name: string, colorCode: string }) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  const existing = await prisma.marketingLabel.findFirst({
    where: { id, OR: [{ companyId: user.companyId }, { companyId: null }] }
  });
  if (!existing) throw new Error("Label not found");
  if (!existing.companyId) throw new Error("Cannot edit system default labels.");

  const label = await prisma.marketingLabel.update({
    where: { id },
    data: { name: data.name, colorCode: data.colorCode }
  });
  await SystemLogger.log('MARKETING_LABEL_UPDATED', { id: label.id, updates: data }, { id: user.id, name: user.name, companyId: user.companyId });
  revalidatePath('/inventory/add');

  revalidatePath('/inventory/[vin]/edit');
  revalidatePath('/settings/marketing');
  return { success: true, label };
}

export async function deleteMarketingLabel(id: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  const existing = await prisma.marketingLabel.findFirst({
    where: { id, companyId: user.companyId }
  });
  if (!existing) throw new Error("Label not found or cannot delete system default");

  await prisma.marketingLabel.delete({ where: { id } });
  await SystemLogger.log('MARKETING_LABEL_DELETED', { id }, { id: user.id, name: user.name, companyId: user.companyId });
  revalidatePath('/inventory/add');

  revalidatePath('/inventory/[vin]/edit');
  revalidatePath('/settings/marketing');
  return { success: true };
}
