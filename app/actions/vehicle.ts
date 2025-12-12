'use server';

import { prisma } from '@/lib/prisma'; // We need to create this singleton
import { Vehicle, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { DomainEvents } from '@/lib/events';
import { SystemLogger } from '@/lib/logger';
// import { checkPermission, Role } from '@/lib/auth'; // Deprecated


// State Machine Definitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
    PURCHASED: ['DELIVERED'],
    DELIVERED: ['INSPECTED'],
    INSPECTED: ['IN_REPAIR', 'REPAIRED'], // Can skip repair if good
    IN_REPAIR: ['REPAIRED', 'READY_FOR_PICKUP'], // Added READY_FOR_PICKUP for client repairs
    REPAIRED: ['DETAILED'],
    DETAILED: ['PICTURED'],
    PICTURED: ['POSTED'],
    POSTED: ['SOLD', 'ON_HOLD'],
    ON_HOLD: ['POSTED', 'SOLD'],
    SOLD: ['IN_REPAIR'], // Allow going back to repair for client work
    READY_FOR_PICKUP: ['SOLD', 'DELIVERED'], // Assuming it goes back to customer
};

// Helper to serialize Decimal types for client components
function serializeVehicle(vehicle: any) {
    if (!vehicle) return null;

    // Convert Decimal fields to numbers
    const decimalFields = [
        'purchasePrice', 'salePrice', 'regularPrice', 'cashPrice', 'wholesalePrice',
        'loanValue', 'msrp', 'exportPrice', 'blueBook', 'blackBook', 'edmundsBook',
        'nadaBook', 'downPayment', 'monthlyPayment', 'biWeeklyPayment', 'weeklyPayment',
        'vehicleCost', 'repairCost', 'bottomLinePrice', 'tax', 'total', 'balance',
        'suggestedPrice', 'carfaxPrice', 'carsDotComPrice', 'cargurusPrice',
        'costPerLead', 'purchaseFee', 'floorplanCost', 'transportationCost'
    ];

    const serialized = { ...vehicle };

    decimalFields.forEach(field => {
        if (serialized[field] && typeof serialized[field] === 'object' && 'toNumber' in serialized[field]) {
            serialized[field] = serialized[field].toNumber();
        } else if (serialized[field] === null || serialized[field] === undefined) {
            serialized[field] = 0; // Default to 0 for null decimals if preferred, or keep null
        }
    });

    // Serialize deposits if present
    if (serialized.deposits && Array.isArray(serialized.deposits)) {
        serialized.deposits = serialized.deposits.map((deposit: any) => {
            const serializedDeposit = { ...deposit };
            if (serializedDeposit.amount && typeof serializedDeposit.amount === 'object' && 'toNumber' in serializedDeposit.amount) {
                serializedDeposit.amount = serializedDeposit.amount.toNumber();
            }
            return serializedDeposit;
        });
    }

    return serialized;
}

export async function getVehicles(lotId?: string) {
    const user = await getUserContext();

    // Determine accessible lots
    // If user has specific lot access, strictly filter by it
    // But getUserContext returns current session state.
    // Ideally we should check strict permissions or just respect the session's lotId unless 'all' is requested and allowed.

    // Let's refine the logic:
    // 1. If lotId is provided, filter by it (AND ensure user has access to it).
    // 2. If no lotId is provided, fallback to user's "current" lot from session? Or return all accessible?
    //    For now, let's default to returning ALL vehicles the user has access to if no specific lot is requested,
    //    OR default to the session's lotId if set.

    // Actually, looking at the UI requirement: "switch between different lots".
    // This implies we want to see vehicles for a SPECIFIC lot, or maybe "All My Lots".

    const where: Prisma.VehicleWhereInput = {
        companyId: user.companyId
    };

    if (lotId && lotId !== 'ALL') {
        where.lotId = lotId;
    } else {
        // If "ALL" or undefined, do we restrict to accessible lots?
        // If the user isn't an Admin/Owner, they might only have access to specific lots.
        // We should query the user's accessible lots from DB relation if we want to be strict.
        // For now, assuming if they are logged in they see all company vehicles unless filtered.
        // TODO: Enforce accessibleLots restriction here if needed.
    }

    const vehicles = await prisma.vehicle.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
            images: {
                orderBy: { order: 'asc' }
            },
            deposits: {
                orderBy: { createdAt: 'desc' }
            },
            inspections: {
                include: { codes: true },
                orderBy: { date: 'desc' }
            },
            marketingLabels: true,
            serviceTickets: {
                where: { markedForDeletion: false },
                orderBy: { createdAt: 'desc' }
            }
        },
    });
    return vehicles.map(serializeVehicle);
}

