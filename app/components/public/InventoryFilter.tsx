'use client';

import { useState, useEffect, useMemo } from 'react';
import RangeSlider from '../ui/RangeSlider';

interface FilterState {
    make: string;
    model: string;
    minYear: string;
    maxYear: string;
    minPrice: string;
    maxPrice: string;
    minMiles: string;
    maxMiles: string;
    drivetrain: string;
    fuelType: string;
    bodyStyle: string;
    marketingLabels: string[];
}

interface InventoryFilterProps {
    vehicles: any[];
    onFilterChange: (filtered: any[]) => void;
}

// Helper to format numbers
const formatNumber = (num: number) => num.toLocaleString();

export default function InventoryFilter({ vehicles, onFilterChange }: InventoryFilterProps) {
    // Calculate limits from data
    const limits = useMemo(() => {
        if (vehicles.length === 0) return {
            minYear: 2000, maxYear: new Date().getFullYear(),
            minPrice: 0, maxPrice: 100000,
            minMiles: 0, maxMiles: 200000
        };

        const years = vehicles.map(v => v.year);
        const prices = vehicles.map(v => Number(v.salePrice));
        const miles = vehicles.map(v => v.odometer);

        return {
            minYear: Math.min(...years),
            maxYear: Math.max(...years),
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            minMiles: Math.min(...miles),
            maxMiles: Math.max(...miles)
        };
    }, [vehicles]);

    const [filters, setFilters] = useState<FilterState>({
        make: '',
        model: '',
        minYear: '',
        maxYear: '',
        minPrice: '',
        maxPrice: '',
        minMiles: '',
        maxMiles: '',
        drivetrain: '',
        fuelType: '',
        bodyStyle: '',
        marketingLabels: []
    });

    // Extract unique values for dropdowns
    const uniqueMakes = useMemo(() => Array.from(new Set(vehicles.map(v => v.make).filter(Boolean))).sort(), [vehicles]);
    const uniqueModels = useMemo(() => {
        let filtered = vehicles;
        if (filters.make) {
            filtered = filtered.filter(v => v.make === filters.make);
        }
        return Array.from(new Set(filtered.map(v => v.model).filter(Boolean))).sort();
    }, [vehicles, filters.make]);

    const uniqueDrivetrains = useMemo(() => Array.from(new Set(vehicles.map(v => v.driveTrain).filter(Boolean))).sort(), [vehicles]);
    const uniqueFuelTypes = useMemo(() => Array.from(new Set(vehicles.map(v => v.fuelType).filter(Boolean))).sort(), [vehicles]);
    const uniqueBodyStyles = useMemo(() => Array.from(new Set(vehicles.map(v => v.bodyStyle).filter(Boolean))).sort(), [vehicles]);

    // Extract unique Marketing Labels
    const uniqueLabels = useMemo(() => {
        const labelsMap = new Map();
        vehicles.forEach(v => {
            if (v.marketingLabels) {
                v.marketingLabels.forEach((l: any) => {
                    if (!labelsMap.has(l.name)) {
                        labelsMap.set(l.name, l);
                    }
                });
            }
        });
        return Array.from(labelsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [vehicles]);

    // Apply filters
    useEffect(() => {
        const filtered = vehicles.filter(vehicle => {
            if (filters.make && vehicle.make !== filters.make) return false;
            if (filters.model && vehicle.model !== filters.model) return false;

            if (filters.minYear && vehicle.year < parseInt(filters.minYear)) return false;
            if (filters.maxYear && vehicle.year > parseInt(filters.maxYear)) return false;

            if (filters.minPrice && vehicle.salePrice < parseFloat(filters.minPrice)) return false;
            if (filters.maxPrice && vehicle.salePrice > parseFloat(filters.maxPrice)) return false;

            if (filters.minMiles && vehicle.odometer < parseInt(filters.minMiles)) return false;
            if (filters.maxMiles && vehicle.odometer > parseInt(filters.maxMiles)) return false;

            if (filters.drivetrain && vehicle.driveTrain !== filters.drivetrain) return false;
            if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;
            if (filters.bodyStyle && vehicle.bodyStyle !== filters.bodyStyle) return false;

            // Marketing Labels Filter (AND logic: must match all selected)
            if (filters.marketingLabels.length > 0) {
                const vehicleLabels = vehicle.marketingLabels?.map((l: any) => l.name) || [];
                const hasAllLabels = filters.marketingLabels.every(label => vehicleLabels.includes(label));
                if (!hasAllLabels) return false;
            }

            return true;
        });
        onFilterChange(filtered);
    }, [filters, vehicles, onFilterChange]);

    const handleChange = (field: keyof FilterState, value: string | string[]) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            // Reset model if make changes
            ...(field === 'make' ? { model: '' } : {})
        }));
    };

    const clearFilters = () => {
        setFilters({
            make: '',
            model: '',
            minYear: '',
            maxYear: '',
            minPrice: '',
            maxPrice: '',
            minMiles: '',
            maxMiles: '',
            drivetrain: '',
            fuelType: '',
            bodyStyle: '',
            marketingLabels: []
        });
    };

    return (
        <div className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800 h-fit sticky top-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                <button
                    onClick={clearFilters}
                    className="text-sm text-red-500 hover:text-red-400 font-medium"
                >
                    Reset All
                </button>
            </div>

            <div className="space-y-8">
                {/* Make & Model */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Make</label>
                        <select
                            value={filters.make}
                            onChange={(e) => handleChange('make', e.target.value)}
                            className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                        >
                            <option value="">All Makes</option>
                            {uniqueMakes.map(make => (
                                <option key={make} value={make}>{make}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
                        <select
                            value={filters.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                            disabled={!filters.make}
                            className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 disabled:opacity-50"
                        >
                            <option value="">All Models</option>
                            {uniqueModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Year Range */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-400">Year</label>
                        <span className="text-xs text-red-500 font-bold">
                            {filters.minYear || limits.minYear} - {filters.maxYear || limits.maxYear}
                        </span>
                    </div>
                    <RangeSlider
                        min={limits.minYear}
                        max={limits.maxYear}
                        value={[
                            parseInt(filters.minYear) || limits.minYear,
                            parseInt(filters.maxYear) || limits.maxYear
                        ]}
                        onChange={([min, max]) => {
                            handleChange('minYear', min.toString());
                            handleChange('maxYear', max.toString());
                        }}
                    />
                    <div className="flex gap-2 mt-3">
                        <input
                            type="number"
                            value={filters.minYear}
                            onChange={(e) => handleChange('minYear', e.target.value)}
                            placeholder={limits.minYear.toString()}
                            className="w-1/2 bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                        <input
                            type="number"
                            value={filters.maxYear}
                            onChange={(e) => handleChange('maxYear', e.target.value)}
                            placeholder={limits.maxYear.toString()}
                            className="w-1/2 bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                    </div>
                </div>

                {/* Price Range */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-400">Price</label>
                        <span className="text-xs text-red-500 font-bold">
                            ${formatNumber(parseInt(filters.minPrice) || limits.minPrice)} - ${formatNumber(parseInt(filters.maxPrice) || limits.maxPrice)}
                        </span>
                    </div>
                    <RangeSlider
                        min={limits.minPrice}
                        max={limits.maxPrice}
                        step={500}
                        value={[
                            parseInt(filters.minPrice) || limits.minPrice,
                            parseInt(filters.maxPrice) || limits.maxPrice
                        ]}
                        onChange={([min, max]) => {
                            handleChange('minPrice', min.toString());
                            handleChange('maxPrice', max.toString());
                        }}
                    />
                    <div className="flex gap-2 mt-3">
                        <input
                            type="number"
                            value={filters.minPrice}
                            onChange={(e) => handleChange('minPrice', e.target.value)}
                            placeholder={limits.minPrice.toString()}
                            className="w-1/2 bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                        <input
                            type="number"
                            value={filters.maxPrice}
                            onChange={(e) => handleChange('maxPrice', e.target.value)}
                            placeholder={limits.maxPrice.toString()}
                            className="w-1/2 bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                    </div>
                </div>

                {/* Mileage Range */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-400">Mileage</label>
                        <span className="text-xs text-red-500 font-bold">
                            {formatNumber(parseInt(filters.minMiles) || limits.minMiles)} - {formatNumber(parseInt(filters.maxMiles) || limits.maxMiles)}
                        </span>
                    </div>
                    <RangeSlider
                        min={limits.minMiles}
                        max={limits.maxMiles}
                        step={1000}
                        value={[
                            parseInt(filters.minMiles) || limits.minMiles,
                            parseInt(filters.maxMiles) || limits.maxMiles
                        ]}
                        onChange={([min, max]) => {
                            handleChange('minMiles', min.toString());
                            handleChange('maxMiles', max.toString());
                        }}
                    />
                    <div className="flex gap-2 mt-3">
                        <input
                            type="number"
                            value={filters.minMiles}
                            onChange={(e) => handleChange('minMiles', e.target.value)}
                            placeholder={limits.minMiles.toString()}
                            className="w-1/2 bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                        <input
                            type="number"
                            value={filters.maxMiles}
                            onChange={(e) => handleChange('maxMiles', e.target.value)}
                            placeholder={limits.maxMiles.toString()}
                            className="w-1/2 bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-red-600"
                        />
                    </div>
                </div>

                {/* Marketing Labels (Perks) */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Perks & Features</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {uniqueLabels.map(label => (
                            <label key={label.name} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.marketingLabels.includes(label.name)}
                                    onChange={(e) => {
                                        const newLabels = e.target.checked
                                            ? [...filters.marketingLabels, label.name]
                                            : filters.marketingLabels.filter((l: any) => l !== label.name);
                                        handleChange('marketingLabels', newLabels);
                                    }}
                                    className="rounded border-gray-700 bg-[#262626] text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
                                />
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex items-center gap-2">
                                    {label.name}
                                    <span
                                        className="w-2 h-2 rounded-full inline-block"
                                        style={{ backgroundColor: label.colorCode }}
                                    />
                                </span>
                            </label>
                        ))}
                        {uniqueLabels.length === 0 && (
                            <div className="text-sm text-gray-500 italic">No specific perks available.</div>
                        )}
                    </div>
                </div>

                {/* Other Specs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Drivetrain</label>
                        <select
                            value={filters.drivetrain}
                            onChange={(e) => handleChange('drivetrain', e.target.value)}
                            className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                        >
                            <option value="">All Drivetrains</option>
                            {uniqueDrivetrains.map(dt => (
                                <option key={dt} value={dt}>{dt}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Fuel Type</label>
                        <select
                            value={filters.fuelType}
                            onChange={(e) => handleChange('fuelType', e.target.value)}
                            className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                        >
                            <option value="">All Fuel Types</option>
                            {uniqueFuelTypes.map(ft => (
                                <option key={ft} value={ft}>{ft}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Body Style</label>
                        <select
                            value={filters.bodyStyle}
                            onChange={(e) => handleChange('bodyStyle', e.target.value)}
                            className="w-full bg-[#262626] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                        >
                            <option value="">All Body Styles</option>
                            {uniqueBodyStyles.map(bs => (
                                <option key={bs} value={bs}>{bs}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
