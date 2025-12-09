import { getVehicleByVin } from '@/app/actions/vehicle';
import VehicleDetailClient from './VehicleDetailClient';
import { notFound } from 'next/navigation';

export default async function VehicleDetailPage({ params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const vehicle = await getVehicleByVin(vin);

    if (!vehicle) {
        notFound();
    }

    return <VehicleDetailClient vehicle={vehicle} />;
}
