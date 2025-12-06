'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DepositModal from '@/app/components/inventory/DepositModal';

type Props = {
    vehicles: any[];
    userId: string;
    lots: { id: string; name: string }[];
    currentLotId: string;
};

export default function InventoryTable({ vehicles, userId, lots, currentLotId }: Props) {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    const handleLotChange = (newLotId: string) => {
        const params = new URLSearchParams(window.location.search);
        if (newLotId === 'ALL') {
            params.delete('lotId');
        } else {
            params.set('lotId', newLotId);
        }
        router.push(`/inventory?${params.toString()}`);
    };

    // Filter logic
    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter;
        const matchesSearch =
            vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vehicle.stockNumber && vehicle.stockNumber.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Counts logic
    const getCount = (status: string) => {
        if (status === 'ALL') return vehicles.length;
        return vehicles.filter(v => v.status === status).length;
    };

    const handleDepositClick = (vehicle: any) => {
        setSelectedVehicle(vehicle);
        setIsDepositModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                {/* Lot Dropdown */}
                <div className="relative">
                    <select
                        value={currentLotId}
                        onChange={(e) => handleLotChange(e.target.value)}
                        className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="ALL">All Lots</option>
                        {lots.map(lot => (
                            <option key={lot.id} value={lot.id}>{lot.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search by VIN, Make, Model, Stock #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    {filteredVehicles.length} vehicles
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto min-h-0">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Status</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50 w-20">Image</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Vehicle</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">VIN / Stock</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Color</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Miles</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Price</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50 text-center">Inspection</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVehicles.map((vehicle, index) => (
                            <tr key={vehicle.vin} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${vehicle.status === 'PURCHASED' ? 'bg-purple-100 text-purple-800' :
                                            vehicle.status === 'READY' ? 'bg-green-100 text-green-800' :
                                                vehicle.status === 'SOLD' ? 'bg-gray-100 text-gray-800' :
                                                    vehicle.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                        {vehicle.status}
                                    </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="h-10 w-16 bg-gray-200 rounded overflow-hidden relative">
                                        {vehicle.images && vehicle.images.length > 0 ? (
                                            <Image
                                                src={vehicle.images[0].driveId ? `/api/images/${vehicle.images[0].driveId}?thumbnail=true` : vehicle.images[0].publicUrl}
                                                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                                className="object-cover"
                                                fill
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Img</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <Link href={`/inventory/${vehicle.vin}/edit`} className="block hover:underline">
                                        <div className="text-sm font-medium text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                                        <div className="text-xs text-gray-500">{vehicle.trim}</div>
                                    </Link>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-mono">{vehicle.vin.substring(vehicle.vin.length - 8)}</div>
                                    <div className="text-xs text-gray-500">{vehicle.stockNumber || '-'}</div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {vehicle.color || '-'} / {vehicle.interiorColor || '-'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {vehicle.odometer?.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                                    ${vehicle.salePrice?.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-500">
                                    {vehicle.inspections && vehicle.inspections.length > 0 ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-green-600 font-medium text-xs">
                                                {new Date(vehicle.inspections[0].date).toLocaleDateString()}
                                            </span>
                                            {vehicle.inspections[0].codes && vehicle.inspections[0].codes.length > 0 && (
                                                <span className="text-xs text-red-500 bg-red-50 px-1 rounded border border-red-100">
                                                    {vehicle.inspections[0].codes.length} Codes
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleDepositClick(vehicle)}
                                            className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-100 rounded"
                                            title="Add Deposit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        <Link
                                            href={`/inventory/${vehicle.vin}/edit?tab=service`}
                                            className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-100 rounded"
                                            title="Add Inspection"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </Link>
                                        <Link href={`/inventory/${vehicle.vin}/edit`} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Status Tabs */}
            <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
                {['ALL', 'PURCHASED', 'DELIVERED', 'Inspected', 'In Repair', 'Repaired', 'DETAILED', 'PICTURED', 'POSTED', 'ON_HOLD', 'SOLD'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors
                            ${statusFilter === status
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300'}`}
                    >
                        {status} <span className="ml-1 opacity-75">({getCount(status)})</span>
                    </button>
                ))}
            </div>

            {selectedVehicle && (
                <DepositModal
                    vehicle={selectedVehicle}
                    isOpen={isDepositModalOpen}
                    onClose={() => setIsDepositModalOpen(false)}
                />
            )}
        </div>
    );
}
