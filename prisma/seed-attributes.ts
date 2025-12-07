
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VEHICLE_COLORS = [
    'Beige', 'Black', 'Blue', 'Bronze', 'Brown', 'Burgundy', 'Camel', 'Charcoal', 'Cream',
    'Dark Blue', 'Dark Green', 'Gold', 'Gray', 'Green', 'Light Blue', 'Light Green',
    'Maroon', 'Orange', 'Pearl', 'Pewter', 'Pink', 'Purple', 'Red', 'Silver', 'Tan',
    'Teal', 'White', 'Yellow', 'Other'
];

const VEHICLE_CATEGORIES = [
    'Compact', 'Station Wagon', 'Convertible', 'Sports', 'Hatchback', 'Pickup',
    'SUV', 'Minivan', 'Sprinter Van', 'Cargo Van', 'Luxury', 'Commercial', 'Other'
];

const VEHICLE_FUEL_TYPES = [
    'Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Flex Fuel', 'Other'
];

const VEHICLE_BODY_STYLES = [
    'Sedan', 'Coupe', 'Hatchback', 'Convertible', 'SUV', 'Truck', 'Van', 'Wagon', 'Other'
];

const VEHICLE_DRIVETRAINS = [
    'FWD', 'RWD', 'AWD', '4WD', '4x4'
];

async function main() {
    console.log('Seeding Vehicle Attributes...');

    const processList = async (type: string, list: string[]) => {
        let order = 0;
        for (const value of list) {
            await prisma.vehicleAttribute.upsert({
                where: {
                    type_value_companyId: {
                        type,
                        value,
                        companyId: 'SYSTEM_DEFAULT' // Use a placeholder or null if schema allows, but relying on composite key. 
                        // Ah, my schema said companyId is String? (nullable). 
                        // But unique constraint is [type, value, companyId]. Prisma considers NULLs distinct in some DBs but unique constraint might fail on multi-nulls in SQL standard or work differently in SQLite.
                        // SQLite allows multiple NULLs in unique index.
                        // So I can use null.
                    }
                },
                update: {},
                create: {
                    type,
                    value,
                    label: value,
                    order: order++,
                    companyId: null // System Default
                }
            });
        }
    };

    // Wait, upserting with null in composite key in Prisma might be tricky.
    // Let's just try-catch create or findFirst.

    const safeUpsert = async (type: string, list: string[]) => {
        let order = 0;
        for (const value of list) {
            const existing = await prisma.vehicleAttribute.findFirst({
                where: { type, value, companyId: null }
            });

            if (!existing) {
                await prisma.vehicleAttribute.create({
                    data: {
                        type,
                        value,
                        label: value,
                        order: order++,
                        companyId: null
                    }
                });
                console.log(`Created ${type}: ${value}`);
            }
        }
    };

    await safeUpsert('COLOR', VEHICLE_COLORS);
    await safeUpsert('CATEGORY', VEHICLE_CATEGORIES);
    await safeUpsert('FUEL_TYPE', VEHICLE_FUEL_TYPES);
    await safeUpsert('BODY_STYLE', VEHICLE_BODY_STYLES);
    await safeUpsert('DRIVETRAIN', VEHICLE_DRIVETRAINS);

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
