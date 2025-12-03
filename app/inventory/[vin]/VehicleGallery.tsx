'use client';

import { VehicleImage } from '@prisma/client';
import { uploadVehicleImage, toggleImagePublic } from '@/app/actions/vehicle';
import { useState, useTransition } from 'react';

interface VehicleGalleryProps {
    vin: string;
    images: VehicleImage[];
}

export default function VehicleGallery({ vin, images }: VehicleGalleryProps) {
    // Filter only public images for the public gallery
    const visibleImages = images.filter(img => img.isPublic);

    if (visibleImages.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No images available for this vehicle.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Gallery Grid */}
            <div className="grid grid-cols-2 gap-4">
                {visibleImages.map((img) => (
                    <div key={img.id} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/images/${img.driveId}?thumbnail=true`}
                            alt="Vehicle"
                            className="w-full h-32 object-cover rounded"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
