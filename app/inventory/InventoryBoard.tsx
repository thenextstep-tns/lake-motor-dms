'use client';

import { Vehicle } from '@prisma/client';
import Link from 'next/link';

interface InventoryBoardProps {
    vehicles: Vehicle[];
}

const STATUS_COLUMNS = [
    'PURCHASED',
    'DELIVERED',
    'INSPECTED',
    'IN_REPAIR',
    'REPAIRED',
    'DETAILED',
    'PICTURED',
    'POSTED',
    'SOLD',
];

export default function InventoryBoard({ vehicles }: InventoryBoardProps) {
    const getVehiclesByStatus = (status: string) => {
        return vehicles.filter((v) => v.status === status);
    };

    return (
        <div className="flex overflow-x-auto gap-4 pb-4 h-[calc(100vh-200px)]">
            {STATUS_COLUMNS.map((status) => (
                <div key={status} className="min-w-[300px] bg-gray-100 p-4 rounded-lg flex flex-col">
                    <h2 className="font-bold mb-4 text-gray-700 border-b pb-2">{status}</h2>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {getVehiclesByStatus(status).map((vehicle) => (
                            <Link key={vehicle.vin} href={`/inventory/${vehicle.vin}`}>
                                <div className="bg-white p-3 rounded shadow hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="font-bold text-lg">
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                    </div>
                                    <div className="text-sm text-gray-500">VIN: {vehicle.vin}</div>
                                    <div className="text-sm text-gray-500">
                                        Price: ${Number(vehicle.salePrice).toLocaleString()}
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {getVehiclesByStatus(status).length === 0 && (
                            <div className="text-gray-400 text-center text-sm italic py-4">
                                No vehicles
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
