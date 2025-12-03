import { getVehicleByVin } from '@/app/actions/vehicle';
import Navbar from '@/app/components/public/Navbar';
import Footer from '@/app/components/public/Footer';
import VehicleDetail from '@/app/components/public/VehicleDetail';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function VehicleDetailPage({ params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const vehicle = await getVehicleByVin(vin);

    if (!vehicle) {
        notFound();
    }

    // Filter for public images only
    if (vehicle.images) {
        vehicle.images = vehicle.images
            .filter((img: any) => img.isPublic)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }

    return (
        <div className="bg-black min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-20">
                <VehicleDetail vehicle={vehicle} />
            </main>
            <Footer />
        </div>
    );
}
