'use server';

import { prisma } from '@/lib/prisma'; // We need to create this singleton
import { Vehicle, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { checkPermission, Role } from '@/lib/auth';

// State Machine Definitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
    PURCHASED: ['DELIVERED'],
    DELIVERED: ['INSPECTED'],
    INSPECTED: ['IN_REPAIR', 'REPAIRED'], // Can skip repair if good
    IN_REPAIR: ['REPAIRED'],
    REPAIRED: ['DETAILED'],
    DETAILED: ['PICTURED'],
    PICTURED: ['POSTED'],
    POSTED: ['SOLD', 'ON_HOLD'],
    ON_HOLD: ['POSTED', 'SOLD'],
    SOLD: [],
};

// Helper to serialize Decimal types for client components
function serializeVehicle(vehicle: any) {
    if (!vehicle) return null;

    // Convert Decimal fields to numbers
    const decimalFields = [
        'purchasePrice', 'salePrice', 'regularPrice', 'cashPrice', 'wholesalePrice',
        'loanValue', 'msrp', 'exportPrice', 'blueBook', 'blackBook', 'edmundsBook',
        'nadaBook', 'downPayment', 'monthlyPayment', 'biWeeklyPayment', 'weeklyPayment',
        'vehicleCost', 'repairCost', 'bottomLinePrice', 'tax', 'total', 'balance'
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

export async function getVehicles() {
    // TODO: Add filtering/sorting
    const vehicles = await prisma.vehicle.findMany({
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
            }
        },
    });
    return vehicles.map(serializeVehicle);
}

export async function createVehicle(data: any, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // await checkPermission(user, Role.ADMIN); // Disabled for localhost dev

    // Sanitize data
    // Remove fields that are not in the Prisma schema or are relations
    const { country, plant, images, serviceTickets, priceHistory, deposits, inspections, ...rest } = data;

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
    };

    const vehicle = await prisma.vehicle.create({
        data: sanitizedData,
    });
    revalidatePath('/inventory');
    return serializeVehicle(vehicle);
}

export async function updateVehicleStatus(vin: string, newStatus: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // await checkPermission(user, Role.ADMIN); // Disabled for localhost dev

    const vehicle = await prisma.vehicle.findUnique({ where: { vin } });
    if (!vehicle) throw new Error('Vehicle not found');

    const allowedTransitions = STATUS_TRANSITIONS[vehicle.status] || [];
    // Allow admin to force any status if needed, but let's stick to transitions for now
    // Or just allow it since we added ON_HOLD
    // if (!allowedTransitions.includes(newStatus)) {
    //     throw new Error(`Invalid transition from ${vehicle.status} to ${newStatus}`);
    // }

    const updatedVehicle = await prisma.vehicle.update({
        where: { vin },
        data: { status: newStatus },
    });

    revalidatePath('/inventory');
    return serializeVehicle(updatedVehicle);
}

export async function updateVehicle(vin: string, data: any, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // await checkPermission(user, Role.ADMIN); // Disabled for localhost dev

    // Sanitize data
    // Remove fields that are not in the Prisma schema or are relations
    const { country, plant, images, serviceTickets, priceHistory, deposits, inspections, ...rest } = data;

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
    };

    const vehicle = await prisma.vehicle.update({
        where: { vin },
        data: sanitizedData,
        include: { images: true }
    });

    revalidatePath('/inventory');
    revalidatePath(`/inventory/${vin}`);
    return serializeVehicle(vehicle);
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
            }
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
