import { getVehicles } from '@/app/actions/vehicle';
import Navbar from '@/app/components/public/Navbar';
import Footer from '@/app/components/public/Footer';
import InventoryContainer from '@/app/components/public/InventoryContainer';

export const dynamic = 'force-dynamic';

export default async function PublicInventoryPage() {
    const allVehicles = await getVehicles();
    // Filter for POSTED vehicles
    const vehicles = allVehicles.filter((v: any) => v.status === 'POSTED');

    return (
        <div className="bg-black min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="mb-8 border-b border-gray-800 pb-4">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Current Inventory</h1>
                    <p className="text-gray-400 mt-2">Browse our selection of premium pre-owned vehicles.</p>
                </div>
                <InventoryContainer initialVehicles={vehicles} />
            </main>
            <Footer />
        </div>
    );
}
