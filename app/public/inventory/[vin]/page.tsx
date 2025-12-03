import { getVehicleByVin } from '@/app/actions/vehicle';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PublicVehiclePage({ params }: { params: { vin: string } }) {
    const vehicle = await getVehicleByVin(params.vin);

    if (!vehicle || vehicle.status !== 'POSTED') {
        notFound();
    }

    const publicImages = vehicle.images
        .filter((img: any) => img.isPublic)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
                    {/* Image Gallery */}
                    <div className="flex flex-col">
                        <div className="w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={publicImages[0] ? `/api/images/${publicImages[0].driveId}` : 'https://via.placeholder.com/600x400'}
                                alt="Main Vehicle"
                                className="w-full h-full object-center object-cover"
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-4">
                            {publicImages.slice(1).map((img: any) => (
                                <div key={img.id} className="relative rounded-lg overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`/api/images/${img.driveId}`}
                                        alt="Vehicle View"
                                        className="w-full h-24 object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </h1>

                        <div className="mt-3">
                            <h2 className="sr-only">Product information</h2>
                            <p className="text-3xl text-gray-900">${Number(vehicle.salePrice).toLocaleString()}</p>
                        </div>

                        <div className="mt-6">
                            <h3 className="sr-only">Description</h3>
                            <div className="text-base text-gray-700 space-y-6">
                                <p>
                                    Beautiful {vehicle.color} {vehicle.make} {vehicle.model} {vehicle.trim}.
                                    Low mileage: {vehicle.odometer.toLocaleString()} miles.
                                    Fully inspected and ready to drive!
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-200 pt-8">
                            <h3 className="text-sm font-medium text-gray-900">Specifications</h3>
                            <div className="mt-4 prose prose-sm text-gray-500">
                                <ul role="list">
                                    <li>VIN: {vehicle.vin}</li>
                                    <li>Trim: {vehicle.trim}</li>
                                    <li>Color: {vehicle.color}</li>
                                    <li>Odometer: {vehicle.odometer.toLocaleString()}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-10 flex">
                            <button
                                type="button"
                                className="max-w-xs flex-1 bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-blue-500 sm:w-full"
                            >
                                Contact Us
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
