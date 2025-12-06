'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLot, updateLot, deleteLot } from '@/app/actions/lot';
import WorkingHoursEditor from '@/app/components/WorkingHoursEditor';


const US_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern (ET)' },
    { value: 'America/Chicago', label: 'Central (CT)' },
    { value: 'America/Denver', label: 'Mountain (MT)' },
    { value: 'America/Phoenix', label: 'Arizona (MT - No DST)' },
    { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
    { value: 'America/Anchorage', label: 'Alaska (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
];

type Lot = {
    id: string;
    name: string;
    address: string | null;
    timezone: string | null;
    workingHours: string | null;
    contacts: { type: string, value: string, label?: string | null }[];
    _count?: { vehicles: number };
};

type Props = {
    companyId: string;
    initialLots: Lot[];
    companySettings?: any;
};

export default function LotListClient({ companyId, initialLots, companySettings }: Props) {
    const router = useRouter();
    const lots = initialLots;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLot, setEditingLot] = useState<Lot | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        timezone: 'America/Chicago',
        workingHours: '{}', // Stored as stringified JSON
        contacts: [] as { type: 'PHONE' | 'EMAIL', value: string, label?: string }[]
    });
    const [loading, setLoading] = useState(false);

    // Helper to parse working hours safely
    const parseHours = (json: string | null) => {
        try {
            return json ? JSON.parse(json) : {};
        } catch {
            return {};
        }
    };

    // Helper to detect timezone from address state
    const detectTimezone = (address: string) => {
        const upper = address.toUpperCase();
        if (upper.includes(' CA ') || upper.includes(' WA ') || upper.includes(' OR ') || upper.includes(' NV ')) return 'America/Los_Angeles';
        if (upper.includes(' NY ') || upper.includes(' FL ') || upper.includes(' NJ ') || upper.includes(' MA ')) return 'America/New_York';
        if (upper.includes(' IL ') || upper.includes(' TX ') || upper.includes(' LA ') || upper.includes(' TN ')) return 'America/Chicago';
        if (upper.includes(' AZ ')) return 'America/Phoenix';
        if (upper.includes(' CO ') || upper.includes(' UT ')) return 'America/Denver';
        if (upper.includes(' HI ')) return 'Pacific/Honolulu';
        if (upper.includes(' AK ')) return 'America/Anchorage';
        return null;
    };

    // Auto-detect timezone when address changes
    /* useEffect(() => {
        if (!formData.address) return;
        const detected = detectTimezone(formData.address);
        if (detected && detected !== formData.timezone) {
            setFormData(prev => ({ ...prev, timezone: detected }));
        }
    }, [formData.address]); */
    // Commented out useEffect to avoid overriding user selection while typing. 
    // Better to do it on blur or simple button, or just let them pick.
    // Actually, let's do it only if timezone is default or empty?
    // Let's stick to manual or creating a specific "Detect" button if complex.
    // For now, I'll add logic to the address onChange to suggest it?

    // Revised approach: simple detection on address blur or change if desirable.
    // Let's just add it to the onChange handler for address to keep it simple but maybe throttled?
    // No, standard practice is usually manual selection to avoid annoyance.
    // I will implement a "Suggest" logic or just set it on initial address fill if empty.

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAddress = e.target.value;
        const detected = detectTimezone(newAddress);

        setFormData(prev => ({
            ...prev,
            address: newAddress,
            // Only auto-switch if we strongly match a state and user hasn't toggled away?
            // Let's just overwrite for now as requested "checked when address is updated"
            timezone: detected || prev.timezone
        }));
    };

    const openCreateModal = () => {
        setEditingLot(null);
        setFormData({ name: '', address: '', timezone: 'America/Chicago', workingHours: '{}', contacts: [] });
        setIsModalOpen(true);
    };

    const openEditModal = (lot: Lot) => {
        setEditingLot(lot);
        setFormData({
            name: lot.name,
            address: lot.address || '',
            timezone: lot.timezone || 'America/Chicago',
            workingHours: lot.workingHours || '{}',
            contacts: lot.contacts?.map(c => ({ type: c.type as 'PHONE' | 'EMAIL', value: c.value, label: c.label || '' })) || []
        });
        setIsModalOpen(true);
    };

    const copyFromCompany = () => {
        if (!companySettings) return;
        const companyHours = companySettings.workingHours || '{}';
        const companyContacts = companySettings.contacts?.map((c: any) => ({
            type: c.type as 'PHONE' | 'EMAIL',
            value: c.value,
            label: c.label || ''
        })) || [];

        setFormData(prev => ({
            ...prev,
            address: companySettings.address || '',
            workingHours: companyHours,
            contacts: companyContacts
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingLot) {
                await updateLot(editingLot.id, formData);
            } else {
                await createLot(companyId, formData);
            }
            router.refresh();
            setLoading(false);
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Failed to save lot');
            setLoading(false);
        }
    };

    const handleDelete = async (lotId: string) => {
        if (!confirm('Are you sure you want to delete this lot?')) return;
        try {
            await deleteLot(lotId);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to delete lot');
        }
    };

    const addContact = () => {
        setFormData(prev => ({
            ...prev,
            contacts: [...prev.contacts, { type: 'PHONE', value: '', label: '' }]
        }));
    };

    const removeContact = (index: number) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.filter((_, i) => i !== index)
        }));
    };

    const updateContact = (index: number, field: string, value: string) => {
        const newContacts = [...formData.contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setFormData(prev => ({ ...prev, contacts: newContacts }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Manage Lots</h2>
                {!isModalOpen && (
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        + Add New Lot
                    </button>
                )}
            </div>

            {/* Inline Editor / Creator */}
            {isModalOpen && (
                <div className="bg-white p-6 rounded-lg shadow border border-blue-100 mb-6 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {editingLot ? 'Edit Lot' : 'New Lot'}
                        </h3>
                        <button
                            type="button"
                            onClick={copyFromCompany}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            Copy info from Company
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Lot Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    value={formData.address}
                                    onChange={handleAddressChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">Timezone</label>
                                <select
                                    name="timezone"
                                    id="timezone"
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    {US_TIMEZONES.map(tz => (
                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Contacts Section */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Contacts</label>
                                <button type="button" onClick={addContact} className="text-xs text-blue-600 hover:text-blue-800">+ Add Contact</button>
                            </div>
                            {formData.contacts.map((contact, index) => (
                                <div key={index} className="flex gap-2 mb-2 items-center">
                                    <select
                                        value={contact.type}
                                        onChange={(e) => updateContact(index, 'type', e.target.value)}
                                        className="block w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                    >
                                        <option value="PHONE">Phone</option>
                                        <option value="EMAIL">Email</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        value={contact.value}
                                        onChange={(e) => updateContact(index, 'value', e.target.value)}
                                        className="block flex-1 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Label (e.g. Sales)"
                                        value={contact.label || ''}
                                        onChange={(e) => updateContact(index, 'label', e.target.value)}
                                        className="block w-32 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                    />
                                    <button type="button" onClick={() => removeContact(index)} className="text-red-500 hover:text-red-700">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {formData.contacts.length === 0 && <p className="text-sm text-gray-400 italic">No contacts added.</p>}
                        </div>



                        {/* Working Hours Editor */}
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-4">Working Hours</label>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <WorkingHoursEditor
                                    value={formData.workingHours}
                                    onChange={(val) => setFormData(prev => ({ ...prev, workingHours: val }))}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Lot'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {lots.length === 0 ? (
                        <li className="px-4 py-4 sm:px-6 text-gray-500 text-center italic">No lots found.</li>
                    ) : (
                        lots.map((lot) => (
                            <li key={lot.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-blue-600 truncate">{lot.name}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{lot.address || 'No address provided'}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-gray-400">{lot._count?.vehicles || 0} vehicles</span>
                                        {lot.contacts && lot.contacts.length > 0 && (
                                            <span className="text-xs text-gray-400">• {lot.contacts.length} contacts</span>
                                        )}
                                    </div>

                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openEditModal(lot)}
                                        className="text-gray-400 hover:text-gray-500 p-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lot.id)}
                                        className="text-red-400 hover:text-red-500 p-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
