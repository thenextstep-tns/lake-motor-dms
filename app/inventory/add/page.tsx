import { getVehicleAttributes, getMarketingLabels } from '@/app/actions/vehicle';
import { getAccessibleLots } from '@/app/actions/settings';
import AddVehicleForm from './AddVehicleForm';
import { Suspense } from 'react';

// Mock User ID for now
const MOCK_USER_ID = 'mock-admin-id';

export default async function AddVehiclePage() {
    const [attributes, lots, marketingLabels] = await Promise.all([
        getVehicleAttributes(),
        getAccessibleLots(),
        getMarketingLabels()
    ]);

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter all available details for the vehicle. You can edit these later.
                    </p>
                </div>

                <Suspense fallback={<div>Loading form...</div>}>
                    <AddVehicleForm
                        userId={MOCK_USER_ID}
                        attributes={attributes}
                        availableLots={lots}
                        marketingLabels={marketingLabels}
                    />
                </Suspense>
            </div>
        </div>
    );
}
