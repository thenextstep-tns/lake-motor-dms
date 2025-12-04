'use client';

import { useState, useEffect } from 'react';
import { createVehicle, updateVehicle, decodeVin } from '@/app/actions/vehicle';
import { syncVehicleImages, reorderImages, toggleImageVisibility } from '@/app/actions/drive';
import { deleteDeposit } from '@/app/actions/deposit-delete';
import { createInspection, updateInspection, deleteInspection } from '@/app/actions/inspection';
import DepositModal from '@/app/components/inventory/DepositModal';
import { useRouter } from 'next/navigation';

export default function AddVehicleForm({ userId, initialData, onSuccess }: { userId: string, initialData?: any, onSuccess?: () => void }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('posting');
    const [loading, setLoading] = useState(false);
    const [decoding, setDecoding] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [descriptionType, setDescriptionType] = useState('Regular');
    const [images, setImages] = useState(initialData?.images || []);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    // Inspection State
    const [inspections, setInspections] = useState(initialData?.inspections || []);
    const [isInspectionFormOpen, setIsInspectionFormOpen] = useState(false);
    const [editingInspection, setEditingInspection] = useState<any>(null);
    const [inspectionForm, setInspectionForm] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        info: '',
        codes: [] as { code: string, description: string }[]
    });
    const [newCode, setNewCode] = useState({ code: '', description: '' });

    const [formData, setFormData] = useState(initialData || {
        // Core
        vin: '', stockNumber: '', year: new Date().getFullYear(), make: '', model: '', trim: '',
        bodyStyle: '', color: '', interiorColor: '', odometer: 0, condition: 'Used', status: 'PURCHASED', titleStatus: 'Clean', keyId: '',
        vehicleCaption: '', category: 'SUV', size: 'Midsize',

        // Specs
        engine: '', engineSize: '', engineCylinders: 4, transmission: '', transmissionType: 'Automatic', transmissionSpeeds: 6,
        driveTrain: 'FWD', fuelType: 'Gas', doors: 4, cityMpg: 0, highwayMpg: 0,
        interiorOemColor: '', exteriorOemColor: '',

        // Equipment
        vehicleEquipment: '', windowStickerEquipment: '',

        // Logistics
        location: 'Lake Motor Group LLC', salesPerson: 'Any / All', salesNotes: '', guarantee: '',
        googleDriveUrl: '', walkaroundVideo: '', testDriveVideo: '',
        plantCity: '', plantState: '', plantCountry: '', grossWeight: '',

        // Flags
        isFeatured: false, isCertified: false, isOneOwner: false, warrantyAvailable: false, financingAvailable: false,
        isSold: false, isNew: false, isAsIs: false,

        // Description Builder Flags
        flagLowMiles: false, flagNonSmoker: false, flagFullService: false, flagMultiPoint: false, flagNeverWrecked: false,
        flagFullyEquipped: false, flagLuxury: false, flagPowerful: false, flagFuelEfficient: false, flagSporty: false,
        flagOffRoad: false, flagMechanicallyPerfect: false, flagPerfectExterior: false, flagPerfectInterior: false,
        flagCleanExterior: false, flagCleanInterior: false, flagBelowBlueBook: false, flagLowMonthly: false,
        flagBhph: false, flagGuaranteedFin: false, flagCarfaxReport: false, flagCarfaxCertified: false,
        flagCarfaxOneOwner: false, flagAutocheckReport: false, flagAutocheckCert: false, flagAutocheckOne: false,

        // Financials
        purchasePrice: 0, salePrice: 0, regularPrice: 0, cashPrice: 0, wholesalePrice: 0, loanValue: 0, msrp: 0,
        exportPrice: 0, blueBook: 0, blackBook: 0, edmundsBook: 0, nadaBook: 0,
        downPayment: 0, monthlyPayment: 0, biWeeklyPayment: 0, weeklyPayment: 0,
        vehicleCost: 0, repairCost: 0, bottomLinePrice: 0, preferredPriceText: 'Price', salePriceExpires: '',

        // SEO
        seoTitle: '', seoKeywords: '', seoDescription: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setFormData((prev: any) => {
            const newData = {
                ...prev,
                [name]: type === 'number' ? parseFloat(value) || 0 : value
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

        setFormData((prev: any) => ({ ...prev, seoDescription: template }));
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
                // Refresh images
                // We'd ideally re-fetch the vehicle data or just the images.
                // For now, let's reload the page or ask parent to refresh.
                window.location.reload();
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
            if (initialData) {
                await updateVehicle(initialData.vin, formData, userId);
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push('/inventory');
                }
            } else {
                await createVehicle(formData, userId);
                router.push('/inventory');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save vehicle');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'posting', label: 'Posting' },
        { id: 'service', label: 'Service & Inspections' },
        { id: 'deposits', label: 'Customers & Deposits' },
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
            if (editingInspection) {
                await updateInspection(editingInspection.id, inspectionForm);
            } else {
                await createInspection({ ...inspectionForm, vehicleVin: formData.vin });
            }
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Failed to save inspection');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCode = () => {
        if (!newCode.code) return;
        setInspectionForm(prev => ({
            ...prev,
            codes: [...prev.codes, newCode]
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
            codes: inspection.codes.map((c: any) => ({ code: c.code, description: c.description || '' }))
        });
        setIsInspectionFormOpen(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden font-sans text-gray-900">
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
                                            <Select label="Condition" name="condition" value={formData.condition} onChange={handleChange} options={['Used', 'New']} />
                                        </div>

                                        <Input label="Trim" name="trim" value={formData.trim} onChange={handleChange} />
                                        <Input label="Year" name="year" type="number" value={formData.year} onChange={handleChange} required />
                                        <Input label="Make" name="make" value={formData.make} onChange={handleChange} required />
                                        <Input label="Model" name="model" value={formData.model} onChange={handleChange} required />

                                        <div className="col-span-3">
                                            <Input label="Vehicle Caption" name="vehicleCaption" value={formData.vehicleCaption} onChange={handleChange} />
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
                                        <Select label="Title Status" name="titleStatus" value={formData.titleStatus} onChange={handleChange} options={['Clean', 'Salvage', 'Rebuilt', 'Lien']} />

                                        <Select label="Body" name="bodyStyle" value={formData.bodyStyle} onChange={handleChange} options={['SUV', 'Sedan', 'Truck', 'Coupe', 'Van']} />
                                        <Input label="Doors" name="doors" type="number" value={formData.doors} onChange={handleChange} />
                                        <Select label="Fuel" name="fuelType" value={formData.fuelType} onChange={handleChange} options={['Gas', 'Diesel', 'Electric', 'Hybrid']} />
                                        <Select label="Drive Train" name="driveTrain" value={formData.driveTrain} onChange={handleChange} options={['FWD', 'RWD', 'AWD', '4WD']} />

                                        <Select label="Size" name="size" value={formData.size} onChange={handleChange} options={['Compact', 'Midsize', 'Fullsize']} />
                                        <Select label="Category" name="category" value={formData.category} onChange={handleChange} options={['SUV', 'Car', 'Truck']} />

                                        <Input label="City MPG" name="cityMpg" type="number" value={formData.cityMpg} onChange={handleChange} />
                                        <Input label="Highway MPG" name="highwayMpg" type="number" value={formData.highwayMpg} onChange={handleChange} />

                                        <Input label="Exterior OEM Color" name="exteriorOemColor" value={formData.exteriorOemColor} onChange={handleChange} />
                                        <Input label="Interior OEM Color" name="interiorOemColor" value={formData.interiorOemColor} onChange={handleChange} />
                                        <Input label="Exterior Color" name="color" value={formData.color} onChange={handleChange} />
                                        <Input label="Interior Color" name="interiorColor" value={formData.interiorColor} onChange={handleChange} />
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
                                        <Input label="Regular Price" name="regularPrice" type="number" value={formData.regularPrice} onChange={handleChange} />
                                        <Input label="Sale Price" name="salePrice" type="number" value={formData.salePrice} onChange={handleChange} />
                                        <Input label="Cash Price" name="cashPrice" type="number" value={formData.cashPrice} onChange={handleChange} />
                                        <Input label="Export / Feed Price" name="exportPrice" type="number" value={formData.exportPrice} onChange={handleChange} />

                                        <Input label="Blue Book" name="blueBook" type="number" value={formData.blueBook} onChange={handleChange} />
                                        <Input label="Black Book" name="blackBook" type="number" value={formData.blackBook} onChange={handleChange} />
                                        <Input label="Edmunds Book" name="edmundsBook" type="number" value={formData.edmundsBook} onChange={handleChange} />
                                        <Input label="NADA Book" name="nadaBook" type="number" value={formData.nadaBook} onChange={handleChange} />

                                        <Input label="Down Payment" name="downPayment" type="number" value={formData.downPayment} onChange={handleChange} />
                                        <Input label="Monthly Payment" name="monthlyPayment" type="number" value={formData.monthlyPayment} onChange={handleChange} />
                                        <Input label="Bi-Weekly Payment" name="biWeeklyPayment" type="number" value={formData.biWeeklyPayment} onChange={handleChange} />
                                        <Input label="Weekly Payment" name="weeklyPayment" type="number" value={formData.weeklyPayment} onChange={handleChange} />

                                        <Input label="Vehicle Cost" name="vehicleCost" type="number" value={formData.vehicleCost} onChange={handleChange} />
                                        <Input label="Repair Cost" name="repairCost" type="number" value={formData.repairCost} onChange={handleChange} />
                                        <Input label="Bottom Line Price" name="bottomLinePrice" type="number" value={formData.bottomLinePrice} onChange={handleChange} />
                                        <Input label="Wholesale Price" name="wholesalePrice" type="number" value={formData.wholesalePrice} onChange={handleChange} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logistics Section */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <SectionHeader id="logistics" title="Logistics & Flags" />
                            {expandedSections.logistics && (
                                <div className="p-6 bg-white border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Location" name="location" value={formData.location} onChange={handleChange} />
                                        <Input label="Sales Person" name="salesPerson" value={formData.salesPerson} onChange={handleChange} />

                                        <div className="col-span-1 md:col-span-2">
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

                                        <Input label="Guarantee/Warranty Info" name="guarantee" value={formData.guarantee} onChange={handleChange} />

                                        <div className="col-span-1 md:col-span-2 mt-4">
                                            <h3 className="text-lg font-bold mb-4 text-gray-800">Manufacture Details</h3>
                                        </div>
                                        <Input label="Plant City" name="plantCity" value={formData.plantCity || ''} onChange={handleChange} />
                                        <Input label="Plant State" name="plantState" value={formData.plantState || ''} onChange={handleChange} />
                                        <Input label="Plant Country" name="plantCountry" value={formData.plantCountry || ''} onChange={handleChange} />
                                        <Input label="Gross Weight (GVWR)" name="grossWeight" value={formData.grossWeight || ''} onChange={handleChange} />

                                        <div className="col-span-1 md:col-span-2 mt-4">
                                            <h3 className="text-lg font-bold mb-4 text-gray-800">Vehicle Flags</h3>
                                        </div>
                                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <Toggle label="Featured Vehicle" name="isFeatured" checked={formData.isFeatured} onChange={handleCheckboxChange} />
                                            <Toggle label="One Owner Vehicle" name="isOneOwner" checked={formData.isOneOwner} onChange={handleCheckboxChange} />
                                            <Toggle label="Certified Vehicle" name="isCertified" checked={formData.isCertified} onChange={handleCheckboxChange} />
                                            <Toggle label="BHPH Financing Available" name="flagBhph" checked={formData.flagBhph} onChange={handleCheckboxChange} />
                                            <Toggle label="Standard Warranty Available" name="warrantyAvailable" checked={formData.warrantyAvailable} onChange={handleCheckboxChange} />
                                            <Toggle label="Extended Warranty Available" name="flagAutocheckCert" checked={formData.flagAutocheckCert} onChange={handleCheckboxChange} />
                                            <Toggle label="As-Is / No Warranty" name="isAsIs" checked={formData.isAsIs} onChange={handleCheckboxChange} />
                                            <Toggle label="Used" name="condition" checked={formData.condition === 'Used'} onChange={(e: any) => setFormData((prev: any) => ({ ...prev, condition: e.target.checked ? 'Used' : 'New' }))} />
                                            <Toggle label="New" name="isNew" checked={formData.isNew} onChange={handleCheckboxChange} />
                                        </div>
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

                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <Toggle label="One Owner" name="isOneOwner" checked={formData.isOneOwner} onChange={handleCheckboxChange} />
                                            <Toggle label="Powerful Engine" name="flagPowerful" checked={formData.flagPowerful} onChange={handleCheckboxChange} />
                                            <Toggle label="Below Blue Book" name="flagBelowBlueBook" checked={formData.flagBelowBlueBook} onChange={handleCheckboxChange} />

                                            <Toggle label="Low Miles" name="flagLowMiles" checked={formData.flagLowMiles} onChange={handleCheckboxChange} />
                                            <Toggle label="Fuel Efficient" name="flagFuelEfficient" checked={formData.flagFuelEfficient} onChange={handleCheckboxChange} />
                                            <Toggle label="Low Monthly Payments" name="flagLowMonthly" checked={formData.flagLowMonthly} onChange={handleCheckboxChange} />

                                            <Toggle label="Non-Smoker" name="flagNonSmoker" checked={formData.flagNonSmoker} onChange={handleCheckboxChange} />
                                            <Toggle label="Sporty Handling" name="flagSporty" checked={formData.flagSporty} onChange={handleCheckboxChange} />
                                            <Toggle label="BHPH Financing" name="flagBhph" checked={formData.flagBhph} onChange={handleCheckboxChange} />

                                            <Toggle label="Full Service History" name="flagFullService" checked={formData.flagFullService} onChange={handleCheckboxChange} />
                                            <Toggle label="Off-Road Ready" name="flagOffRoad" checked={formData.flagOffRoad} onChange={handleCheckboxChange} />
                                            <Toggle label="Guaranteed Financing" name="flagGuaranteedFin" checked={formData.flagGuaranteedFin} onChange={handleCheckboxChange} />

                                            <Toggle label="Multi-Point Inspected" name="flagMultiPoint" checked={formData.flagMultiPoint} onChange={handleCheckboxChange} />
                                            <Toggle label="Mechanically Perfect" name="flagMechanicallyPerfect" checked={formData.flagMechanicallyPerfect} onChange={handleCheckboxChange} />
                                            <Toggle label="Carfax Report" name="flagCarfaxReport" checked={formData.flagCarfaxReport} onChange={handleCheckboxChange} />

                                            <Toggle label="Never Wrecked" name="flagNeverWrecked" checked={formData.flagNeverWrecked} onChange={handleCheckboxChange} />
                                            <Toggle label="Perfect Exterior" name="flagPerfectExterior" checked={formData.flagPerfectExterior} onChange={handleCheckboxChange} />
                                            <Toggle label="Carfax Certified" name="flagCarfaxCertified" checked={formData.flagCarfaxCertified} onChange={handleCheckboxChange} />

                                            <Toggle label="Standard Warranty" name="warrantyAvailable" checked={formData.warrantyAvailable} onChange={handleCheckboxChange} />
                                            <Toggle label="Perfect Interior" name="flagPerfectInterior" checked={formData.flagPerfectInterior} onChange={handleCheckboxChange} />
                                            <Toggle label="Carfax One Owner" name="flagCarfaxOneOwner" checked={formData.flagCarfaxOneOwner} onChange={handleCheckboxChange} />
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                                            <textarea
                                                name="seoDescription"
                                                value={formData.seoDescription}
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
                                            name: '',
                                            date: new Date().toISOString().split('T')[0],
                                            info: '',
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Input label="Inspection Name" name="name" value={inspectionForm.name} onChange={(e: any) => setInspectionForm({ ...inspectionForm, name: e.target.value })} required />
                                    <Input label="Date" name="date" type="date" value={inspectionForm.date} onChange={(e: any) => setInspectionForm({ ...inspectionForm, date: e.target.value })} required />
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
                            <div className="space-y-4">
                                {!initialData ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <p className="text-gray-500">Please save the vehicle first to manage inspections.</p>
                                    </div>
                                ) : inspections.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <p className="text-gray-500">No inspections recorded.</p>
                                    </div>
                                ) : (
                                    inspections.map((inspection: any) => (
                                        <div key={inspection.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-lg">{inspection.name}</h4>
                                                    <p className="text-sm text-gray-500">Date: {new Date(inspection.date).toLocaleDateString()}</p>
                                                    {inspection.info && <p className="text-sm text-gray-600 mt-2">{inspection.info}</p>}
                                                    {inspection.codes && inspection.codes.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-xs font-bold text-gray-500 uppercase">Diagnostic Codes:</p>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {inspection.codes.map((c: any, i: number) => (
                                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                        {c.code}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditInspection(inspection)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (confirm('Delete this inspection?')) {
                                                                await deleteInspection(inspection.id, formData.vin);
                                                                window.location.reload();
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Customers & Deposits Tab */}
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
                                                                    // Refresh logic needed here, ideally re-fetch or update state
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

                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mr-4"
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

            </form >

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
