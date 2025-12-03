'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function InventoryTable({ vehicles, userId }: { vehicles: any[], userId: string }) {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

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

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-4">
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
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">Cost</th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50 text-center">T</th>
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
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                        {vehicle.status}
                                    </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="h-10 w-16 bg-gray-200 rounded overflow-hidden relative">
                                        {vehicle.images && vehicle.images.length > 0 ? (
                                            <img
                                                src={vehicle.images[0].driveId ? `/api/images/${vehicle.images[0].driveId}?thumbnail=true` : vehicle.images[0].publicUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Img</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                                    <div className="text-xs text-gray-500">{vehicle.trim}</div>
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
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    ${vehicle.vehicleCost?.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-500">
                                    {vehicle.isNew ? 'N' : 'U'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-500">
                                    -
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                                    <Link href={`/inventory/${vehicle.vin}/edit`} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded inline-block">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Status Tabs */}
            <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
                {['ALL', 'PURCHASED', 'DELIVERED', 'INSPECTED', 'IN_REPAIR', 'REPAIRED', 'DETAILED', 'PICTURED', 'POSTED', 'SOLD'].map(status => (
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
        </div>
    );
}
