'use client';

import { useState, useEffect } from 'react';
import { createVehicle, updateVehicle, deleteVehicle, decodeVin } from '@/app/actions/vehicle';
import { syncVehicleImages, reorderImages, toggleImageVisibility } from '@/app/actions/drive';
import { deleteDeposit } from '@/app/actions/deposit-delete';
import { createInspection, updateInspection, deleteInspection, getDiagnosticCodeDescription } from '@/app/actions/inspection';
import { getVehicleServiceHistory as getHistory, createServiceTicket } from '@/app/actions/service';
import DepositModal from '@/app/components/inventory/DepositModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { VEHICLE_COLORS, VEHICLE_CATEGORIES, VEHICLE_FUEL_TYPES, VEHICLE_BODY_STYLES, VEHICLE_DRIVETRAINS, VEHICLE_TRANSMISSION_TYPES } from '@/app/domain/constants';

export default function AddVehicleForm({ userId, userName, initialData, onSuccess, availableLots = [], attributes = [], marketingLabels = [] }: { userId: string, userName?: string, initialData?: any, onSuccess?: () => void, availableLots?: { id: string, name: string }[], attributes?: any[], marketingLabels?: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Process Attributes from DB
    const dbColors = attributes.filter(a => a.type === 'COLOR').map(a => a.value);
    const dbCategories = attributes.filter(a => a.type === 'CATEGORY').map(a => a.value);
    const dbFuel = attributes.filter(a => a.type === 'FUEL_TYPE').map(a => a.value);
    const dbBody = attributes.filter(a => a.type === 'BODY_STYLE').map(a => a.value);
    const dbDrivetrain = attributes.filter(a => a.type === 'DRIVETRAIN').map(a => a.value);

    // Use DB values if present, else fallback to constants
    const OPTION_COLORS = dbColors.length > 0 ? dbColors : VEHICLE_COLORS;
    const OPTION_CATEGORIES = dbCategories.length > 0 ? dbCategories : VEHICLE_CATEGORIES;
    const OPTION_FUEL = dbFuel.length > 0 ? dbFuel : VEHICLE_FUEL_TYPES;
    const OPTION_BODY = dbBody.length > 0 ? dbBody : VEHICLE_BODY_STYLES;
    const OPTION_DRIVETRAIN = dbDrivetrain.length > 0 ? dbDrivetrain : VEHICLE_DRIVETRAINS;

    const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set(initialData?.marketingLabels?.map((l: any) => l.id) || []));

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posting');
    const [loading, setLoading] = useState(false);
    const [decoding, setDecoding] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [descriptionType, setDescriptionType] = useState('Regular');
    const [images, setImages] = useState(initialData?.images || []);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isEditingDate, setIsEditingDate] = useState(false);

    // Inspection State
    const [inspections, setInspections] = useState(initialData?.inspections || []);
    const [isInspectionFormOpen, setIsInspectionFormOpen] = useState(false);
    const [editingInspection, setEditingInspection] = useState<any>(null);
    const [inspectionForm, setInspectionForm] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        info: '',
        needsMechanicalRecon: false,
        needsCosmeticRecon: false,
        mechanicalReconData: {} as Record<string, any>,
        cosmeticReconData: {} as Record<string, any>,
        priority: 'Normal',
        codes: [] as { code: string, description: string }[]
    });
    const [newCode, setNewCode] = useState({ code: '', description: '' });


    // Service History State
    const [serviceHistory, setServiceHistory] = useState<any[]>([]);

    // Audit History State
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [historyFilters, setHistoryFilters] = useState<{ startDate?: string, endDate?: string, field?: string, author?: string }>({});


    const [formData, setFormData] = useState(initialData || {
        // Core
        vin: '', stockNumber: '', year: new Date().getFullYear(), make: '', model: '', trim: '',
        bodyStyle: '', color: '', interiorColor: '', odometer: 0, condition: 'Used', status: 'PURCHASED', titleStatus: 'Clean', keyId: '',
        vehicleCaption: '', category: 'SUV', size: 'Midsize',

        // ... (rest of formData unrelated)
    });

    useEffect(() => {
        if (activeTab === 'service' && formData.vin) {
            getHistory(formData.vin).then(setServiceHistory);
        }
    }, [activeTab, formData.vin]);

    useEffect(() => {
        if (activeTab === 'history' && formData.vin) {
            setLoadingHistory(true);
            import('@/app/actions/vehicle').then(mod => {
                mod.getVehicleHistory(formData.vin, historyPage, 50, historyFilters).then(result => {
                    // Handle both old (array) and new (object) return types safely during refactor transition
                    if (Array.isArray(result)) {
                        setHistoryLogs(result);
                        setHistoryTotalPages(1);
                    } else {
                        setHistoryLogs(result.logs);
                        setHistoryTotalPages(result.pages);
                    }
                    setLoadingHistory(false);
                }).catch(err => {
                    console.error(err);
                    setLoadingHistory(false);
                });
            });
        }
    }, [activeTab, formData.vin, historyPage, historyFilters]);

    const getAge = (dateStr: string) => {
        if (!dateStr) return 0;
        const start = new Date(dateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(0, 0, 0, 0);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleDateSave = async () => {
        if (!formData.createdAt) return;
        setLoading(true);
        try {
            await updateVehicle(formData.vin, { ...formData, createdAt: formData.createdAt }, userId);
            setIsEditingDate(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Failed to update date');
        } finally {
            setLoading(false);
        }
    };

    const handleRevertChange = async (logId: string) => {
        if (!confirm('Are you sure you want to revert this change? This will overwrite the current field value.')) return;

        try {
            setLoadingHistory(true);
            const { revertVehicleChange } = await import('@/app/actions/vehicle');
            await revertVehicleChange(logId);
            alert('Change reverted successfully.');
            // Refresh
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Failed to revert change: ' + (error instanceof Error ? error.message : 'Unknown'));
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setFormData((prev: any) => {
            // For numbers, store string momentarily to allow "0.", ".5", and backspace to empty
            // We'll parse/round on blur
            const newValue = type === 'number' ? value : value;

            // Auto-strip leading zeros strictly if it's "0" followed by a number (e.g. "01" -> "1")
            // But allow "0." and "0" itself.
            let finalValue = newValue;
            if (type === 'number' && typeof newValue === 'string') {
                if (newValue.length > 1 && newValue.startsWith('0') && newValue[1] !== '.') {
                    finalValue = newValue.replace(/^0+/, '');
                }
            }

            const newData = {
                ...prev,
                [name]: finalValue
            };

            // Auto-set Stock Number from VIN (last 6 digits)
            if (name === 'vin' && value.length >= 6) {
                newData.stockNumber = value.slice(-6);
            }

            return newData;
        });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleDecode = async () => {
        if (!formData.vin || formData.vin.length < 17) {
            alert('Please enter a valid 17-character VIN');
            return;
        }

        setDecoding(true);
        try {
            const decoded = await decodeVin(formData.vin);
            if (decoded) {
                setFormData((prev: any) => ({
                    ...prev,
                    ...decoded,
                    vehicleEquipment: decoded.vehicleEquipment || prev.vehicleEquipment
                }));
            } else {
                alert('Could not decode VIN. Please check the number and try again.');
            }
        } catch (error) {
            console.error('VIN Decode Error:', error);
            alert(`Error decoding VIN: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setDecoding(false);
        }
    };

    const generateDescription = () => {
        let template = '';
        const summary = formData.vehicleCaption || '[quick summary in 10 words or less]';
        const oneOwnerText = formData.isOneOwner ? 'One owner vehicle, very well taken care of.' : '';
        const accidentText = 'Clean title. NEVER been in ANY accident! / Never been in any major accident!';

        // Common Footer
        const footer = `No dealership fees! Final price = out the door price + tax of your state!
${formData.warrantyAvailable ? 'Extended warranty is available for purchase!' : ''}
Nationwide shipping available - we handle everything so you don’t have to!`;

        if (descriptionType === 'Tesla') {
            template = `(SOME TIMES THESE CARS HAVE TAX TAKEN OFF THEIR PRICE - NEED TO MENTION IT THAT THE PRICE IS LOWER FOR BUYERS WHO QUALIFY (MOST DO))

$4000 TAX CREDIT ALREADY TAKEN OFF THE FULL PRICE OF $${formData.salePrice?.toLocaleString() || '0'} FOR QUALIFIED CUSTOMERS - MOST CUSTOMERS QUALIFY

This ${formData.year} ${formData.make} ${formData.model} ${formData.trim} is ${summary}

Runs and drives great / like new
${accidentText}
${oneOwnerText}

Walkaround video -

Key features:
- TESLA TRIM FEATURES, FSD, RANGE ETC
- ${formData.vehicleEquipment ? formData.vehicleEquipment.split('\n').slice(0, 3).join('\n- ') : 'other features'}
- if it has aftermarket changes list as well

Comes with the charger and all the cables!

${footer}`;
        } else if (descriptionType === 'Mechanic Special') {
            template = `THIS IS A MECHANIC SPECIAL - The car has EXPLAIN THE PROBLEM VAGUELY and is being sold as-is. It may require diagnostics and repairs. We recommend this unit for buyers with mechanical expertise or access to a trusted shop.

This ${formData.year} ${formData.make} ${formData.model} ${formData.trim} is ${summary}

${accidentText}
${oneOwnerText}

Walkaround video -

Key features:
- ${formData.engine} engine & ${formData.transmission} transmission
- ${formData.vehicleEquipment ? formData.vehicleEquipment.split('\n').slice(0, 3).join('\n- ') : 'other features'}
- if it has aftermarket changes list as well

${footer}`;
        } else {
            // Regular Car
            template = `This ${formData.year} ${formData.make} ${formData.model} ${formData.trim} is ${summary}

Runs and drives great / like new
${accidentText}
${oneOwnerText}

Walkaround video -

Key features:
- ${formData.engine} engine & ${formData.transmission} transmission
- ${formData.vehicleEquipment ? formData.vehicleEquipment.split('\n').slice(0, 3).join('\n- ') : 'other features'}
- if it has aftermarket changes list as well

${footer}`;
        }

        setFormData((prev: any) => ({ ...prev, vehicleCaption: template }));
    };

    const handleSyncImages = async () => {
        if (!formData.vin) {
            alert('Please save the vehicle with a VIN first (or enter a VIN).');
            return;
        }
        if (!formData.googleDriveUrl) return;

        setSyncing(true);
        try {
            // If it's a new vehicle, we might need to create it first? 
            // Or just ensure we have the VIN. The server action needs a VIN to link images.
            // If the vehicle doesn't exist in DB, we can't link images easily unless we create it.
            // For now, assume user has to save first or we just use the VIN if it's unique.
            // But the relation requires a Vehicle record.

            // Check if we need to save first
            if (!initialData) {
                const confirmSave = confirm('We need to save the vehicle first before syncing images. Save now?');
                if (confirmSave) {
                    await handleSubmit({ preventDefault: () => { } } as any);
                    // After save, initialData might still be null in this component state unless we reload or update it.
                    // But handleSubmit redirects... so maybe we shouldn't do this flow for new vehicles.
                    // Let's just warn them.
                    return;
                }
                return;
            }

            const result = await syncVehicleImages(formData.vin, formData.googleDriveUrl);
            if (result.success) {
                alert(result.message);
                // Update images state without reloading
                if (result.images) {
                    setImages(result.images);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Error syncing images: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setSyncing(false);
        }
    };

    const toggleVisibility = async (imageId: string, newStatus: boolean) => {
        console.log('Toggling visibility for:', imageId, 'New Status:', newStatus);
        // Optimistic update
        const newImages = images.map((img: any) =>
            img.id === imageId ? { ...img, isPublic: newStatus } : img
        );
        setImages(newImages);
        try {
            await toggleImageVisibility(formData.vin, imageId, newStatus);
            console.log('Toggle server action completed');
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
            // Revert on failure
            setImages(images);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';

        // Create a custom drag image (ghost)
        const target = e.target as HTMLElement;
        const img = target.querySelector('img');
        if (img) {
            e.dataTransfer.setDragImage(img, 20, 20);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndexStr = e.dataTransfer.getData('text/plain');
        if (!sourceIndexStr) return;

        const sourceIndex = parseInt(sourceIndexStr, 10);
        if (sourceIndex === targetIndex) return;

        const newImages = [...images];
        const [movedImage] = newImages.splice(sourceIndex, 1);
        newImages.splice(targetIndex, 0, movedImage);

        setImages(newImages);

        // Persist order immediately
        await reorderImages(formData.vin, newImages.map((img: any) => img.id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const requiredFields = ['vin', 'year', 'make', 'model', 'odometer'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

        if (missingFields.length > 0) {
            alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        setLoading(true);
        try {
            const labelIds = Array.from(selectedLabelIds);
            if (initialData) {
                // Include current images state to persist order/visibility
                await updateVehicle(initialData.vin, { ...formData, images }, userId, labelIds);
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push('/inventory');
                }
            } else {
                await createVehicle({ ...formData, images }, userId, labelIds);
                router.push('/inventory');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save vehicle');
        } finally {
            setLoading(false);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number' && value) {
            const floatVal = parseFloat(value);
            // Round to 2 decimal places
            const rounded = Math.round((floatVal + Number.EPSILON) * 100) / 100;
            setFormData((prev: any) => ({
                ...prev,
                [name]: rounded
            }));
        }
    };

    const tabs = [
        { id: 'posting', label: 'Posting' },
        { id: 'service', label: 'Service & Inspections' },
        { id: 'deposits', label: 'Customers & Deposits' },
        { id: 'accounting', label: 'Accounting & Costs' },
        { id: 'history', label: 'History' },
    ];

    // Accordion State
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        general: true,
        specs: false,
        financials: false,
        logistics: false,
        marketing: false,
        images: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const SectionHeader = ({ id, title }: { id: string, title: string }) => (
        <button
            type="button"
            onClick={() => toggleSection(id)}
            className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-t-lg border-b border-gray-200 hover:bg-gray-200 transition-colors mt-6 first:mt-0"
        >
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <svg
                className={`w-6 h-6 transform transition-transform ${expandedSections[id] ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );

    // Inspection Handlers
    const handleInspectionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vin) return alert('Please save vehicle first');

        setLoading(true);
        try {
            let result;
            if (editingInspection) {
                result = await updateInspection(editingInspection.id, inspectionForm);
            } else {
                result = await createInspection({ ...inspectionForm, vehicleVin: formData.vin });
            }

            if (!result || !result.success) {
                throw new Error(result?.error || 'Failed to save inspection');
            }

            if (result.warning) {
                alert(result.warning);
            }

            // Post-Sale Client Repair Logic
            if (formData.status === 'SOLD') {
                const confirmClient = confirm(
                    "This vehicle is SOLD. \n\n" +
                    "Do you want to create a Client Service Ticket? \n" +
                    "(Reminder: Major repairs should be done by 3rd party to save time.)"
                );

                if (confirmClient) {
                    const issues = [];
                    if (inspectionForm.needsMechanicalRecon) issues.push("Mechanical Recon");
                    if (inspectionForm.needsCosmeticRecon) issues.push("Cosmetic Recon");
                    let issueSummary = issues.length > 0 ? issues.join(' & ') : 'General Check';

                    // Parse detailed failures to append to description
                    const details: string[] = [];
                    const collectFailures = (data: Record<string, any>) => {
                        Object.entries(data).forEach(([item, val]) => {
                            const status = typeof val === 'string' ? val : val.status;
                            const notes = typeof val === 'string' ? '' : val.notes;
                            if (status === 'Fail' || status === 'Attention') {
                                details.push(`${item}: ${notes || status}`);
                            }
                        });
                    };
                    collectFailures(inspectionForm.mechanicalReconData);
                    collectFailures(inspectionForm.cosmeticReconData);

                    if (details.length > 0) {
                        issueSummary += `: ${details.join(', ')}`;
                    }

                    await createServiceTicket({
                        vehicleVin: formData.vin,
                        description: `Client Post-Sale Repair: ${issueSummary}${inspectionForm.info ? ` - ${inspectionForm.info}` : ''}`,
                        inspectionId: result.inspection.id,
                        priority: 'Critical',
                        tags: 'Client Car',
                        type: 'CLIENT_REQ'
                    });
                    // Force status update to be sure, though ticket creation might handle logic? 
                    // Actually status update logic is on COMPLETE, so here we might just set to IN_REPAIR if not already
                    await updateVehicle(formData.vin, { ...formData, status: 'IN_REPAIR' }, userId);
                    alert('Inspection saved & Client Service Ticket created!');
                }
            }
            // Standard Pre-Sale Logic
            else if (inspectionForm.needsMechanicalRecon || inspectionForm.needsCosmeticRecon) {
                // Service Ticket is automatically created/synced by the server action if NOT SOLD
                // We just need to ensure the vehicle status is updated
                await updateVehicle(formData.vin, { ...formData, status: 'INSPECTED' }, userId);
                alert('Inspection saved. Service Ticket created automatically.');
            } else {
                alert('Inspection saved.');
            }

            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Failed to save inspection');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCode = async () => {
        if (!newCode.code) return;

        let description = newCode.description;
        if (!description) {
            description = await getDiagnosticCodeDescription(newCode.code);
        }

        setInspectionForm(prev => ({
            ...prev,
            codes: [...prev.codes, { ...newCode, description }]
        }));
        setNewCode({ code: '', description: '' });
    };

    const handleRemoveCode = (index: number) => {
        setInspectionForm(prev => ({
            ...prev,
            codes: prev.codes.filter((_, i) => i !== index)
        }));
    };

    const startEditInspection = (inspection: any) => {
        setEditingInspection(inspection);
        setInspectionForm({
            name: inspection.name,
            date: new Date(inspection.date).toISOString().split('T')[0],
            info: inspection.info || '',
            needsMechanicalRecon: inspection.needsMechanicalRecon || false,
            needsCosmeticRecon: inspection.needsCosmeticRecon || false,
            mechanicalReconData: inspection.mechanicalReconData ? JSON.parse(inspection.mechanicalReconData) : {},
            cosmeticReconData: inspection.cosmeticReconData ? JSON.parse(inspection.cosmeticReconData) : {},
            priority: inspection.priority || 'Normal',
            codes: inspection.codes.map((c: any) => ({ code: c.code, description: c.description || '' }))
        });
        setIsInspectionFormOpen(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden font-sans text-gray-900">
            {/* Header Info */}
            <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-start gap-6">
                {/* Thumbnail */}
                <div className="w-32 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-300">
                    {initialData?.images && initialData.images.length > 0 ? (
                        <img
                            src={`/api/images/${initialData.images[0].driveId}?thumbnail=true`}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                            No Image
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {formData.year} {formData.make} {formData.model} {formData.trim}
                            </h1>
                            <div className="flex items-center gap-3 mt-1 test-sm text-gray-500">
                                <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-700">{formData.vin || 'NO VIN'}</span>
                                <span>•</span>
                                <span>{formData.status}</span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            {initialData?.lot && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                                    {initialData.lot.name}
                                </span>
                            )}
                            <div className="text-xs text-gray-500">
                                {isEditingDate ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="date"
                                            value={formData.createdAt ? new Date(formData.createdAt).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setFormData((prev: any) => ({ ...prev, createdAt: e.target.value }))}
                                            className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                                        />
                                        <button onClick={handleDateSave} className="text-green-600 hover:text-green-800 font-bold">✓</button>
                                        <button onClick={() => setIsEditingDate(false)} className="text-red-600 hover:text-red-800">✕</button>
                                    </div>
                                ) : (
                                    <div className="group flex items-center gap-1 cursor-pointer" onClick={() => setIsEditingDate(true)} title="Click to edit date">
                                        <span>Added: {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : (initialData?.createdAt ? new Date(initialData.createdAt).toLocaleDateString() : 'New')}</span>
                                        <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </div>
                                )}
                                <span className="mx-1">•</span>
                                <span>Age: {getAge(formData.createdAt || initialData?.createdAt)} Days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-between items-center border-b border-gray-200 px-4">
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 py-2">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('service');
                            setEditingInspection(null);
                            setInspectionForm({
                                name: '',
                                date: new Date().toISOString().split('T')[0],
                                info: '',
                                needsMechanicalRecon: false,
                                needsCosmeticRecon: false,
                                mechanicalReconData: {},
                                cosmeticReconData: {},
                                priority: 'Normal', // NEW
                                codes: []
                            });
                            setIsInspectionFormOpen(true);
                        }}
                        disabled={!formData.vin || !initialData}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        + Inspection
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('deposits');
                            setIsDepositModalOpen(true);
                        }}
                        disabled={!formData.vin || !initialData}
                        className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                    >
                        + Deposit
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
                {/* Posting Tab (Consolidated) */}
                {activeTab === 'posting' && (
                    <div className="space-y-4">
                        {/* General Info Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <SectionHeader id="general" title="General Info" />
                            {expandedSections.general && (
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                            <Input label="VIN" name="vin" value={formData.vin} onChange={handleChange} required />
                                            <div className="mb-1">
                                                <button
                                                    type="button"
                                                    onClick={handleDecode}
                                                    disabled={decoding}
                                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {decoding ? 'Decoding...' : 'Decode VIN'}
                                                </button>
                                            </div>
                                            <Select label="Status" name="status" value={formData.status} onChange={handleChange} options={['PURCHASED', 'DELIVERED', 'INSPECTED', 'IN_REPAIR', 'REPAIRED', 'DETAILED', 'PICTURED', 'POSTED', 'SOLD']} />
                                            <Input label="Condition" name="condition" value={formData.condition} onChange={handleChange} placeholder="e.g. Used, New, Excellent" />
                                        </div>

                                        <Input label="Trim" name="trim" value={formData.trim} onChange={handleChange} />
                                        <Input label="Year" name="year" type="number" value={formData.year} onChange={handleChange} required />
                                        <Input label="Make" name="make" value={formData.make} onChange={handleChange} required />
                                        <Input label="Model" name="model" value={formData.model} onChange={handleChange} required />

                                        <div className="col-span-3">
                                            <Input label="SEO Title / Short Caption" name="seoTitle" value={formData.seoTitle} onChange={handleChange} />
                                        </div>

                                        <Input label="Engine" name="engine" value={formData.engine} onChange={handleChange} />
                                        <Input label="Engine Size" name="engineSize" value={formData.engineSize} onChange={handleChange} />
                                        <Input label="Engine Cyls" name="engineCylinders" type="number" value={formData.engineCylinders} onChange={handleChange} />

                                        <Input label="Transmission" name="transmission" value={formData.transmission} onChange={handleChange} />
                                        <Select label="Trans Type" name="transmissionType" value={formData.transmissionType} onChange={handleChange} options={['Automatic', 'Manual', 'CVT']} />
                                        <Input label="Trans Speeds" name="transmissionSpeeds" type="number" value={formData.transmissionSpeeds} onChange={handleChange} />

                                        <div className="col-span-1 md:col-span-3 mt-4">
                                            <h3 className="text-lg font-bold mb-4 text-gray-800">Vehicle Details</h3>
                                        </div>
                                        <Input label="Miles" name="odometer" type="number" value={formData.odometer} onChange={handleChange} required />
                                        <Input label="Stock Number" name="stockNumber" value={formData.stockNumber} onChange={handleChange} />
                                        <div className="flex items-end mb-2">
                                            <Toggle label="Title (Yes/No)" name="hasTitle" checked={formData.hasTitle} onChange={handleCheckboxChange} />
                                        </div>

                                        <Select label="Body" name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} options={OPTION_BODY} />
                                        <Input label="Doors" name="doors" type="number" value={formData.doors} onChange={handleChange} />
                                        <Select label="Fuel" name="fuelType" value={formData.fuelType} onChange={handleChange} options={OPTION_FUEL} />
                                        <Select label="Drive Train" name="driveTrain" value={formData.driveTrain} onChange={handleChange} options={OPTION_DRIVETRAIN} />

                                        <Select label="Size" name="size" value={formData.size} onChange={handleChange} options={['Compact', 'Midsize', 'Fullsize', 'Large']} />
                                        <Select label="Category" name="category" value={formData.category} onChange={handleChange} options={OPTION_CATEGORIES} />

                                        <Input label="City MPG" name="cityMpg" type="number" value={formData.cityMpg} onChange={handleChange} />
                                        <Input label="Highway MPG" name="highwayMpg" type="number" value={formData.highwayMpg} onChange={handleChange} />

                                        <Input label="Exterior OEM Color" name="exteriorOemColor" value={formData.exteriorOemColor} onChange={handleChange} />
                                        <Input label="Interior OEM Color" name="interiorOemColor" value={formData.interiorOemColor} onChange={handleChange} />

                                        <Select label="Exterior Color" name="color" value={formData.color} onChange={handleChange} options={OPTION_COLORS} />
                                        <Select label="Interior Color" name="interiorColor" value={formData.interiorColor} onChange={handleChange} options={OPTION_COLORS} />

                                        <div className="col-span-1 md:col-span-3 mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sales Notes (Internal)</label>
                                            <textarea
                                                name="salesNotes"
                                                value={formData.salesNotes || ''}
                                                onChange={handleChange}
                                                rows={3}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                placeholder="Private notes for sales team..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Specs & Equipment Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <SectionHeader id="specs" title="Specs & Equipment" />
                            {expandedSections.specs && (
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Equipment</label>
                                            <textarea
                                                name="vehicleEquipment"
                                                value={formData.vehicleEquipment}
                                                onChange={handleChange}
                                                rows={15}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Window Sticker Equipment List</label>
                                            <textarea
                                                name="windowStickerEquipment"
                                                value={formData.windowStickerEquipment}
                                                onChange={handleChange}
                                                rows={15}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Financials Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <SectionHeader id="financials" title="Pricing & Financials" />
                            {expandedSections.financials && (
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <Input
                                            label="Base Price (Regular)"
                                            name="regularPrice"
                                            type="number"
                                            value={formData.regularPrice}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        <Input
                                            label="Current Price (Sale)"
                                            name="salePrice"
                                            type="number"
                                            value={formData.salePrice}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        <Input
                                            label="Cash Price"
                                            name="cashPrice"
                                            type="number"
                                            value={formData.cashPrice}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        <Input
                                            label="Export / Feed Price"
                                            name="exportPrice"
                                            type="number"
                                            value={formData.exportPrice}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />

                                        <div className="col-span-4 border-t border-gray-100 my-2"></div>
                                        <div className="col-span-4 mb-2">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Price Analysis & Suggestions</h4>
                                        </div>

                                        <div className="col-span-2 flex items-end gap-2">
                                            <Input
                                                label="Current Suggested Price"
                                                name="suggestedPrice"
                                                type="number"
                                                value={formData.suggestedPrice || 0}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled // Read-only for now as per requirements
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData((prev: any) => ({ ...prev, salePrice: prev.suggestedPrice || 0 }));
                                                }}
                                                className="mb-[2px] bg-blue-600 text-white px-3 py-2 rounded shadow hover:bg-blue-700 text-sm whitespace-nowrap h-[42px]"
                                            >
                                                Add to Current Price
                                            </button>
                                        </div>

                                        <div className="col-span-2"></div>

                                        <Input label="Carfax Price" name="carfaxPrice" type="number" value={formData.carfaxPrice} onChange={handleChange} onBlur={handleBlur} />
                                        <Input label="Cars.com Price" name="carsDotComPrice" type="number" value={formData.carsDotComPrice} onChange={handleChange} onBlur={handleBlur} />
                                        <Input label="Cargurus Price" name="cargurusPrice" type="number" value={formData.cargurusPrice} onChange={handleChange} onBlur={handleBlur} />

                                        <div className="col-span-4 border-t border-gray-100 my-2"></div>
                                        <div className="col-span-4 mb-2">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Book Values</h4>
                                        </div>

                                        <Input label="Blue Book" name="blueBook" type="number" value={formData.blueBook} onChange={handleChange} onBlur={handleBlur} />
                                        <Input label="Black Book" name="blackBook" type="number" value={formData.blackBook} onChange={handleChange} onBlur={handleBlur} />
                                        <Input label="Edmunds Book" name="edmundsBook" type="number" value={formData.edmundsBook} onChange={handleChange} onBlur={handleBlur} />
                                        <Input label="NADA Book" name="nadaBook" type="number" value={formData.nadaBook} onChange={handleChange} onBlur={handleBlur} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logistics Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <SectionHeader id="logistics" title="Logistics" />
                            {expandedSections.logistics && (
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Lot Selection - Only if multiple lots available */}
                                        {availableLots.length > 0 && (
                                            <div className="col-span-1 md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lot</label>
                                                <select
                                                    name="lotId"
                                                    value={formData.lotId || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, lotId: e.target.value }))}
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                >
                                                    <option value="">-- Select Lot --</option>
                                                    {availableLots.map(lot => (
                                                        <option key={lot.id} value={lot.id}>{lot.name}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">Move this vehicle to another lot (if authorized).</p>
                                            </div>
                                        )}

                                        <div className="col-span-1 md:col-span-2">
                                            <Toggle label="Guarantee (Green Highlight)" name="hasGuarantee" checked={formData.hasGuarantee} onChange={handleCheckboxChange} />
                                        </div>

                                        <div className="col-span-1 md:col-span-2 mt-4">
                                            <h3 className="text-lg font-bold mb-4 text-gray-800">Manufacture Details</h3>
                                        </div>
                                        <Input label="Plant City" name="plantCity" value={formData.plantCity || ''} onChange={handleChange} />
                                        <Input label="Plant State" name="plantState" value={formData.plantState || ''} onChange={handleChange} />
                                        <Input label="Plant Country" name="plantCountry" value={formData.plantCountry || ''} onChange={handleChange} />
                                        <Input label="Gross Weight (GVWR)" name="grossWeight" value={formData.grossWeight || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Marketing Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <SectionHeader id="marketing" title="Marketing & SEO" />
                            {expandedSections.marketing && (
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <div className="space-y-6">
                                        <div className="col-span-1 md:col-span-3">
                                            <h3 className="text-lg font-bold mb-4 text-gray-800">Auto Text Description Builder</h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                            {marketingLabels.length === 0 ? (
                                                <div className="col-span-3 text-center text-gray-500 italic py-4">
                                                    No marketing labels found. Admins can add them in Settings.
                                                </div>
                                            ) : (
                                                marketingLabels.map((label: any) => (
                                                    <div
                                                        key={label.id}
                                                        className={`flex items-center space-x-3 border p-3 rounded-lg cursor-pointer transition-all ${selectedLabelIds.has(label.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}
                                                        onClick={() => {
                                                            const newSet = new Set(selectedLabelIds);
                                                            if (newSet.has(label.id)) {
                                                                newSet.delete(label.id);
                                                            } else {
                                                                newSet.add(label.id);
                                                            }
                                                            setSelectedLabelIds(newSet);
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedLabelIds.has(label.id)}
                                                            readOnly
                                                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 pointer-events-none"
                                                        />
                                                        <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: label.colorCode }}></div>
                                                        <span className="text-sm font-medium text-gray-700 select-none">{label.name}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="flex gap-4 items-end mb-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description Template</label>
                                                <select
                                                    value={descriptionType}
                                                    onChange={(e) => setDescriptionType(e.target.value)}
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                                >
                                                    <option value="Regular">Regular Car</option>
                                                    <option value="Tesla">Tesla</option>
                                                    <option value="Mechanic Special">Mechanic Special</option>
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={generateDescription}
                                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 h-10"
                                            >
                                                Generate Description
                                            </button>
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Description (Public)</label>
                                            <textarea
                                                name="vehicleCaption"
                                                value={formData.vehicleCaption}
                                                onChange={handleChange}
                                                rows={12}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Media Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <SectionHeader id="images" title="Media" />
                            {expandedSections.images && (
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input label="Walkaround Video URL (YouTube)" name="walkaroundVideo" value={formData.walkaroundVideo} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
                                            <Input label="Test Drive Video URL (YouTube)" name="testDriveVideo" value={formData.testDriveVideo} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." />
                                        </div>

                                        <div className="flex flex-col">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Folder Link</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="googleDriveUrl"
                                                    value={formData.googleDriveUrl || ''}
                                                    onChange={handleChange}
                                                    placeholder="https://drive.google.com/drive/folders/..."
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900 flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSyncImages}
                                                    disabled={syncing || !formData.googleDriveUrl}
                                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {syncing ? 'Syncing...' : 'Sync Images'}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Paste the link to the Google Drive folder containing the vehicle images.</p>
                                        </div>

                                        <div className="mt-6">
                                            <h3 className="text-lg font-bold mb-4 text-gray-800">Vehicle Images ({images.length})</h3>

                                            {images.length === 0 ? (
                                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                    <p className="text-gray-500">No images synced yet. Add a Drive Link and click Sync.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {images.map((img: any, index: number) => (
                                                        <div
                                                            key={img.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, index)}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, index)}
                                                            className={`relative group border rounded-lg overflow-hidden cursor-move transition-all duration-200 ${!img.isPublic ? 'opacity-60 grayscale' : ''} hover:shadow-lg active:scale-95`}
                                                        >
                                                            <div className="aspect-w-4 aspect-h-3 bg-gray-200 pointer-events-none">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={`/api/images/${img.driveId}?thumbnail=true`}
                                                                    alt={img.name}
                                                                    className="object-cover w-full h-full select-none"
                                                                />
                                                            </div>
                                                            <div className="absolute top-0 right-0 p-1 bg-black bg-opacity-50 text-white text-xs pointer-events-none z-10">
                                                                {index + 1}
                                                            </div>
                                                            <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-2 flex justify-center items-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent drag start if clicked here (though button handles it)
                                                                        toggleVisibility(img.id, !img.isPublic);
                                                                    }}
                                                                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${img.isPublic
                                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                        }`}
                                                                >
                                                                    {img.isPublic ? 'Visible' : 'Hidden'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* Service & Inspections Tab */}
                {activeTab === 'service' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Service & Inspections</h3>
                            {!isInspectionFormOpen && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingInspection(null);
                                        setInspectionForm({
                                            name: userName || '',
                                            date: new Date().toISOString().split('T')[0],
                                            info: '',
                                            needsMechanicalRecon: false,
                                            needsCosmeticRecon: false,
                                            mechanicalReconData: {},
                                            cosmeticReconData: {},
                                            priority: 'Normal', // NEW
                                            codes: []
                                        });
                                        setIsInspectionFormOpen(true);
                                    }}
                                    disabled={!formData.vin || !initialData}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    + Add Inspection
                                </button>
                            )}
                        </div>

                        {isInspectionFormOpen ? (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h4 className="text-md font-bold mb-4">{editingInspection ? 'Edit Inspection' : 'New Inspection'}</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <Input label="Date" name="date" type="date" value={inspectionForm.date} onChange={(e: any) => setInspectionForm({ ...inspectionForm, date: e.target.value })} required />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select
                                            value={inspectionForm.priority || 'Normal'}
                                            onChange={(e) => setInspectionForm({ ...inspectionForm, priority: e.target.value })}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Normal">Normal</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Info</label>
                                    <textarea
                                        value={inspectionForm.info}
                                        onChange={(e) => setInspectionForm({ ...inspectionForm, info: e.target.value })}
                                        rows={3}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                    />
                                </div>

                                <div className="mb-4 space-y-4 border-t border-gray-200 pt-4">
                                    <div className="flex gap-6">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={inspectionForm.needsMechanicalRecon}
                                                onChange={(e) => setInspectionForm({ ...inspectionForm, needsMechanicalRecon: e.target.checked })}
                                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            />
                                            <span className="font-medium text-gray-700">Need Mechanical Recon</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={inspectionForm.needsCosmeticRecon}
                                                onChange={(e) => setInspectionForm({ ...inspectionForm, needsCosmeticRecon: e.target.checked })}
                                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            />
                                            <span className="font-medium text-gray-700">Need Cosmetic Recon</span>
                                        </label>
                                    </div>

                                    {inspectionForm.needsMechanicalRecon && (
                                        <div className="bg-white p-4 rounded border border-gray-200">
                                            <h5 className="font-bold mb-3 text-gray-800">Mechanical Checklist</h5>
                                            <div className="space-y-4">
                                                {['Engine', 'Transmission', 'Brakes', 'Tires', 'Suspension', 'Electrical', 'AC/Heat', 'Fluids'].map(item => {
                                                    const itemData = inspectionForm.mechanicalReconData[item] || { status: 'Pass', notes: '' };
                                                    const status = typeof itemData === 'string' ? itemData : itemData.status || 'Pass';
                                                    const notes = typeof itemData === 'string' ? '' : itemData.notes || '';

                                                    return (
                                                        <div key={item} className="border-b border-gray-100 pb-4 last:border-0">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-medium text-gray-700">{item}</span>
                                                                <div className="flex bg-gray-100 rounded p-1">
                                                                    {['Pass', 'Attention', 'Fail'].map(option => (
                                                                        <button
                                                                            key={option}
                                                                            type="button"
                                                                            onClick={() => setInspectionForm({
                                                                                ...inspectionForm,
                                                                                mechanicalReconData: {
                                                                                    ...inspectionForm.mechanicalReconData,
                                                                                    [item]: { status: option, notes }
                                                                                }
                                                                            })}
                                                                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${status === option
                                                                                ? (option === 'Pass' ? 'bg-green-500 text-white' : option === 'Attention' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white')
                                                                                : 'text-gray-500 hover:bg-gray-200'
                                                                                }`}
                                                                        >
                                                                            {option}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                placeholder={`Notes for ${item}...`}
                                                                value={notes}
                                                                onChange={(e) => setInspectionForm({
                                                                    ...inspectionForm,
                                                                    mechanicalReconData: {
                                                                        ...inspectionForm.mechanicalReconData,
                                                                        [item]: { status, notes: e.target.value }
                                                                    }
                                                                })}
                                                                rows={1}
                                                                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {inspectionForm.needsCosmeticRecon && (
                                        <div className="bg-white p-4 rounded border border-gray-200">
                                            <h5 className="font-bold mb-3 text-gray-800">Cosmetic Recon</h5>
                                            <div className="space-y-4">
                                                {['Paint', 'Body', 'Glass', 'Wheels', 'Interior', 'Upholstery', 'Detailing'].map(item => {
                                                    const itemData = inspectionForm.cosmeticReconData[item] || { status: 'Pass', notes: '' };
                                                    const status = typeof itemData === 'string' ? itemData : itemData.status || 'Pass';
                                                    const notes = typeof itemData === 'string' ? '' : itemData.notes || '';

                                                    return (
                                                        <div key={item} className="border-b border-gray-100 pb-4 last:border-0">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-medium text-gray-700">{item}</span>
                                                                <div className="flex bg-gray-100 rounded p-1">
                                                                    {['Pass', 'Attention', 'Fail'].map(option => (
                                                                        <button
                                                                            key={option}
                                                                            type="button"
                                                                            onClick={() => setInspectionForm({
                                                                                ...inspectionForm,
                                                                                cosmeticReconData: {
                                                                                    ...inspectionForm.cosmeticReconData,
                                                                                    [item]: { status: option, notes }
                                                                                }
                                                                            })}
                                                                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${status === option
                                                                                ? (option === 'Pass' ? 'bg-green-500 text-white' : option === 'Attention' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white')
                                                                                : 'text-gray-500 hover:bg-gray-200'
                                                                                }`}
                                                                        >
                                                                            {option}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <textarea
                                                                placeholder={`Notes for ${item}...`}
                                                                value={notes}
                                                                onChange={(e) => setInspectionForm({
                                                                    ...inspectionForm,
                                                                    cosmeticReconData: {
                                                                        ...inspectionForm.cosmeticReconData,
                                                                        [item]: { status, notes: e.target.value }
                                                                    }
                                                                })}
                                                                rows={1}
                                                                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Diagnostic Codes</label>
                                    <div className="flex gap-2 mb-2">
                                        <div className="w-1/3">
                                            <input
                                                type="text"
                                                placeholder="Code (e.g. P0300)"
                                                value={newCode.code}
                                                onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={newCode.description}
                                                onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddCode}
                                            className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {inspectionForm.codes.map((code, index) => (
                                            <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                                                <span className="font-mono font-bold text-sm">{code.code}</span>
                                                <span className="text-sm text-gray-600 flex-1 mx-4">{code.description}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCode(index)}
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInspectionFormOpen(false)}
                                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleInspectionSubmit}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Save Inspection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    {!initialData ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <p className="text-gray-500">Please save the vehicle first to manage service and inspections.</p>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Existing Inspections */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Inspections</h3>
                                    {inspections.length === 0 ? (
                                        <p className="text-gray-500 text-sm italic">No inspections found.</p>
                                    ) : (
                                        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                                            <ul className="divide-y divide-gray-200">
                                                {inspections.map((inspection: any) => {
                                                    // Parse failed items
                                                    const failedItems: any[] = [];
                                                    const parseRecon = (dataStr: string | null, type: string) => {
                                                        if (!dataStr) return;
                                                        try {
                                                            const data = JSON.parse(dataStr);
                                                            Object.entries(data).forEach(([item, details]: [string, any]) => {
                                                                if (details.status === 'Fail' || details.status === 'Attention') {
                                                                    failedItems.push({ item, ...details, type });
                                                                }
                                                            });
                                                        } catch (e) { }
                                                    };
                                                    parseRecon(inspection.mechanicalReconData, 'Mechanical');
                                                    parseRecon(inspection.cosmeticReconData, 'Cosmetic');

                                                    return (
                                                        <li key={inspection.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                                            <div className="flex flex-col space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-indigo-600 truncate">{inspection.name}</p>
                                                                        <p className="text-sm text-gray-500">{new Date(inspection.date).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => startEditInspection(inspection)}
                                                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                if (confirm('Are you sure you want to delete this inspection?')) {
                                                                                    await deleteInspection(inspection.id, formData.vin);
                                                                                    setInspections((prev: any[]) => prev.filter((i: any) => i.id !== inspection.id));
                                                                                }
                                                                            }}
                                                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Failed Items & Codes */}
                                                                {(failedItems.length > 0 || (inspection.codes && inspection.codes.length > 0)) && (
                                                                    <div className="bg-red-50 p-3 rounded-md border border-red-100">
                                                                        <h5 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2">Attention Needed</h5>

                                                                        {failedItems.length > 0 && (
                                                                            <ul className="list-disc list-inside text-sm text-red-700 mb-2">
                                                                                {failedItems.map((fail, idx) => (
                                                                                    <li key={idx}>
                                                                                        <span className="font-medium">{fail.item}</span> ({fail.status})
                                                                                        {fail.notes && <span className="text-gray-600 ml-1">- {fail.notes}</span>}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}

                                                                        {inspection.codes && inspection.codes.length > 0 && (
                                                                            <div className="mt-2">
                                                                                <p className="text-xs font-semibold text-red-800 mb-1">Diagnostic Codes:</p>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {inspection.codes.map((code: any) => (
                                                                                        <span key={code.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                                            {code.code}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Service History Log */}
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Service History Log</h3>
                                    {
                                        serviceHistory.length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">No completed service history found.</p>
                                        ) : (
                                            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tech</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {serviceHistory.map((ticket) => (
                                                            <tr key={ticket.id}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {new Date(ticket.updatedAt).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                                    {ticket.description}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {ticket.tech?.name || 'Unassigned'}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                        {ticket.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                    <a href={`/service/${ticket.id}`} className="text-indigo-600 hover:text-indigo-900">View</a>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {
                    activeTab === 'deposits' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Customers & Deposits</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsDepositModalOpen(true)}
                                    disabled={!formData.vin || !initialData}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                                >
                                    + Add Deposit
                                </button>
                            </div>

                            {!initialData ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-gray-500">Please save the vehicle first to manage deposits.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.deposits && formData.deposits.length > 0 ? (
                                        formData.deposits.map((deposit: any) => (
                                            <div key={deposit.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg">{deposit.buyerName}</h4>
                                                        <p className="text-sm text-gray-500">Method: {deposit.method}</p>
                                                        <p className="text-sm text-gray-500">Date: {new Date(deposit.date).toLocaleDateString()}</p>
                                                        {deposit.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{deposit.notes}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-green-600">${deposit.amount.toLocaleString()}</p>
                                                        <p className="text-sm text-red-500 font-medium">Expires: {new Date(deposit.expiryDate).toLocaleDateString()}</p>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (confirm('Are you sure you want to delete this deposit?')) {
                                                                    await deleteDeposit(deposit.id, formData.vin);
                                                                    window.location.reload();
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-800 text-sm mt-2 underline"
                                                        >
                                                            Delete Deposit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <p className="text-gray-500">No active deposits.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Accounting & Costs Tab */}
                {activeTab === 'accounting' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-bold mb-4 text-gray-800">Vehicle P&L Analysis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Costs */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Costs</h4>
                                    <Input label="Purchase Price" name="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleChange} onBlur={handleBlur} />
                                    <Input label="Cost of Purchase (Fee)" name="purchaseFee" type="number" value={formData.purchaseFee} onChange={handleChange} onBlur={handleBlur} />
                                    <Input label="Service / Repair Cost" name="repairCost" type="number" value={formData.repairCost} onChange={handleChange} onBlur={handleBlur} />
                                    <Input label="Cost Per Lead" name="costPerLead" type="number" value={formData.costPerLead} onChange={handleChange} onBlur={handleBlur} />
                                    <Input label="Floorplan / Financing" name="floorplanCost" type="number" value={formData.floorplanCost} onChange={handleChange} onBlur={handleBlur} />
                                    <Input label="Transportation / Delivery" name="transportationCost" type="number" value={formData.transportationCost} onChange={handleChange} onBlur={handleBlur} />
                                    <Input label="Other Vehicle Cost" name="vehicleCost" type="number" value={formData.vehicleCost} onChange={handleChange} onBlur={handleBlur} />
                                </div>

                                {/* Financial Snapshot Panel (Right Side) */}
                                <div className="col-span-1 md:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h4 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        Financial Snapshot
                                    </h4>

                                    {/* Profit Card */}
                                    <div className={`p-5 rounded-lg border-l-4 mb-6 shadow-sm bg-white ${(Number(formData.salePrice || 0) - (Number(formData.purchasePrice || 0) + Number(formData.purchaseFee || 0) + Number(formData.repairCost || 0) + Number(formData.costPerLead || 0) + Number(formData.floorplanCost || 0) + Number(formData.transportationCost || 0) + Number(formData.vehicleCost || 0))) >= 0
                                        ? 'border-green-500'
                                        : 'border-red-500'
                                        }`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Net Profit</p>
                                                <div className={`text-3xl font-extrabold mt-1 ${(Number(formData.salePrice || 0) - (Number(formData.purchasePrice || 0) + Number(formData.purchaseFee || 0) + Number(formData.repairCost || 0) + Number(formData.costPerLead || 0) + Number(formData.floorplanCost || 0) + Number(formData.transportationCost || 0) + Number(formData.vehicleCost || 0))) >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    ${(Number(formData.salePrice || 0) - (Number(formData.purchasePrice || 0) + Number(formData.purchaseFee || 0) + Number(formData.repairCost || 0) + Number(formData.costPerLead || 0) + Number(formData.floorplanCost || 0) + Number(formData.transportationCost || 0) + Number(formData.vehicleCost || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 mb-1">Sale Price</p>
                                                <p className="font-semibold text-gray-700">${Number(formData.salePrice || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white p-3 rounded border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Total Costs</p>
                                            <p className="text-lg font-bold text-gray-800">
                                                ${(Number(formData.purchasePrice || 0) + Number(formData.purchaseFee || 0) + Number(formData.repairCost || 0) + Number(formData.costPerLead || 0) + Number(formData.floorplanCost || 0) + Number(formData.transportationCost || 0) + Number(formData.vehicleCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Days in Stock</p>
                                            <p className="text-lg font-bold text-gray-800">
                                                {initialData?.createdAt
                                                    ? Math.floor((new Date().getTime() - new Date(initialData.createdAt).getTime()) / (1000 * 3600 * 24))
                                                    : 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Depreciation Analysis */}
                                    <div className="space-y-4">
                                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-sm font-semibold text-orange-800">Est. Depreciation</p>
                                                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">$40 / day</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-xl font-bold text-orange-900">
                                                    -${((initialData?.createdAt
                                                        ? Math.floor((new Date().getTime() - new Date(initialData.createdAt).getTime()) / (1000 * 3600 * 24))
                                                        : 0) * 40).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input label="Wholesale Price" name="wholesalePrice" type="number" value={formData.wholesalePrice} onChange={handleChange} onBlur={handleBlur} />
                                <Input label="Bottom Line Price" name="bottomLinePrice" type="number" value={formData.bottomLinePrice} onChange={handleChange} onBlur={handleBlur} />
                            </div>

                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                            <h3 className="text-lg font-bold text-gray-800">Audit Log & History</h3>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                                <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-1 bg-white">
                                    <span className="text-gray-400 text-xs text-nowrap">From:</span>
                                    <input
                                        type="date"
                                        className="text-sm text-gray-700 outline-none w-28"
                                        value={historyFilters.startDate || ''}
                                        onChange={(e) => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-1 bg-white">
                                    <span className="text-gray-400 text-xs text-nowrap">To:</span>
                                    <input
                                        type="date"
                                        className="text-sm text-gray-700 outline-none w-28"
                                        value={historyFilters.endDate || ''}
                                        onChange={(e) => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="User..."
                                    className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 w-24"
                                    value={historyFilters.author || ''}
                                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, author: e.target.value }))}
                                />
                                <input
                                    type="text"
                                    placeholder="Field..."
                                    className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 w-24"
                                    value={historyFilters.field || ''}
                                    onChange={(e) => setHistoryFilters(prev => ({ ...prev, field: e.target.value }))}
                                />
                                {(historyFilters.startDate || historyFilters.endDate || historyFilters.author || historyFilters.field) && (
                                    <button
                                        onClick={() => setHistoryFilters({})}
                                        className="text-xs text-red-600 hover:text-red-800 underline ml-1"
                                    > (Clear) </button>
                                )}
                            </div>
                        </div>

                        {loadingHistory ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                                <p className="text-gray-500 text-sm">Loading history...</p>
                            </div>
                        ) : historyLogs.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-gray-500">No history found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <table className="min-w-full">
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {Object.entries(historyLogs.reduce((groups: Record<string, any[]>, log: any) => {
                                                const date = new Date(log.timestamp);
                                                const key = `${date.toLocaleDateString()} ${date.getHours()}:${(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()} - ${log.userName}`;
                                                if (!groups[key]) groups[key] = [];
                                                groups[key].push(log);
                                                return groups;
                                            }, {})).map(([groupKey, logs]: [string, any[]]) => {
                                                const [timeStr, userStr] = groupKey.split(' - ');
                                                return (
                                                    <tr key={groupKey}>
                                                        <td className="p-0">
                                                            <div className="w-full">
                                                                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-l-4 border-blue-400">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-gray-800 text-sm">{userStr}</span>
                                                                        <span className="text-gray-400 text-xs">•</span>
                                                                        <span className="text-gray-500 text-xs font-mono">{timeStr}</span>
                                                                    </div>
                                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-sm">
                                                                        {logs.length} update{logs.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="divide-y divide-gray-50">
                                                                    {logs.map(log => (
                                                                        <div key={log.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                                            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 w-32 justify-center border border-blue-100 shrink-0">
                                                                                    {log.field}
                                                                                </span>
                                                                                <div className="flex items-center text-sm gap-3 overflow-hidden">
                                                                                    <span className="text-red-400 line-through truncate max-w-[120px] md:max-w-[200px]" title={log.oldValue}>{log.oldValue || '—'}</span>
                                                                                    <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                                                    <span className="text-green-600 font-semibold truncate max-w-[120px] md:max-w-[200px]" title={log.newValue}>{log.newValue || '—'}</span>
                                                                                </div>
                                                                            </div>
                                                                            {log.field !== 'CREATION' && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRevertChange(log.id)}
                                                                                    className="ml-4 text-xs font-medium text-gray-500 hover:text-red-600 underline opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                >
                                                                                    Revert
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <span className="text-sm text-gray-500">
                                        Page <span className="font-medium text-gray-900">{historyPage}</span> of <span className="font-medium text-gray-900">{historyTotalPages || 1}</span>
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                            disabled={historyPage <= 1}
                                            className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                                            disabled={historyPage >= historyTotalPages}
                                            className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
                    <div>
                        {initialData && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (confirm('Are you sure you want to archive this vehicle? It will be removed from the active inventory.')) {
                                        setLoading(true);
                                        try {
                                            await deleteVehicle(initialData.vin);
                                            router.push('/inventory');
                                        } catch (error) {
                                            console.error(error);
                                            alert('Failed to delete vehicle');
                                            setLoading(false);
                                        }
                                    }
                                }}
                                className="bg-red-50 py-2 px-4 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete Vehicle
                            </button>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (initialData ? 'Update Vehicle' : 'Create Vehicle')}
                        </button>
                    </div>
                </div>

            </form>

            {initialData && (
                <DepositModal
                    vehicle={initialData}
                    isOpen={isDepositModalOpen}
                    onClose={() => {
                        setIsDepositModalOpen(false);
                        window.location.reload(); // Refresh to show new deposit
                    }}
                />
            )}
        </div >
    );
}

// Helper Components
function Input({ label, name, type = "text", value, onChange, required = false, placeholder = "" }: any) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                id={name}
                value={value ?? ''}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
            />
        </div>
    );
}

function Select({ label, name, value, onChange, options }: any) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                name={name}
                id={name}
                value={value ?? ''}
                onChange={onChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border text-gray-900"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

function Toggle({ label, name, checked, onChange }: any) {
    return (
        <div className="flex items-center space-x-3 py-2">
            <button
                type="button"
                onClick={() => onChange({ target: { name, checked: !checked } })}
                className={`${checked ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
                <span
                    aria-hidden="true"
                    className={`${checked ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
            </button>
            <span className="text-sm font-medium text-gray-900 cursor-pointer" onClick={() => onChange({ target: { name, checked: !checked } })}>
                {label}
            </span>
        </div>
    );
}
