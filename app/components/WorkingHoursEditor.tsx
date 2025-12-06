'use client';

import { useEffect, useState } from "react";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type WorkingHours = Record<string, { start: string; end: string; closed: boolean }>;

type Props = {
    value: string | null;
    onChange: (value: string) => void;
};

export default function WorkingHoursEditor({ value, onChange }: Props) {
    const parseHours = (json: string | null): WorkingHours => {
        try {
            const parsed = json ? JSON.parse(json) : {};
            // Merge with defaults to ensure all days exist
            return DAYS.reduce((acc, day) => ({
                ...acc,
                [day]: parsed[day] || { start: '09:00', end: '17:00', closed: false }
            }), {} as WorkingHours);
        } catch {
            return DAYS.reduce((acc, day) => ({
                ...acc,
                [day]: { start: '09:00', end: '17:00', closed: false }
            }), {} as WorkingHours);
        }
    };

    const [hours, setHours] = useState<WorkingHours>(parseHours(value));

    // Sync internal state if external value changes significantly (optional, but good for "Copy from Company")
    useEffect(() => {
        setHours(parseHours(value));
    }, [value]);

    const updateHour = (day: string, field: 'start' | 'end' | 'closed', val: any) => {
        const newHours = {
            ...hours,
            [day]: { ...hours[day], [field]: val }
        };
        setHours(newHours);
        onChange(JSON.stringify(newHours));
    };

    return (
        <div className="space-y-4">
            {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-24 sm:w-32 font-medium text-gray-700 text-sm sm:text-base">{day}</div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={hours[day]?.closed}
                            onChange={(e) => updateHour(day, 'closed', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">Closed</span>
                    </label>

                    {!hours[day]?.closed && (
                        <div className="flex items-center gap-2 ml-auto sm:ml-4">
                            <input
                                type="time"
                                value={hours[day]?.start}
                                onChange={(e) => updateHour(day, 'start', e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 border w-24 sm:w-auto"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="time"
                                value={hours[day]?.end}
                                onChange={(e) => updateHour(day, 'end', e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 border w-24 sm:w-auto"
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
