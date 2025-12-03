'use client';

import VehicleCard from './VehicleCard';

interface InventoryGridProps {
    vehicles: any[];
}

export default function InventoryGrid({ vehicles }: InventoryGridProps) {
    if (!vehicles || vehicles.length === 0) {
        return (
            <div className="text-center py-20">
                <h3 className="text-2xl text-white font-bold">No vehicles found.</h3>
                <p className="text-gray-400 mt-2">Check back soon for new inventory.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.vin} vehicle={vehicle} />
            ))}
        </div>
    );
}
