import { getVehicleByVin } from '@/app/actions/vehicle';
import AddVehicleForm from '@/app/inventory/add/AddVehicleForm';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function EditVehiclePage({ params }: { params: Promise<{ vin: string }> }) {
    const { vin } = await params;
    const vehicle = await getVehicleByVin(vin);

    if (!vehicle) {
        notFound();
    }

    // Mock User ID
    const MOCK_USER_ID = 'mock-admin-id';

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
                        userId={MOCK_USER_ID}
                        initialData={vehicle}
                    />
                </Suspense>
            </div>
        </div>
    );
}
