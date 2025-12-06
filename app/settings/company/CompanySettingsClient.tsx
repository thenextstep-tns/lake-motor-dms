'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCompanySettings } from '@/app/actions/company';

type Props = {
    company: any; // Type strictly later
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CompanySettingsClient({ company }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(company.name);
    const [address, setAddress] = useState(company.address || '');

    // Parse initial hours or default
    const initialHours = company.workingHours ? JSON.parse(company.workingHours) : {};
    const [hours, setHours] = useState<Record<string, { start: string; end: string; closed: boolean }>>(
        DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: initialHours[day] || { start: '09:00', end: '17:00', closed: false }
        }), {})
    );

    const [contacts, setContacts] = useState<{ type: string; value: string; label: string }[]>(
        company.contacts?.map((c: any) => ({ type: c.type, value: c.value, label: c.label || '' })) || []
    );

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateCompanySettings(company.id, {
                name,
                address,
                workingHours: JSON.stringify(hours),
                contacts,
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const updateHour = (day: string, field: 'start' | 'end' | 'closed', value: any) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const addContact = () => {
        setContacts([...contacts, { type: 'PHONE', value: '', label: '' }]);
    };

    const removeContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const updateContact = (index: number, field: string, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">General Information</h2>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
                    <button
                        onClick={addContact}
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        + Add Contact
                    </button>
                </div>
                <div className="space-y-4">
                    {contacts.map((contact, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                            <select
                                value={contact.type}
                                onChange={(e) => updateContact(idx, 'type', e.target.value)}
                                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="PHONE">Phone</option>
                                <option value="EMAIL">Email</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Label (e.g. Sales)"
                                value={contact.label}
                                onChange={(e) => updateContact(idx, 'label', e.target.value)}
                                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                            <input
                                type="text"
                                placeholder="Value"
                                value={contact.value}
                                onChange={(e) => updateContact(idx, 'value', e.target.value)}
                                className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                            <button
                                onClick={() => removeContact(idx)}
                                className="text-red-500 hover:text-red-700 p-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {contacts.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No contacts added.</p>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Working Hours</h2>
                <div className="space-y-4">
                    {DAYS.map((day) => (
                        <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                            <div className="w-32 font-medium text-gray-700">{day}</div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={hours[day].closed}
                                    onChange={(e) => updateHour(day, 'closed', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Closed</span>
                            </label>

                            {!hours[day].closed && (
                                <>
                                    <input
                                        type="time"
                                        value={hours[day].start}
                                        onChange={(e) => updateHour(day, 'start', e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1 border"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="time"
                                        value={hours[day].end}
                                        onChange={(e) => updateHour(day, 'end', e.target.value)}
                                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1 border"
                                    />
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
