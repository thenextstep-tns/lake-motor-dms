import { getCurrentUser } from '@/lib/session';
import { getMarketingLabels } from '@/app/actions/vehicle';
import MarketingLabelClient from './MarketingLabelClient';

export default async function MarketingSettingsPage() {
    const user = await getCurrentUser();
    // This will lazy-seed if needed
    const labels = await getMarketingLabels(user.companyId);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Marketing & Labels</h1>
                <p className="mt-2 text-gray-600">
                    Manage the labels and tags used to highlight vehicle features.
                    These labels appear on vehicle listings and can be used to generate descriptions.
                </p>
            </div>

            <MarketingLabelClient
                initialLabels={labels}
                companyId={user.companyId}
            />
        </div>
    );
}
