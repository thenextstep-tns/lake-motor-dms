import { getTasks, getDeposits } from '@/app/actions/sales';
import { getVehicles } from '@/app/actions/vehicle';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const [tasks, deposits, vehicles] = await Promise.all([
        getTasks(),
        getDeposits(),
        getVehicles(),
    ]);

    const inventoryStats = {
        total: vehicles.length,
        posted: vehicles.filter((v: any) => v.status === 'POSTED').length,
        sold: vehicles.filter((v: any) => v.status === 'SOLD').length,
        inRepair: vehicles.filter((v: any) => v.status === 'IN_REPAIR').length,
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Total Inventory</h3>
                    <p className="text-3xl font-bold text-gray-800">{inventoryStats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Live on Site</h3>
                    <p className="text-3xl font-bold text-green-600">{inventoryStats.posted}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Sold (MTD)</h3>
                    <p className="text-3xl font-bold text-blue-600">{inventoryStats.sold}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">In Repair</h3>
                    <p className="text-3xl font-bold text-orange-600">{inventoryStats.inRepair}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tasks */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">My Tasks</h2>
                        <button className="text-sm text-blue-600 hover:underline">+ New Task</button>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {tasks.map((task: any) => (
                            <li key={task.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={task.status === 'DONE'}
                                        readOnly
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                    />
                                    <span className={`ml-3 text-sm ${task.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                        {task.description}
                                    </span>
                                </div>
                                {task.vehicle && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {task.vehicle.year} {task.vehicle.model}
                                    </span>
                                )}
                            </li>
                        ))}
                        {tasks.length === 0 && (
                            <li className="px-6 py-4 text-sm text-gray-500 italic">No pending tasks</li>
                        )}
                    </ul>
                </div>

                {/* Recent Deposits */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800">Recent Deposits</h2>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {deposits.map((deposit: any) => (
                            <li key={deposit.id} className="px-6 py-4">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-900">{deposit.buyerName}</span>
                                    <span className="text-sm font-bold text-green-600">${Number(deposit.amount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-xs text-gray-500">
                                        {deposit.vehicle.year} {deposit.vehicle.make} {deposit.vehicle.model}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Expires: {deposit.expiryDate.toLocaleDateString()}
                                    </span>
                                </div>
                            </li>
                        ))}
                        {deposits.length === 0 && (
                            <li className="px-6 py-4 text-sm text-gray-500 italic">No active deposits</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