// Helper to get user context securely
async function getUserContext() {
    const session = await auth();
    if (!session?.user?.id || !session.user.companyId) {
        throw new Error("Unauthorized");
    }
    return {
        id: session.user.id,
        name: session.user.name || session.user.email || 'Unknown User', // Added name for logging
        companyId: session.user.companyId,
        lotId: session.user.lotId,
        roles: session.user.roles,
        permissions: session.user.permissions
    };
}

export async function createVehicle(data: any, _userId?: string, marketingLabelIds: string[] = []) {
    const user = await getUserContext();
    // Verify permissions if needed

    // Sanitize data
    const { country, plant, images, serviceTickets, priceHistory, deposits, inspections, marketingLabels, ...rest } = data;

    // Keys to remove (deleted flags)
    const deletedFlags = [
        'flagLowMiles', 'flagNonSmoker', 'flagFullService', 'flagMultiPoint', 'flagNeverWrecked',
        'flagFullyEquipped', 'flagLuxury', 'flagPowerful', 'flagFuelEfficient', 'flagSporty',
        'flagOffRoad', 'flagMechanicallyPerfect', 'flagPerfectExterior', 'flagPerfectInterior',
        'flagCleanExterior', 'flagCleanInterior', 'flagBelowBlueBook', 'flagLowMonthly',
        'flagBhph', 'flagGuaranteedFin', 'flagCarfaxReport', 'flagCarfaxCertified',
        'flagCarfaxOneOwner', 'flagAutocheckReport', 'flagAutocheckCert', 'flagAutocheckOne'
    ];

    deletedFlags.forEach(flag => delete rest[flag]);

    const sanitizedData = {
        ...rest,
        salePriceExpires: data.salePriceExpires ? new Date(data.salePriceExpires) : null,
        year: parseInt(data.year) || 2024,
        odometer: parseInt(data.odometer) || 0,
        engineCylinders: data.engineCylinders ? parseInt(data.engineCylinders) : null,
        doors: data.doors ? parseInt(data.doors) : null,
        transmissionSpeeds: data.transmissionSpeeds ? parseInt(data.transmissionSpeeds) : null,
        cityMpg: data.cityMpg ? parseInt(data.cityMpg) : null,
        highwayMpg: data.highwayMpg ? parseInt(data.highwayMpg) : null,
        // Inject Tenancy
        companyId: user.companyId,
        lotId: data.lotId || user.lotId,
        status: data.status || 'Purchased',
        // Explicit casts for new toggles
        hasGuarantee: Boolean(data.hasGuarantee),
        hasTitle: Boolean(data.hasTitle),
        condition: String(data.condition || 'Used'),
        // Connect Labels
        marketingLabels: {
            connect: marketingLabelIds.map(id => ({ id }))
        }
    };

    const vehicle = await prisma.vehicle.create({
        data: sanitizedData,
    });

    // Event: Vehicle Created (Async Broadcast)
    DomainEvents.emit('VEHICLE_UPDATED', {
        vin: vehicle.vin,
        changes: { 'CREATION': { old: null, new: 'Vehicle Created' } },
        user,
        timestamp: new Date()
    });

    // Explicit Log (Blocking persistence)
    await SystemLogger.log('VEHICLE_CREATED', {
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year
    }, user);


    revalidatePath('/inventory');
    return serializeVehicle(vehicle);
}

