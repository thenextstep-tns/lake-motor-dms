'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DepositModal from '@/app/components/inventory/DepositModal';
import DetailingRequestModal from '@/app/components/inventory/DetailingRequestModal';
import { saveTablePreferences } from '@/app/actions/user';

type Props = {
    vehicles: any[];
    userId: string;
    lots: { id: string; name: string }[];
    currentLotId: string;
    userPreferences?: any;
};

// Define all available columns
const ALL_COLUMNS = [
    // Identifiers
    { key: 'status', label: 'Status', group: 'Basic' },
    { key: 'image', label: 'Image', group: 'Basic' },
    { key: 'vehicle', label: 'Vehicle Name', group: 'Basic' },
    { key: 'vin', label: 'VIN', group: 'Basic' },
    { key: 'stockNumber', label: 'Stock #', group: 'Basic' },

    // Specs
    { key: 'odometer', label: 'Mileage', group: 'Specs' },
    { key: 'color', label: 'Color', group: 'Specs' },
    { key: 'year', label: 'Year', group: 'Specs' },
    { key: 'make', label: 'Make', group: 'Specs' },
    { key: 'model', label: 'Model', group: 'Specs' },
    { key: 'trim', label: 'Trim', group: 'Specs' },
    { key: 'bodyStyle', label: 'Body Style', group: 'Specs' },
    { key: 'fuelType', label: 'Fuel', group: 'Specs' },
    { key: 'driveTrain', label: 'Drivetrain', group: 'Specs' },
    { key: 'transmission', label: 'Transmission', group: 'Specs' },
    { key: 'engine', label: 'Engine', group: 'Specs' },
    { key: 'cylinders', label: 'Cylinders', group: 'Specs' },
    { key: 'doors', label: 'Doors', group: 'Specs' },

    // Pricing
    { key: 'price', label: 'Sale Price', group: 'Pricing' },
    { key: 'regularPrice', label: 'Regular Price', group: 'Pricing' },
    { key: 'wholesalePrice', label: 'Wholesale', group: 'Pricing' },
    { key: 'purchasePrice', label: 'Purchase Cost', group: 'Pricing' },
    { key: 'repairCost', label: 'Repair Cost', group: 'Pricing' },
    { key: 'totalCost', label: 'Total Cost', group: 'Pricing' },
    { key: 'floorplanCost', label: 'Floorplan', group: 'Pricing' },

    // Dates
    { key: 'daysInStock', label: 'Days in Stock', group: 'Dates' },
    { key: 'dateAdded', label: 'Date Added', group: 'Dates' },
    { key: 'datePosted', label: 'Date Posted', group: 'Dates' },
    { key: 'dateSold', label: 'Date Sold', group: 'Dates' },

    // Service & Status
    { key: 'inspection', label: 'Inspection', group: 'Service' },
    { key: 'lastInspection', label: 'Last Inspection', group: 'Service' },
    { key: 'serviceStatus', label: 'Service Stats', group: 'Service' },
    { key: 'serviceTicketsList', label: 'Service Tickets', group: 'Service' },
    { key: 'salesNotes', label: 'Sales Notes', group: 'Notes' },

    // Actions
    { key: 'actions', label: 'Actions', group: 'Basic' }
];

