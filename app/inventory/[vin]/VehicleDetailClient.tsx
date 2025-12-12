'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DepositModal from '@/app/components/inventory/DepositModal';

export default function VehicleDetailClient({ vehicle }: { vehicle: any }) {
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    return (
        <div className="bg-black min-h-screen text-white p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Link href="/inventory" className="text-gray-400 hover:text-white mb-4 inline-block">
                            ← Back to Inventory
                        </Link>
                        <h1 className="text-4xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                        <div className="flex gap-4 mt-2">
                            <span className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300">{vehicle.stockNumber}</span>
                            <span className={`px-3 py-1 rounded text-sm font-bold ${vehicle.status === 'ON_HOLD' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                                }`}>
                                {vehicle.status}
                            </span>

                            {/* Date Stats */}
                            <div className="flex flex-col text-xs text-right ml-auto text-gray-400">
                                <span>Added: {new Date(vehicle.createdAt).toLocaleDateString()}</span>
                                {vehicle.datePosted && (
                                    <span>
                                        Posted: {new Date(vehicle.datePosted).toLocaleDateString()}
                                        ({Math.floor((new Date().getTime() - new Date(vehicle.datePosted).getTime()) / (1000 * 60 * 60 * 24))} days)
                                    </span>
                                )}
                                {vehicle.dateSold && vehicle.datePosted && (
                                    <span className="text-green-400 font-bold">
                                        Sold in: {Math.floor((new Date(vehicle.dateSold).getTime() - new Date(vehicle.datePosted).getTime()) / (1000 * 60 * 60 * 24))} days
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Marketing Labels */}
                        {vehicle.marketingLabels && vehicle.marketingLabels.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {vehicle.marketingLabels.map((label: any) => (
                                    <span
                                        key={label.id}
                                        className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-black shadow-sm"
                                        style={{ backgroundColor: label.colorCode }}
                                    >
                                        {label.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsDepositModalOpen(true)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                            Add Deposit
                        </button>
                        <Link
                            href={`/inventory/${vehicle.vin}/edit`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                            Edit Vehicle
                        </Link>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                            {(() => {
                                const visibleImages = vehicle.images?.filter((img: any) => img.isPublic) || [];
                                return visibleImages.length > 0 ? (
                                    <Image
                                        src={`/api/images/${visibleImages[0].driveId}`}
                                        alt="Main vehicle image"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No images available
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {(() => {
                                const visibleImages = vehicle.images?.filter((img: any) => img.isPublic) || [];
                                return visibleImages.slice(1, 5).map((img: any) => (
                                    <div key={img.id} className="aspect-video bg-gray-900 rounded overflow-hidden relative">
                                        <Image
                                            src={`/api/images/${img.driveId}?thumbnail=true`}
                                            alt="Vehicle thumbnail"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>


                    {/* Details */}
                    <div className="space-y-6">
                        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                            <h2 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">Vehicle Details</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block">VIN</span>
                                    <span className="font-mono">{vehicle.vin}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Mileage</span>
                                    <span>{vehicle.odometer?.toLocaleString()} mi</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Price</span>
                                    <span className="text-xl font-bold text-green-500">
                                        ${vehicle.salePrice?.toLocaleString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Color</span>
                                    <span>{vehicle.color}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Engine</span>
                                    <span>{vehicle.engine}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Transmission</span>
                                    <span>{vehicle.transmission}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {vehicle.vehicleCaption && (
                            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                                <h2 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">Description</h2>
                                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                                    {vehicle.vehicleCaption}
                                </p>
                            </div>
                        )}

                        {/* Media */}
                        {(vehicle.walkaroundVideo || vehicle.testDriveVideo || vehicle.googleDriveUrl) && (
                            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                                <h2 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">Media</h2>
                                <div className="space-y-4">
                                    {vehicle.walkaroundVideo && (
                                        <div>
                                            <h3 className="text-gray-400 text-sm mb-2">Walkaround Video</h3>
                                            <div className="aspect-video bg-black rounded overflow-hidden">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={`https://www.youtube.com/embed/${vehicle.walkaroundVideo.split('v=')[1]?.split('&')[0]}`}
                                                    title="Walkaround Video"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </div>
                                    )}
                                    {vehicle.testDriveVideo && (
                                        <div>
                                            <h3 className="text-gray-400 text-sm mb-2">Test Drive Video</h3>
                                            <div className="aspect-video bg-black rounded overflow-hidden">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={`https://www.youtube.com/embed/${vehicle.testDriveVideo.split('v=')[1]?.split('&')[0]}`}
                                                    title="Test Drive Video"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </div>
                                    )}
                                    {vehicle.googleDriveUrl && (
                                        <a
                                            href={vehicle.googleDriveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                                        >
                                            View High-Res Photos on Google Drive
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {vehicle.deposits && vehicle.deposits.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2 text-yellow-500">Active Deposit</h2>
                                {vehicle.deposits.map((deposit: any) => (
                                    <div key={deposit.id} className="bg-yellow-900/20 border border-yellow-700/50 rounded p-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-400">Client</span>
                                            <span className="font-bold">{deposit.buyerName}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-400">Amount</span>
                                            <span className="font-bold">${deposit.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-400">Expires</span>
                                            <span className="font-bold text-red-400">
                                                {new Date(deposit.expiryDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {deposit.notes && (
                                            <div className="mt-2 text-sm text-gray-400 border-t border-yellow-700/30 pt-2">
                                                {deposit.notes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DepositModal
                    vehicle={vehicle}
                    isOpen={isDepositModalOpen}
                    onClose={() => setIsDepositModalOpen(false)}
                />
            </div>
        </div>
    );
}
