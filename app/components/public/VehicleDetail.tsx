'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface VehicleDetailProps {
    vehicle: any;
}

type Tab = 'photos' | 'walkaround' | 'testdrive';

export default function VehicleDetail({ vehicle }: VehicleDetailProps) {
    const [activeTab, setActiveTab] = useState<Tab>('photos');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const images = vehicle.images || [];
    const activeImage = images[activeImageIndex];

    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    const walkaroundEmbed = getEmbedUrl(vehicle.walkaroundVideo);
    const testDriveEmbed = getEmbedUrl(vehicle.testDriveVideo);

    // Price Logic
    const hasDiscount = vehicle.salePrice > 0 && vehicle.salePrice < vehicle.regularPrice;
    const displayPrice = hasDiscount ? vehicle.salePrice : (vehicle.regularPrice > 0 ? vehicle.regularPrice : vehicle.salePrice);
    const priceText = displayPrice > 0 ? `$${displayPrice.toLocaleString()}` : 'Call for Price';

    const handlePrevImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
        e?.stopPropagation();
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const handleNextImage = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
        e?.stopPropagation();
        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePrevImage(e);
            } else if (e.key === 'ArrowRight') {
                handleNextImage(e);
            } else if (e.key === 'Escape') {
                setIsLightboxOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, handlePrevImage, handleNextImage]);

    return (
        <div className="bg-black min-h-screen text-white pb-20">
            {/* Lightbox */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
                        {activeImage && (
                            <Image
                                src={`/api/images/${activeImage.driveId}`}
                                alt="Full screen view"
                                fill
                                className="object-contain"
                                unoptimized
                                priority
                            />
                        )}
                    </div>

                    <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-6">
                    <Link href="/public/inventory" className="text-gray-400 hover:text-white transition-colors flex items-center">
                        ← Back to Inventory
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Media Area */}
                    <div>
                        {/* Main Media Display */}
                        <div className="relative aspect-[4/3] bg-gray-900 rounded-t-lg overflow-hidden">
                            {activeTab === 'photos' && (
                                activeImage ? (
                                    <div
                                        className="w-full h-full cursor-pointer group"
                                        onClick={() => setIsLightboxOpen(true)}
                                    >
                                        <Image
                                            src={`/api/images/${activeImage.driveId}`}
                                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                            fill
                                            className="object-contain"
                                            priority
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium transition-opacity">
                                                Click to Expand
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">No Image Available</div>
                                )
                            )}

                            {activeTab === 'walkaround' && walkaroundEmbed && (
                                <iframe
                                    src={walkaroundEmbed}
                                    title="Walkaround Video"
                                    className="w-full h-full"
                                    allowFullScreen
                                ></iframe>
                            )}

                            {activeTab === 'testdrive' && testDriveEmbed && (
                                <iframe
                                    src={testDriveEmbed}
                                    title="Test Drive Video"
                                    className="w-full h-full"
                                    allowFullScreen
                                ></iframe>
                            )}
                        </div>

                        {/* Media Tabs */}
                        <div className="flex bg-white border-t border-gray-800 rounded-b-lg overflow-hidden mb-4">
                            <button
                                onClick={() => setActiveTab('photos')}
                                className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'photos'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Photos
                            </button>

                            {walkaroundEmbed && (
                                <button
                                    onClick={() => setActiveTab('walkaround')}
                                    className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'walkaround'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white text-black hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Walkaround
                                </button>
                            )}

                            {testDriveEmbed && (
                                <button
                                    onClick={() => setActiveTab('testdrive')}
                                    className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'testdrive'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white text-black hover:bg-gray-100'
                                        }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Test Drive
                                </button>
                            )}
                        </div>

                        {/* Thumbnails (Only visible when Photos tab is active) */}
                        {activeTab === 'photos' && images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {images.map((img: any, idx: number) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`relative w-full aspect-[4/3] bg-gray-900 rounded overflow-hidden border-2 transition-colors ${activeImageIndex === idx ? 'border-red-600' : 'border-transparent hover:border-gray-600'
                                            }`}
                                    >
                                        <Image
                                            src={`/api/images/${img.driveId}?thumbnail=true`}
                                            alt={`Thumbnail ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                        <div className="flex items-center gap-3 mb-6">
                            <p className="text-xl text-gray-400">{vehicle.trim}</p>
                            {vehicle.status === 'ON_HOLD' && vehicle.deposits && vehicle.deposits.length > 0 && (
                                <span className="bg-yellow-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse">
                                    ON HOLD until {new Date(vehicle.deposits[0].expiryDate).toLocaleDateString()}
                                </span>
                            )}
                            {vehicle.status === 'SOLD' && (
                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                                    SOLD
                                </span>
                            )}
                        </div>

                        <div className="bg-[#1a1a1a] p-6 rounded-lg mb-8 border border-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-400">Price</span>
                                <div className="text-right">
                                    {hasDiscount && (
                                        <span className="block text-lg text-gray-500 line-through decoration-red-500 decoration-2">
                                            ${vehicle.regularPrice.toLocaleString()}
                                        </span>
                                    )}
                                    <span className="text-3xl font-bold text-yellow-500">
                                        {priceText}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between border-b border-gray-700 py-2">
                                    <span className="text-gray-500">Mileage</span>
                                    <span>{vehicle.odometer?.toLocaleString()} mi</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 py-2">
                                    <span className="text-gray-500">Stock #</span>
                                    <span>{vehicle.stockNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 py-2">
                                    <span className="text-gray-500">VIN</span>
                                    <span className="font-mono text-xs">{vehicle.vin}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 py-2">
                                    <span className="text-gray-500">Engine</span>
                                    <span>{vehicle.engine || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 py-2">
                                    <span className="text-gray-500">Transmission</span>
                                    <span>{vehicle.transmission || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-700 py-2">
                                    <span className="text-gray-500">Ext. Color</span>
                                    <span>{vehicle.color || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <a href="tel:2192190330" className="block w-full bg-red-600 hover:bg-red-700 text-white text-center font-bold py-3 rounded uppercase tracking-wider transition-colors">
                                    Call Availability
                                </a>
                                <a href="#contact" className="block w-full bg-white hover:bg-gray-200 text-black text-center font-bold py-3 rounded uppercase tracking-wider transition-colors">
                                    Message Us
                                </a>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">Description</h3>
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                                {vehicle.seoDescription || vehicle.vehicleCaption || 'No description available.'}
                            </div>
                        </div>

                        {/* Equipment */}
                        {vehicle.vehicleEquipment && (
                            <div>
                                <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">Features & Equipment</h3>
                                <div className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                                    {vehicle.vehicleEquipment}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