export async function updateVehicleStatus(vin: string, newStatus: string, _userId?: string) {
    const user = await getUserContext();

    const vehicle = await prisma.vehicle.findFirst({
        where: { vin, companyId: user.companyId }
    });
    if (!vehicle) throw new Error('Vehicle not found or access denied');

    // Date Logic
    const updateData: any = { status: newStatus };
    if (newStatus === 'POSTED' && vehicle.status !== 'POSTED') {
        updateData.datePosted = new Date();
    }
    if (newStatus === 'SOLD' && vehicle.status !== 'SOLD') {
        updateData.dateSold = new Date();
    }

    const updatedVehicle = await prisma.vehicle.update({
        where: { vin },
        data: updateData,
    });

    // Event: Status Change
    DomainEvents.emit('VEHICLE_UPDATED', {
        vin,
        changes: { 'status': { old: vehicle.status, new: newStatus } },
        user,
        timestamp: new Date()
    });

    await SystemLogger.log('VEHICLE_STATUS_UPDATED', {
        vin,
        oldStatus: vehicle.status,
        newStatus
    }, user);


    revalidatePath('/inventory');
    return serializeVehicle(updatedVehicle);
}

export async function deleteVehicle(vin: string) {
    const user = await getUserContext();

    const vehicle = await prisma.vehicle.findFirst({
        where: { vin, companyId: user.companyId }
    });
    if (!vehicle) throw new Error('Vehicle not found or access denied');

    const updatedVehicle = await prisma.vehicle.update({
        where: { vin },
        data: {
            markedForDeletion: true,
            deletedAt: new Date(),
            deletedBy: user.id,
            status: 'ARCHIVED'
        }
    });

    // Event: Vehicle Deleted
    DomainEvents.emit('VEHICLE_UPDATED', {
        vin,
        changes: { 'status': { old: vehicle.status, new: 'ARCHIVED (Deleted)' } },
        user,
        timestamp: new Date()
    });

    await SystemLogger.log('VEHICLE_DELETED', { vin }, user);


    revalidatePath('/inventory');
    return { success: true };
}

