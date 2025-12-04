import { getServiceTickets } from '@/app/actions/service';
import ServiceDashboardClient from './ServiceDashboardClient';

export const dynamic = 'force-dynamic';

export default async function ServicePage() {
    const tickets = await getServiceTickets();

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            <header className="bg-white shadow-sm z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Service Dashboard</h1>
                </div>
            </header>

            <main className="flex-1 overflow-hidden">
                <ServiceDashboardClient initialTickets={tickets} />
            </main>
        </div>
    );
}
