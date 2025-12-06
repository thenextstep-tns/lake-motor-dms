import { getVehicles } from '@/app/actions/vehicle';
import { getAccessibleLots } from '@/app/actions/settings';
import InventoryTable from './InventoryTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ lotId?: string }> }) {
    const { lotId } = await searchParams;
    const [vehicles, lots] = await Promise.all([
        getVehicles(lotId),
        getAccessibleLots()
    ]);

    // Mock user ID for now
    const userId = "user_123";

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center p-4 bg-white border-b">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                <Link
                    href="/inventory/add"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    + Add Vehicle
                </Link>
            </div>
            <div className="flex-1 overflow-hidden">
                <InventoryTable
                    vehicles={vehicles}
                    userId={userId}
                    lots={lots}
                    currentLotId={lotId || 'ALL'}
                />
            </div>
        </div>
    );
}