export async function updateVehicle(vin: string, data: any, _userId?: string, marketingLabelIds: string[] = []) {
    const user = await getUserContext();

    // Verify ownership
    const existing = await prisma.vehicle.findFirst({
        where: { vin, companyId: user.companyId }
    });
    if (!existing) throw new Error("Vehicle not found or access denied");

    // Sanitize data
    const { country, plant, images, serviceTickets, priceHistory, deposits, inspections, marketingLabels, ...rest } = data;

    // Keys to remove (deleted flags)
    const deletedFlags = [
        'flagLowMiles', 'flagNonSmoker', 'flagFullService', 'flagMultiPoint', 'flagNeverWrecked',
        'flagFullyEquipped', 'flagLuxury', 'flagPowerful', 'flagFuelEfficient', 'flagSporty',
        'flagOffRoad', 'flagMechanicallyPerfect', 'flagPerfectExterior', 'flagPerfectInterior',
        'flagCleanExterior', 'flagCleanInterior', 'flagBelowBlueBook', 'flagLowMonthly',
        'flagBhph', 'flagGuaranteedFin', 'flagCarfaxReport', 'flagCarfaxCertified',
        'flagCarfaxOneOwner', 'flagAutocheckReport', 'flagAutocheckCert', 'flagAutocheckOne'
    ];

    deletedFlags.forEach(flag => delete rest[flag]);
    // Explicitly remove system fields and relations we don't want to scalar-update or that clash
    const {
        id, createdAt, updatedAt, deletedAt, deletedBy, markedForDeletion,
        company, lot, history, lotId,
        ...safeRest
    } = rest as any;

    const sanitizedData = {
        ...safeRest,
        salePriceExpires: data.salePriceExpires ? new Date(data.salePriceExpires) : null,
        year: parseInt(data.year) || 2024,
        odometer: parseInt(data.odometer) || 0,
        engineCylinders: data.engineCylinders ? parseInt(data.engineCylinders) : null,
        doors: data.doors ? parseInt(data.doors) : null,
        transmissionSpeeds: data.transmissionSpeeds ? parseInt(data.transmissionSpeeds) : null,
        cityMpg: data.cityMpg ? parseInt(data.cityMpg) : null,
        highwayMpg: data.highwayMpg ? parseInt(data.highwayMpg) : null,

        // Handle Lot Relationship Explicitly using Relation Input
        lot: data.lotId ? { connect: { id: data.lotId } } : (data.lotId === null || data.lotId === '' ? { disconnect: true } : undefined),

        // Set Labels
        marketingLabels: {
            set: marketingLabelIds.map(id => ({ id }))
        }
    };

    // Final safety: delete companyId/lotId from rest if they stuck around (though we destructured above)
    if ('companyId' in sanitizedData) delete (sanitizedData as any).companyId;

    // Date Logic for Manual Updates
    if (sanitizedData.status === 'POSTED' && existing.status !== 'POSTED') {
        (sanitizedData as any).datePosted = new Date();
    }
    if (sanitizedData.status === 'SOLD' && existing.status !== 'SOLD') {
        (sanitizedData as any).dateSold = new Date();
    }

    // --- Audit Logging Logic ---
    const changes: Record<string, { old: any, new: any }> = {};

    // Compare simplistic text/number fields
    // We'll simplisticly iterate sanitizedData keys.
    // Note: Some keys in sanitizedData might not exist in 'existing' if they are relations (but we destructured those out mostly)

    for (const key of Object.keys(sanitizedData)) {
        if (key === 'marketingLabels' || key === 'companyId') continue; // Skip complex/system fields

        const newVal = sanitizedData[key];
        const oldVal = (existing as any)[key];

        let oldStr = oldVal;
        let newStr = newVal;

        // Custom handling for 'lot' relation
        if (key === 'lot') {
            // existing uses 'lotId' (not 'lot' object usually), but let's check both
            oldStr = (existing as any).lotId || (existing as any).lot?.id || 'None';

            // newVal is { connect: { id: ... } } or { disconnect: true }
            if (newVal && typeof newVal === 'object') {
                if ('connect' in newVal && newVal.connect?.id) {
                    newStr = newVal.connect.id;
                } else if ('disconnect' in newVal) {
                    newStr = 'None';
                }
            }
        } else {
            // General Handling
            if (oldVal && typeof oldVal === 'object' && 'toNumber' in oldVal) {
                oldStr = oldVal.toNumber(); // Convert Decimal to number
            }
            // Date handling
            if (oldVal instanceof Date) oldStr = oldVal.toISOString();
            if (newVal instanceof Date) newStr = newVal.toISOString();
        }

        // Normalize values for comparison
        const normalize = (val: any) => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'number') return val.toString();
            if (typeof val === 'string') return val.trim();
            if (typeof val === 'boolean') return val ? 'Yes' : 'No';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
        };

        const oldNorm = normalize(oldStr);
        const newNorm = normalize(newStr);

        if (oldNorm === newNorm) continue;
        if (oldNorm === '' && newNorm === '0') continue;

        changes[key] = { old: oldNorm, new: newNorm };
    }

    // [Restored] Explicitly update image metadata (Order & Visibility)
    if (images && Array.isArray(images)) {
        const imageUpdates = images.map((img: any, index: number) => {
            if (!img.id) return Promise.resolve();
            return prisma.vehicleImage.update({
                where: { id: img.id },
                data: {
                    order: index,
                    isPublic: Boolean(img.isPublic)
                }
            }).catch(err => console.error(`Failed to update image ${img.id}`, err));
        });
        await Promise.all(imageUpdates);
    }

    // --- Execute Update ---
    const updatedVehicle = await prisma.vehicle.update({
        where: { vin },
        data: sanitizedData,
    });

    // --- Emit Event ---
    if (Object.keys(changes).length > 0) {
        DomainEvents.emit('VEHICLE_UPDATED', {
            vin,
            changes,
            user,
            timestamp: new Date()
        });

        await SystemLogger.log('VEHICLE_UPDATED', {
            vin,
            changes
        }, user);
    }


    revalidatePath('/inventory');
    revalidatePath(`/inventory/${vin}`);
    return serializeVehicle(updatedVehicle);
}

