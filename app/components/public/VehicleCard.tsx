'use client';

import Link from 'next/link';
import Image from 'next/image';

interface VehicleCardProps {
    vehicle: any;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
    const isSold = vehicle.status === 'SOLD';

    // Price Logic
    const hasDiscount = vehicle.salePrice > 0 && vehicle.salePrice < vehicle.regularPrice;
    const displayPrice = hasDiscount ? vehicle.salePrice : (vehicle.regularPrice > 0 ? vehicle.regularPrice : vehicle.salePrice);
    const priceText = displayPrice > 0 ? `$${displayPrice.toLocaleString()}` : 'Call for Price';

    const miles = vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'N/A';

    // Use the first image or a placeholder
    const imageSrc = vehicle.images && vehicle.images.length > 0
        ? `/api/images/${vehicle.images[0].driveId}?thumbnail=true`
        : 'https://via.placeholder.com/400x300?text=No+Image';

    return (
        <Link href={`/public/inventory/${vehicle.vin}`} className="group block bg-[#1a1a1a] rounded-lg overflow-hidden relative hover:shadow-2xl hover:shadow-red-900/20 hover:-translate-y-1 transition-all duration-300">
            <div className="relative aspect-[4/3] overflow-hidden">
                {vehicle.status === 'ON_HOLD' && vehicle.deposits && vehicle.deposits.length > 0 && (
                    <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center pointer-events-none">
                        <div className="bg-yellow-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-center shadow-xl border border-yellow-400/30">
                            <span className="block font-bold text-lg uppercase tracking-wider">On Hold</span>
                            <span className="block text-xs font-medium">Until {new Date(vehicle.deposits[0].expiryDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
                {isSold && (
                    <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center pointer-events-none">
                        <span className="text-red-600 border-4 border-red-600 px-6 py-2 font-bold text-3xl uppercase transform -rotate-12">SOLD</span>
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded shadow-lg uppercase tracking-wider z-20">
                    {miles}
                </div>
                <Image
                    src={imageSrc}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isSold ? 'grayscale' : ''}`}
                    unoptimized
                />
            </div>

            <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-gray-400 text-sm mb-4 uppercase tracking-wide">{vehicle.trim}</p>

                <div className="flex justify-between items-end border-t border-gray-800 pt-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-bold">Price</span>
                        {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through decoration-red-500 decoration-2">
                                ${vehicle.regularPrice.toLocaleString()}
                            </span>
                        )}
                        <span className="text-2xl font-bold text-yellow-500">{priceText}</span>
                    </div>
                    <span className="text-sm text-white bg-gray-800 px-3 py-1 rounded hover:bg-red-600 transition-colors">View Details</span>
                </div>
            </div>
        </Link>
    );
}
