import { auth } from '@/lib/auth';
import { getVehicleByVin, getVehicleAttributes, getMarketingLabels } from '@/app/actions/vehicle';
import { getAccessibleLots } from '@/app/actions/settings';
import AddVehicleForm from '@/app/inventory/add/AddVehicleForm';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function EditVehiclePage({ params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const session = await auth();
    const userId = session?.user?.id || '';
    const userName = session?.user?.name || 'Unknown User';

    const [vehicle, lots, attributes, marketingLabels] = await Promise.all([
        getVehicleByVin(vin),
        getAccessibleLots(),
        getVehicleAttributes(),
        getMarketingLabels()
    ]);

    if (!vehicle) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Update vehicle details, pricing, and status.
                    </p>
                </div>

                <Suspense fallback={<div>Loading form...</div>}>
                    <AddVehicleForm
                        userId={userId}
                        userName={userName}
                        initialData={vehicle}
                        availableLots={lots}
                        attributes={attributes}
                        marketingLabels={marketingLabels}
                    />
                </Suspense>
            </div>
        </div>
    );
}