export async function getVehicleByVin(vin: string) {
    const vehicle = await prisma.vehicle.findUnique({
        where: { vin },
        include: {
            images: {
                orderBy: { order: 'asc' }
            },
            serviceTickets: true,
            priceHistory: true,
            deposits: {
                orderBy: { createdAt: 'desc' }
            },
            inspections: {
                include: { codes: true },
                orderBy: { date: 'desc' }
            },
            marketingLabels: true
        }
    });
    return serializeVehicle(vehicle);
}

export async function uploadVehicleImage(formData: FormData) {
    const vin = formData.get('vin') as string;
    const file = formData.get('file') as File;

    if (!vin || !file) throw new Error('Missing VIN or File');

    // In a real app, we'd stream this to the Drive Service
    // For now, we'll just mock the DB entry

    // const buffer = Buffer.from(await file.arrayBuffer());
    // const stream = Readable.from(buffer);
    // const driveId = await driveService.uploadFile(stream, file.name, file.type, vin);

    const driveId = `mock-drive-${Date.now()}`;
    const publicUrl = `https://via.placeholder.com/400?text=${file.name}`;

    await prisma.vehicleImage.create({
        data: {
            driveId,
            publicUrl,
            vehicleVin: vin,
            isPublic: false,
        },
    });

    revalidatePath(`/inventory/${vin}`);
}

export async function toggleImagePublic(imageId: string, isPublic: boolean) {
    await prisma.vehicleImage.update({
        where: { id: imageId },
        data: { isPublic },
    });
    // We'd also revalidate the public site path here
}