export default function InventoryTable({ vehicles, userId, lots, currentLotId, userPreferences }: Props) {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [selectedVehicleForDetailing, setSelectedVehicleForDetailing] = useState<any>(null);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    // Initialize visible columns from preferences or default
    const defaultCols = ['status', 'image', 'vehicle', 'vin', 'odometer', 'price', 'daysInStock', 'serviceTicketsList', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        userPreferences?.inventory || defaultCols
    );
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

    const toggleColumn = async (key: string) => {
        const newCols = visibleColumns.includes(key)
            ? visibleColumns.filter(c => c !== key)
            : [...visibleColumns, key];

        // Sort visible columns based on ALL_COLUMNS order to maintain consistency
        const orderedCols = ALL_COLUMNS.filter(c => newCols.includes(c.key)).map(c => c.key);

        setVisibleColumns(orderedCols);
        await saveTablePreferences({ inventory: orderedCols });
    };

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

    const getCount = (status: string) => {
        if (status === 'ALL') return vehicles.length;
        return vehicles.filter(v => v.status === status).length;
    };

    const handleDepositClick = (vehicle: any) => {
        setSelectedVehicle(vehicle);
        setIsDepositModalOpen(true);
    };

    const formatCurrency = (val: any) => {
        if (!val) return '-';
        return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    };

    const formatDate = (dateIn: any) => {
        if (!dateIn) return '-';
        return new Date(dateIn).toLocaleDateString();
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
                        className="block w-40 pl-3 pr-8 py-2 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                    >
                        <option value="ALL">All Lots</option>
                        {lots.map(lot => (
                            <option key={lot.id} value={lot.id}>{lot.name}</option>
                        ))}
                    </select>
                </div>

                {/* Column Selector */}
                <div className="relative z-20">
                    <button
                        onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                        className="bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                        Columns
                    </button>
                    {isColumnMenuOpen && (
                        <div className="absolute left-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 p-4 grid grid-cols-1 gap-4">
                            {/* Grouped Columns */}
                            {Array.from(new Set(ALL_COLUMNS.map(c => c.group))).map(group => (
                                <div key={group}>
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-100 pb-1">{group}</div>
                                    <div className="grid grid-cols-1 gap-1">
                                        {ALL_COLUMNS.filter(c => c.group === group).map(col => (
                                            <label key={col.key} className="flex items-center hover:bg-gray-50 cursor-pointer text-sm py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.includes(col.key)}
                                                    onChange={() => toggleColumn(col.key)}
                                                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                {col.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    {filteredVehicles.length} vehicles
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto min-h-0">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm ring-1 ring-black ring-opacity-5">
                        <tr>
                            {visibleColumns.map(colKey => {
                                const colDef = ALL_COLUMNS.find(c => c.key === colKey);
                                return (
                                    <th key={colKey} scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-50 whitespace-nowrap">
                                        {colDef?.label}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVehicles.map((vehicle, index) => {
                            const hasGuarantee = vehicle.hasGuarantee;
                            const rowClass = hasGuarantee
                                ? 'bg-green-50 hover:bg-green-100'
                                : `${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`;

                            return (
                                <tr key={vehicle.vin} className={rowClass}>
                                    {visibleColumns.map(colKey => {
                                        switch (colKey) {
                                            case 'status':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full border 
                                                        ${vehicle.status === 'PURCHASED' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                                vehicle.status === 'READY_FOR_PICKUP' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                                                                    vehicle.status === 'SOLD' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                                                        vehicle.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                                            vehicle.status === 'POSTED' ? 'bg-green-100 text-green-800 border-green-200' :
                                                                                'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                                            {vehicle.status}
                                                        </span>
                                                    </td>
                                                );
                                            case 'image':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap">
                                                        <div className="h-10 w-16 bg-gray-200 rounded overflow-hidden relative shadow-sm border border-gray-300">
                                                            {vehicle.images && vehicle.images.length > 0 ? (
                                                                <Image
                                                                    src={vehicle.images[0].driveId ? `/api/images/${vehicle.images[0].driveId}?thumbnail=true` : vehicle.images[0].publicUrl}
                                                                    alt="Thumb"
                                                                    className="object-cover"
                                                                    fill
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full text-gray-400 text-[10px]">No Img</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            case 'vehicle':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap">
                                                        <Link href={`/inventory/${vehicle.vin}/edit`} className="block hover:underline hover:text-blue-600">
                                                            <div className="text-sm font-medium text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                                                        </Link>
                                                    </td>
                                                );
                                            case 'vin':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-500">
                                                        {vehicle.vin ? `...${vehicle.vin.substring(vehicle.vin.length - 8)}` : '-'}
                                                    </td>
                                                );
                                            case 'stockNumber':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                        {vehicle.stockNumber || '-'}
                                                    </td>
                                                );
                                            case 'price':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-700">
                                                        {formatCurrency(vehicle.salePrice || vehicle.regularPrice)}
                                                    </td>
                                                );
                                            case 'regularPrice':
                                            case 'wholesalePrice':
                                            case 'purchasePrice':
                                            case 'repairCost':
                                            case 'floorplanCost':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {formatCurrency(vehicle[colKey])}
                                                    </td>
                                                );
                                            case 'totalCost':
                                                // Rough calculation if not existing, but typically stored. Let's assume passed or 0.
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {formatCurrency(vehicle.total || vehicle.purchasePrice)}
                                                    </td>
                                                );
                                            case 'miles':
                                            case 'odometer':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                                        {vehicle.odometer?.toLocaleString() || '-'}
                                                    </td>
                                                );
                                            case 'color':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                                        {vehicle.color || '-'}
                                                        {vehicle.interiorColor ? ` / ${vehicle.interiorColor}` : ''}
                                                    </td>
                                                );
                                            case 'year':
                                            case 'make':
                                            case 'model':
                                            case 'trim':
                                            case 'bodyStyle':
                                            case 'fuelType':
                                            case 'driveTrain':
                                            case 'transmission':
                                            case 'engine':
                                            case 'doors':
                                            case 'cylinders': // Map to engineCylinders
                                                const val = colKey === 'cylinders' ? vehicle.engineCylinders : vehicle[colKey];
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                                                        <Link href={`/inventory/${vehicle.vin}/edit`} className="hover:underline hover:text-blue-600 block">
                                                            {val || '-'}
                                                        </Link>
                                                    </td>
                                                );
                                            case 'daysInStock':
                                                const added = new Date(vehicle.createdAt);
                                                const now = new Date();
                                                const days = Math.floor((now.getTime() - added.getTime()) / (1000 * 3600 * 24));
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                                                        {days}
                                                    </td>
                                                );
                                            case 'dateAdded':
                                                return <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(vehicle.createdAt)}</td>;
                                            case 'datePosted':
                                                return <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(vehicle.datePosted)}</td>;
                                            case 'dateSold':
                                                return <td key={colKey} className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatDate(vehicle.dateSold)}</td>;
                                            case 'inspection':
                                                const insp = vehicle.inspections?.[0];
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-center">
                                                        {insp ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-semibold text-green-700">{formatDate(insp.date)}</span>
                                                                {insp.codes?.length > 0 && <span className="text-[10px] text-red-500">{insp.codes.length} Codes</span>}
                                                            </div>
                                                        ) : <span className="text-gray-400">-</span>}
                                                    </td>
                                                );
                                            case 'lastInspection':
                                                const lastInsp = vehicle.inspections?.[0];
                                                if (!lastInsp) return <td key={colKey} className="px-3 py-2 text-center text-gray-400">-</td>;

                                                const hasMech = lastInsp.needsMechanicalRecon;
                                                const hasCosm = lastInsp.needsCosmeticRecon;
                                                const codeCount = lastInsp.codes?.length || 0;

                                                let summary = "Clean";
                                                let summaryColor = "text-green-600 bg-green-50";

                                                if (hasMech || hasCosm || codeCount > 0) {
                                                    const issues = [];
                                                    if (hasMech) issues.push("Mech");
                                                    if (hasCosm) issues.push("Cosm");
                                                    if (codeCount > 0) issues.push(`${codeCount} Codes`);
                                                    summary = issues.join(", ");
                                                    summaryColor = "text-red-700 bg-red-50";
                                                }

                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-center">
                                                        <span className={`text-[10px] px-2 py-1 rounded font-medium ${summaryColor}`}>
                                                            {summary}
                                                        </span>
                                                    </td>
                                                );
                                            case 'serviceStatus':
                                                const ticketCount = vehicle.serviceTickets?.length || 0;
                                                const activeTickets = vehicle.serviceTickets?.filter((t: any) => t.status !== 'Completed').length || 0;
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-center">
                                                        {ticketCount > 0 ? (
                                                            <span className={`text-xs px-2 py-0.5 rounded ${activeTickets > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                                                                {activeTickets} Active / {ticketCount} Total
                                                            </span>
                                                        ) : <span className="text-gray-400">-</span>}
                                                    </td>
                                                );
                                            case 'serviceTicketsList':
                                                const tickets = vehicle.serviceTickets || [];
                                                if (tickets.length === 0) return <td key={colKey} className="px-3 py-2 text-center text-gray-400">-</td>;

                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-center">
                                                        <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                                                            {tickets.map((t: any) => (
                                                                <Link
                                                                    key={t.id}
                                                                    href={`/service/${t.id}`}
                                                                    className={`text-[10px] px-1.5 py-0.5 rounded border hover:underline
                                                                        ${t.status === 'Completed' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200 font-medium'}`}
                                                                    title={`${t.status}: ${t.description}`}
                                                                >
                                                                    T-{t.id.slice(-4)}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </td>
                                                );
                                            case 'salesNotes':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 text-sm text-gray-500 max-w-xs truncate" title={vehicle.salesNotes}>
                                                        {vehicle.salesNotes || '-'}
                                                    </td>
                                                );
                                            case 'actions':
                                                return (
                                                    <td key={colKey} className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleDepositClick(vehicle)}
                                                                className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded"
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
                                                            <button
                                                                onClick={() => setSelectedVehicleForDetailing(vehicle)}
                                                                className="text-teal-600 hover:text-teal-900 p-1 hover:bg-teal-50 rounded"
                                                                title="Add Detailing Detailing"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                                </svg>
                                                            </button>
                                                            <Link href={`/inventory/${vehicle.vin}/edit`} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                );
                                            default:
                                                return <td key={colKey}></td>;
                                        }
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Status Tabs */}
            <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
                {['ALL', 'PURCHASED', 'DELIVERED', 'Inspected', 'In Repair', 'Repaired', 'In Detailing', 'DETAILED', 'PICTURED', 'POSTED', 'ON_HOLD', 'SOLD'].map(status => (
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

            {selectedVehicleForDetailing && (
                <DetailingRequestModal
                    isOpen={!!selectedVehicleForDetailing}
                    onClose={() => setSelectedVehicleForDetailing(null)}
                    vin={selectedVehicleForDetailing.vin}
                    stockNumber={selectedVehicleForDetailing.stockNumber}
                />
            )}
        </div>
    );
}
