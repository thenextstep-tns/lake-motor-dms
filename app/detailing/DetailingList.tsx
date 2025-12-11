'use client';

import { useState } from 'react';
import { clockIn, clockOut, completeTicket } from '@/app/actions/service'; // Verify we have these
import { useRouter } from 'next/navigation';

export default function DetailingList({ initialTickets, userId }: { initialTickets: any[], userId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleClockIn = async (ticketId: string) => {
        setLoading(ticketId);
        try {
            await clockIn(ticketId, ['Detailing']);
            router.refresh();
        } catch (e) {
            alert('Error clocking in: ' + e);
        } finally {
            setLoading(null);
        }
    };

    const handleComplete = async (ticketId: string) => {
        if (!confirm('Are you sure you want to mark this detailing job as COMPLETE? Vehicle will be marked as "Detailed".')) return;
        setLoading(ticketId);
        try {
            // Clock out first if needed? Standard service flow usually requires clock out.
            // Simplified Detailing Ticket might just want "Done".
            // Implementation Plan didn't specify strict clock-out for detailing but "Clock In/Out, Complete".
            // Let's assume we call completeTicket which handles status. The backend logic I wrote for completeTicket handles the status transition.

            await completeTicket(ticketId);
            router.refresh();
        } catch (e) {
            alert('Error completing ticket: ' + e);
        } finally {
            setLoading(null);
        }
    };

    const handleClockOut = async (ticketId: string) => {
        setLoading(ticketId);
        try {
            await clockOut(ticketId, {}, [], "Work Paused (Detailing)");
            router.refresh();
        } catch (e) {
            alert('Error clocking out: ' + e);
        } finally {
            setLoading(null);
        }
    };

    if (initialTickets.length === 0) {
        return <div className="text-gray-500 italic">No vehicles currently in Detailing queue.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialTickets.map(ticket => (
                <div key={ticket.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'In_Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                            <span className="text-gray-400 text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                            {ticket.vehicle.year} {ticket.vehicle.make} {ticket.vehicle.model}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">VIN: {ticket.vehicle.vin}</p>
                        <p className="text-gray-700 text-sm mb-4 h-12 overflow-hidden">{ticket.description}</p>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {ticket.status !== 'In_Progress' && (
                            <button
                                onClick={() => handleClockIn(ticket.id)}
                                disabled={loading === ticket.id}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium disabled:opacity-50"
                            >
                                Start Job
                            </button>
                        )}

                        {ticket.status === 'In_Progress' && (
                            <>
                                <button
                                    onClick={() => handleClockOut(ticket.id)}
                                    disabled={loading === ticket.id}
                                    className="px-4 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded font-medium disabled:opacity-50"
                                >
                                    Pause
                                </button>
                                <button
                                    onClick={() => handleComplete(ticket.id)}
                                    disabled={loading === ticket.id}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50"
                                >
                                    Complete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