export async function decodeVin(vin: string) {
    if (!vin || vin.length < 17) {
        throw new Error('Invalid VIN');
    }

    try {
        const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
        const data = await response.json();

        if (!data.Results) return null;

        const getValue = (ids: number | number[]) => {
            const idArray = Array.isArray(ids) ? ids : [ids];
            for (const id of idArray) {
                const item = data.Results.find((r: any) => r.VariableId === id);
                if (item && item.Value && item.Value !== "Not Applicable") return item.Value;
            }
            return '';
        };

        // Variable IDs:
        // Year=29, Make=26, Model=28, Trim=38, BodyClass=5, Doors=14
        // DriveType=15, FuelType=24, ElectrificationLevel=126
        // EngineCylinders=9, DisplacementL=13, EngineHP=71, OtherEngineInfo=129, EngineConfig=127
        // TransmissionStyle=37, TransmissionSpeeds=63 (Check this, 63 is usually Trans Speeds, 126 is Electrification)
        // PlantCountry=75, PlantCity=31/76, PlantState=77
        // GVWR=25, SteeringLocation=36

        // Note: ID 63 is "Transmission Speeds" in some contexts, but "Electrification Level" is 126.
        // Let's check Variable Name for safety on ambiguous ones.
        const getValueByName = (name: string) => {
            const item = data.Results.find((r: any) => r.Variable === name);
            return item && item.Value && item.Value !== "Not Applicable" ? item.Value : '';
        };

        const year = parseInt(getValue(29)) || new Date().getFullYear();
        const make = getValue(26);
        const model = getValue(28);
        const trim = getValue(38);
        // Map Body Style to our fixed options
        const rawBodyStyle = getValue(5);
        let normalizedBodyStyle = '';
        let category = 'Car'; // Default

        if (rawBodyStyle) {
            const lowerBody = rawBodyStyle.toLowerCase();
            if (lowerBody.includes('sedan') || lowerBody.includes('saloon')) {
                normalizedBodyStyle = 'Sedan';
                category = 'Car';
            } else if (lowerBody.includes('suv') || lowerBody.includes('sport utility') || lowerBody.includes('mpv')) {
                normalizedBodyStyle = 'SUV';
                category = 'SUV';
            } else if (lowerBody.includes('truck') || lowerBody.includes('pickup')) {
                normalizedBodyStyle = 'Truck';
                category = 'Truck';
            } else if (lowerBody.includes('coupe')) {
                normalizedBodyStyle = 'Coupe';
                category = 'Car';
            } else if (lowerBody.includes('van') || lowerBody.includes('minivan')) {
                normalizedBodyStyle = 'Van';
                category = 'Truck';
            } else {
                normalizedBodyStyle = rawBodyStyle; // Fallback
            }
        }

        const doors = parseInt(getValue(14)) || 4;
        const driveTrain = getValue(15);
        const fuelType = getValue(24);
        const plantCountry = getValue(75);
        const plantCity = getValue([31, 76]); // Try 31 first, then 76
        const plantState = getValue(77);
        const grossWeight = getValue(25);

        // Construct Engine String
        // Priority: Other Engine Info -> Config + Cyl + Disp -> Just Fuel
        let engine = getValue(129); // Other Engine Info
        const cylinders = getValue(9);
        const displacement = getValue(13);
        const hp = getValue(71);
        const electrification = getValue(126); // BEV, PHEV, etc.

        if (!engine) {
            const parts = [];
            if (displacement) parts.push(`${displacement}L`);
            if (cylinders) parts.push(`V${cylinders}`);
            if (hp) parts.push(`${hp}HP`);
            engine = parts.join(' ');
        }
        if (electrification) {
            engine = engine ? `${engine} (${electrification})` : electrification;
        }
        if (!engine && fuelType) {
            engine = fuelType;
        }

        // Construct Transmission String
        const transStyle = getValue(37);
        const transSpeeds = getValueByName('Transmission Speeds'); // Safety check
        let transmission = transStyle;
        if (transSpeeds) {
            transmission = transmission ? `${transSpeeds}-Speed ${transmission}` : `${transSpeeds}-Speed`;
        }

        // Exclude fields we've explicitly mapped so they don't clutter equipment
        const mappedIds = [
            26, 28, 29, 38, 5, 14, 15, 24, 75, 31, 76, 77, 25, // Core
            129, 9, 13, 71, 126, // Engine
            37, // Transmission
            143, 191, // Error Code/Text
            // We'll leave others in equipment
        ];

        const equipment = data.Results
            .filter((r: any) => r.Value && r.Value !== "Not Applicable" && !mappedIds.includes(r.VariableId))
            .map((r: any) => `${r.Variable}: ${r.Value}`)
            .join('\n');

        return {
            year,
            make,
            model,
            trim,
            bodyStyle: normalizedBodyStyle,
            category,
            driveTrain,
            fuelType,
            engine, // Now a descriptive string
            engineSize: getValue(13) ? `${getValue(13)}L` : '',
            engineCylinders: parseInt(getValue(9)) || null,
            transmission,
            transmissionType: transStyle && transStyle.toLowerCase().includes('auto') ? 'Automatic' : (transStyle ? 'Manual' : 'Automatic'),
            transmissionSpeeds: transSpeeds ? parseInt(transSpeeds) : null,
            doors,
            plantCountry,
            plantCity,
            plantState,
            grossWeight,
            vehicleEquipment: equipment
        };
    } catch (error) {
        console.error('VIN Decode Error:', error);
        return null;
    }
}

import { VEHICLE_COLORS, VEHICLE_CATEGORIES, VEHICLE_FUEL_TYPES, VEHICLE_BODY_STYLES, VEHICLE_DRIVETRAINS } from '@/app/domain/constants';

export async function getVehicleAttributes() {
    // 1. Fetch from DB
    const attributes = await prisma.vehicleAttribute.findMany({
        where: { companyId: null },
        orderBy: { order: 'asc' }
    });

    // 2. Lazy Seed if empty (System Defaults)
    if (attributes.length === 0) {
        console.log("Lazy Seeding Vehicle Attributes...");
        const seedMaps = [
            { type: 'COLOR', list: VEHICLE_COLORS },
            { type: 'CATEGORY', list: VEHICLE_CATEGORIES },
            { type: 'FUEL_TYPE', list: VEHICLE_FUEL_TYPES },
            { type: 'BODY_STYLE', list: VEHICLE_BODY_STYLES },
            { type: 'DRIVETRAIN', list: VEHICLE_DRIVETRAINS },
        ];

        for (const { type, list } of seedMaps) {
            let order = 0;
            // Use sequential loop to ensure order
            for (const value of list) {
                const exists = await prisma.vehicleAttribute.findFirst({
                    where: { type, value, companyId: null }
                });
                if (!exists) {
                    await prisma.vehicleAttribute.create({
                        data: {
                            type,
                            value,
                            label: value,
                            order: order++,
                            companyId: null
                        }
                    });
                }
            }
        }

        // Refetch
        return await prisma.vehicleAttribute.findMany({
            where: { companyId: null },
            orderBy: { order: 'asc' }
        });
    }

    return attributes;
}

