import { prisma } from '@/lib/prisma';
import { clockIn, clockOut } from '@/app/actions/service';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Mock current user ID for MVP - in real app would come from session
const MOCK_USER_ID = 'mock-tech-id';

export default async function ServiceTicketPage({ params }: { params: { id: string } }) {
    const ticket = await prisma.serviceTicket.findUnique({
        where: { id: params.id },
        include: {
            vehicle: true,
            parts: true,
            timeLogs: {
                orderBy: { startTime: 'desc' },
                take: 5,
            },
        },
    });

    if (!ticket) notFound();

    const isClockedIn = ticket.timeLogs.length > 0 && !ticket.timeLogs[0].endTime;

    async function handleClockIn() {
        'use server';
        await clockIn(params.id, MOCK_USER_ID);
    }

    async function handleClockOut() {
        'use server';
        await clockOut(MOCK_USER_ID);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Ticket #{ticket.id.slice(-4)}</h1>
                <div className="space-x-4">
                    <form action={isClockedIn ? handleClockOut : handleClockIn} className="inline-block">
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded font-bold text-white ${isClockedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            {isClockedIn ? 'Clock Out' : 'Clock In'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Vehicle Information</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">VIN</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{ticket.vehicleVin}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{ticket.description}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Time Logs</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {ticket.timeLogs.map((log: any) => (
                        <li key={log.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                    {log.type}
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {log.endTime ? 'Completed' : 'Active'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                        Started: {log.startTime.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
