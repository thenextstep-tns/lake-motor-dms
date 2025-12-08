'use client';

import { useState, useEffect } from 'react';
import { getMemberDetails, updateCompanyMember } from '@/app/actions/settings';

type Props = {
    userId: string;
    availableLots: { id: string; name: string }[];
    onClose: () => void;
};

// Tabs for the Modal
const TABS = ['Personal', 'Employment', 'Compensation', 'Documents', 'Other'];

export default function MemberProfileModal({ userId, availableLots, onClose }: Props) {
    const [activeTab, setActiveTab] = useState('Personal');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // We store merged User + CompanyMember data flat for form
    const [formData, setFormData] = useState<any>({});
    const [initialData, setInitialData] = useState<any>({});

    useEffect(() => {
        loadData();
    }, [userId]);

    async function loadData() {
        setLoading(true);
        try {
            const member: any = await getMemberDetails(userId);
            // Merge into flat structure
            const data = {
                // User fields
                firstName: member.user.firstName || '',
                lastName: member.user.lastName || '',
                email: member.user.email || '',
                phone: member.user.phone || '',
                personalEmail: member.user.personalEmail || '',
                birthday: member.user.birthday ? new Date(member.user.birthday).toISOString().split('T')[0] : '',
                address: member.user.address || '',
                emergencyContact: member.user.emergencyContact || '',

                // Member fields
                status: member.status || 'Active',
                position: member.position || '',
                department: member.department || '',
                workPhone: member.workPhone || '',
                workEmail: member.workEmail || '',
                startDate: member.startDate ? new Date(member.startDate).toISOString().split('T')[0] : '',
                endDate: member.endDate ? new Date(member.endDate).toISOString().split('T')[0] : '',
                hourlyRate: member.hourlyRate || '',
                weeklyRate: member.weeklyRate || '',
                monthlyRate: member.monthlyRate || '',
                bonusSystem: member.bonusSystem || '',
                offerLink: member.offerLink || '',
                contractLink: member.contractLink || '',
                ndaLink: member.ndaLink || '',
                keyKpi: member.keyKpi || '',
                currentExperience: member.currentExperience || '',
                comment: member.comment || '',

                // Lot fields
                lotId: member.lotId || '',
                accessibleLots: member.accessibleLots ? member.accessibleLots.map((l: any) => l.id) : []
            };
            setFormData(data);
            setInitialData(data);
        } catch (error) {
            console.error(error);
            alert("Failed to load member profile");
            onClose();
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await updateCompanyMember(userId, formData);
            alert("Profile updated successfully");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save changes. Ensure you have permissions.");
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleAccessibleLotToggle = (lotId: string) => {
        setFormData((prev: any) => {
            const current = prev.accessibleLots || [];
            if (current.includes(lotId)) {
                return { ...prev, accessibleLots: current.filter((id: string) => id !== lotId) };
            } else {
                return { ...prev, accessibleLots: [...current, lotId] };
            }
        });
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow">Loading...</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-800">
                        {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : (formData.email || 'Edit Profile')}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'Personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="First Name" value={formData.firstName} onChange={v => handleChange('firstName', v)} />
                            <Field label="Last Name" value={formData.lastName} onChange={v => handleChange('lastName', v)} />
                            <Field label="Phone (Personal)" value={formData.phone} onChange={v => handleChange('phone', v)} />
                            <Field label="Email (Personal)" value={formData.personalEmail} onChange={v => handleChange('personalEmail', v)} type="email" />
                            <Field label="Birthday" value={formData.birthday} onChange={v => handleChange('birthday', v)} type="date" />
                            <div className="col-span-2">
                                <Field label="Current Residence" value={formData.address} onChange={v => handleChange('address', v)} textArea />
                            </div>
                            <div className="col-span-2">
                                <Field label="Emergency Contact (Name & Phone)" value={formData.emergencyContact} onChange={v => handleChange('emergencyContact', v)} textArea />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Employment' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={formData.status}
                                    onChange={e => handleChange('status', e.target.value)}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="OnLeave">On Leave</option>
                                </select>
                            </div>

                            {/* Lot Assignment Section */}
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Lot Assignment</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Lot</label>
                                        <select
                                            className="w-full border rounded-md p-2"
                                            value={formData.lotId}
                                            onChange={e => handleChange('lotId', e.target.value)}
                                        >
                                            <option value="">-- No Assigned Lot --</option>
                                            {availableLots.map(lot => (
                                                <option key={lot.id} value={lot.id}>{lot.name}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            The main lot where this employee is based.
                                        </p>
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Accessible Lots</label>
                                        <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                            {availableLots.map(lot => (
                                                <div key={lot.id} className="flex items-center mb-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`access-${lot.id}`}
                                                        checked={formData.accessibleLots?.includes(lot.id)}
                                                        onChange={() => handleAccessibleLotToggle(lot.id)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`access-${lot.id}`} className="ml-2 block text-sm text-gray-900">
                                                        {lot.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Other lots this employee can access.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Role Details</h3>
                            </div>

                            <Field label="Position / Title" value={formData.position} onChange={v => handleChange('position', v)} />
                            <Field label="Department / Division" value={formData.department} onChange={v => handleChange('department', v)} />
                            <Field label="Work Phone" value={formData.workPhone} onChange={v => handleChange('workPhone', v)} />
                            <Field label="Work Email" value={formData.workEmail} onChange={v => handleChange('workEmail', v)} type="email" />
                            <Field label="Start Day" value={formData.startDate} onChange={v => handleChange('startDate', v)} type="date" />
                            <Field label="Exit Day" value={formData.endDate} onChange={v => handleChange('endDate', v)} type="date" />
                            <div className="col-span-2">
                                <Field label="Current Experience" value={formData.currentExperience} onChange={v => handleChange('currentExperience', v)} textArea placeholder="Summary of experience..." />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Compensation' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-yellow-50 text-sm text-yellow-800 rounded border border-yellow-200">
                                Protected: Only Admin, Owner, HR, Accountant can view/edit.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Field label="Hourly Rate ($)" value={formData.hourlyRate} onChange={v => handleChange('hourlyRate', v)} type="number" />
                                <Field label="Weekly Rate ($)" value={formData.weeklyRate} onChange={v => handleChange('weeklyRate', v)} type="number" />
                                <Field label="Monthly Pay ($)" value={formData.monthlyRate} onChange={v => handleChange('monthlyRate', v)} type="number" />
                            </div>
                            <div>
                                <Field label="Bonus System" value={formData.bonusSystem} onChange={v => handleChange('bonusSystem', v)} textArea />
                            </div>
                            <div>
                                <Field label="Key KPI" value={formData.keyKpi} onChange={v => handleChange('keyKpi', v)} textArea placeholder="Main performance indicators..." />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Documents' && (
                        <div className="grid grid-cols-1 gap-6">
                            <Field label="Offer Link" value={formData.offerLink} onChange={v => handleChange('offerLink', v)} placeholder="https://..." />
                            <Field label="Contract Link" value={formData.contractLink} onChange={v => handleChange('contractLink', v)} placeholder="https://..." />
                            <Field label="NDA Document Link" value={formData.ndaLink} onChange={v => handleChange('ndaLink', v)} placeholder="https://..." />
                        </div>
                    )}

                    {activeTab === 'Other' && (
                        <div className="grid grid-cols-1 gap-6">
                            <Field label="Comments / Notes" value={formData.comment} onChange={v => handleChange('comment', v)} textArea />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 font-medium"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', textArea = false, placeholder = '' }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {textArea ? (
                <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            )}
        </div>
    );
}
