import { getVehicles } from '@/app/actions/vehicle';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PublicInventoryPage() {
    const vehicles = await getVehicles();
    const postedVehicles = vehicles.filter((v: any) => v.status === 'POSTED');

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Current Inventory</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {postedVehicles.map((vehicle: any) => {
                        const mainImage = vehicle.images.find((img: any) => img.isPublic)?.publicUrl || 'https://via.placeholder.com/400x300';

                        return (
                            <Link key={vehicle.vin} href={`/public/inventory/${vehicle.vin}`} className="block group">
                                <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform transform group-hover:-translate-y-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={mainImage}
                                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-6">
                                        <h2 className="text-xl font-bold mb-2 text-gray-900">
                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                        </h2>
                                        <p className="text-gray-600 mb-4">{vehicle.trim}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold text-blue-600">
                                                ${Number(vehicle.salePrice).toLocaleString()}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {vehicle.odometer.toLocaleString()} mi
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
