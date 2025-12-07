'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/session';

export async function generateSeoDescription(vin: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { vin },
    include: { serviceTickets: true }, // Include tickets to get inspection notes
  });

  if (!vehicle) throw new Error('Vehicle not found');

  // Mock AI Call
  // In reality:
  // const prompt = `Write an SEO description for a ${vehicle.year} ${vehicle.make} ${vehicle.model}...`;
  // const description = await openai.chat.completions.create(...)

  const description = `Check out this amazing ${vehicle.year} ${vehicle.make} ${vehicle.model}! 
  Finished in a stunning ${vehicle.color}, this vehicle has only ${vehicle.odometer} miles. 
  Fully inspected and serviced, it's ready for the road. 
  Visit Lake Motor Group today to test drive this ${vehicle.trim} edition.`;

  // We could store this in a new field 'seoDescription' on the Vehicle model
  // For now, we'll just return it to the UI to be copied or used
  return description;
}

/**
 * Get all marketing labels
 */
export async function getMarketingLabels() {
  const user = await getCurrentUser();
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
  const label = await prisma.marketingLabel.create({
    data: {
      name: data.name,
      colorCode: data.colorCode,
      companyId: user.companyId
    }
  });
  revalidatePath('/inventory/add');
  revalidatePath('/inventory/[vin]/edit');
  revalidatePath('/settings/marketing');
  return { success: true, label };
}

export async function updateMarketingLabel(id: string, data: { name: string, colorCode: string }) {
  const user = await getCurrentUser();
  const existing = await prisma.marketingLabel.findFirst({
    where: { id, OR: [{ companyId: user.companyId }, { companyId: null }] }
  });
  if (!existing) throw new Error("Label not found");
  if (!existing.companyId) throw new Error("Cannot edit system default labels.");

  const label = await prisma.marketingLabel.update({
    where: { id },
    data: { name: data.name, colorCode: data.colorCode }
  });
  revalidatePath('/inventory/add');
  revalidatePath('/inventory/[vin]/edit');
  revalidatePath('/settings/marketing');
  return { success: true, label };
}

export async function deleteMarketingLabel(id: string) {
  const user = await getCurrentUser();
  const existing = await prisma.marketingLabel.findFirst({
    where: { id, companyId: user.companyId }
  });
  if (!existing) throw new Error("Label not found or cannot delete system default");

  await prisma.marketingLabel.delete({ where: { id } });
  revalidatePath('/inventory/add');
  revalidatePath('/inventory/[vin]/edit');
  revalidatePath('/settings/marketing');
  return { success: true };
}
