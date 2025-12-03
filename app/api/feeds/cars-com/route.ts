import { getVehicles } from '@/app/actions/vehicle';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const vehicles = await getVehicles();
    const postedVehicles = vehicles.filter((v: any) => v.status === 'POSTED');

    // Simple CSV generation for Cars.com bulk import
    // Format: VIN, Year, Make, Model, Trim, Color, Price, ImageURL
    const csvHeader = 'VIN,Year,Make,Model,Trim,Color,Price,ImageURL\n';
    const csvRows = postedVehicles.map((v: any) => {
        const mainImage = v.images.find((img: any) => img.isPublic)?.publicUrl || '';
        return `${v.vin},${v.year},${v.make},${v.model},${v.trim || ''},${v.color || ''},${v.salePrice},${mainImage}`;
    });

    const csvContent = csvHeader + csvRows.join('\n');

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="cars_com_feed.csv"',
        },
    });
}
