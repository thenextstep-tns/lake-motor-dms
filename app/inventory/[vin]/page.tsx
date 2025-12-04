import { redirect } from 'next/navigation';

export default async function VehicleDetailPage({ params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    redirect(`/inventory/${vin}/edit`);
}
