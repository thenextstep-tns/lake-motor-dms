import { getVehicleByVin } from '@/app/actions/vehicle';
import VehicleGallery from './VehicleGallery';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function VehicleDetailPage({ params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const vehicle = await getVehicleByVin(vin);

    if (!vehicle) {
        notFound();
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/inventory" className="text-blue-600 hover:underline">
                    &larr; Back to Inventory
                </Link>
                <span className="px-3 py-1 bg-gray-200 rounded-full text-sm font-bold">
                    {vehicle.status}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h1 className="text-3xl font-bold mb-4">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </h1>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="block text-gray-500">VIN</label>
                            <div className="font-mono">{vehicle.vin}</div>
                        </div>
                        <div>
                            <label className="block text-gray-500">Trim</label>
                            <div>{vehicle.trim || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="block text-gray-500">Color</label>
                            <div>{vehicle.color || 'N/A'}</div>
                        </div>
                        <div>
                            <label className="block text-gray-500">Odometer</label>
                            <div>{vehicle.odometer.toLocaleString()} mi</div>
                        </div>
                        <div className="col-span-2 border-t pt-4 mt-2">
                            <h3 className="font-bold mb-2">Financials</h3>
                        </div>
                        <div>
                            <label className="block text-gray-500">Purchase Price</label>
                            <div>${Number(vehicle.purchasePrice).toLocaleString()}</div>
                        </div>
                        <div>
                            <label className="block text-gray-500">Sale Price</label>
                            <div>${Number(vehicle.salePrice).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Gallery */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Media Gallery</h2>
                    <VehicleGallery vin={vehicle.vin} images={vehicle.images} />
                </div>
            </div>
        </div>
    );
}