export async function getMarketingLabels(companyId?: string) {
    // 1. Fetch System Defaults (companyId: null) AND Company Specific
    const whereClause: any = { companyId: null };
    if (companyId) {
        whereClause.OR = [{ companyId: null }, { companyId }];
    }

    let labels = await prisma.marketingLabel.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
    });

    // 2. Lazy Seed System Defaults if empty
    const systemLabels = labels.filter(l => l.companyId === null);
    if (systemLabels.length === 0) {
        console.log("Lazy Seeding Marketing Labels...");
        const defaults = [
            { name: 'One Owner', colorCode: '#FFD700' }, // Gold
            { name: 'Low Miles', colorCode: '#32CD32' }, // LimeGreen
            { name: 'No Accidents', colorCode: '#1E90FF' }, // DodgerBlue
            { name: 'Fuel Efficient', colorCode: '#228B22' }, // ForestGreen
            { name: 'Powerful Engine', colorCode: '#FF4500' }, // OrangeRed
            { name: 'Free Powertrain Warranty', colorCode: '#800080' }, // Purple
        ];

        for (const def of defaults) {
            const exists = await prisma.marketingLabel.findFirst({
                where: { name: def.name, companyId: null }
            });
            if (!exists) {
                await prisma.marketingLabel.create({
                    data: {
                        ...def,
                        companyId: null
                    }
                });
            }
        }

        // Refetch
        labels = await prisma.marketingLabel.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
    }


    return labels;
}

export async function getVehicleHistory(
    vin: string,
    page: number = 1,
    pageSize: number = 50,
    filters: { startDate?: string, endDate?: string, author?: string, field?: string } = {}
) {
    const user = await getUserContext();

    const where: any = {
        vehicleId: vin,
        companyId: user.companyId
    };

    if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        where.timestamp = { ...where.timestamp, gte: start };
    }

    if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp = { ...where.timestamp, lte: end };
    }

    if (filters.author) {
        where.userName = {
            contains: filters.author
        };
    }

    if (filters.field) {
        where.field = {
            contains: filters.field
        };
    }

    const [logs, total] = await Promise.all([
        prisma.vehicleHistory.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        }),
        prisma.vehicleHistory.count({ where })
    ]);

    return {
        logs,
        total,
        pages: Math.ceil(total / pageSize)
    };
}

export async function revertVehicleChange(logId: string) {
    const user = await getUserContext();

    // Fetch log
    const log = await prisma.vehicleHistory.findUnique({
        where: { id: logId }
    });

    if (!log || !log.oldValue) throw new Error("Log not found or no old value");

    // Security check: Match company
    if (log.companyId !== user.companyId) throw new Error("Unauthorized");

    // Security: Check if user has access to vehicle
    const vehicle = await prisma.vehicle.findFirst({
        where: { vin: log.vehicleId, companyId: user.companyId }
    });
    if (!vehicle) throw new Error("Unauthorized");

    // Revert logic...
    let valToRestore: any = log.oldValue;
    if (!isNaN(Number(valToRestore)) && valToRestore !== '') {
        const num = Number(valToRestore);
        valToRestore = num;
    }

    // New Log for the Revert
    DomainEvents.emit('VEHICLE_UPDATED', {
        vin: log.vehicleId,
        changes: { [log.field]: { old: log.newValue, new: log.oldValue + ' (Reverted)' } },
        user,
        timestamp: new Date()
    });

    await prisma.vehicle.update({
        where: { vin: log.vehicleId },
        data: {
            [log.field]: valToRestore
        }
    });

    revalidatePath(`/inventory/${log.vehicleId}`);
}
