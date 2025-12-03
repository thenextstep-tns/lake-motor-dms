'use client';

import { useState } from 'react';
import InventoryGrid from './InventoryGrid';
import InventoryFilter from './InventoryFilter';

interface InventoryContainerProps {
    initialVehicles: any[];
}

export default function InventoryContainer({ initialVehicles }: InventoryContainerProps) {
    const [filteredVehicles, setFilteredVehicles] = useState(initialVehicles);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="w-full bg-[#1a1a1a] border border-gray-800 text-white py-3 px-4 rounded flex justify-between items-center"
                >
                    <span className="font-bold">Filters</span>
                    <svg
                        className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Sidebar Filter */}
            <aside className={`lg:w-1/4 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                <InventoryFilter
                    vehicles={initialVehicles}
                    onFilterChange={setFilteredVehicles}
                />
            </aside>

            {/* Main Content */}
            <div className="lg:w-3/4">
                <div className="mb-4 text-gray-400">
                    Showing {filteredVehicles.length} vehicles
                </div>
                <InventoryGrid vehicles={filteredVehicles} />
            </div>
        </div>
    );
}
