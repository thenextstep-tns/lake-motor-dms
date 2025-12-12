
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DetailingList from './DetailingList';



export default async function DetailingPage() {
    const session = await auth();
    if (!session?.user?.companyId) return <div>Access Denied</div>;

    const tickets = await prisma.serviceTicket.findMany({
        where: {
            companyId: session.user.companyId,
            type: 'DETAILING',
            status: { not: 'Completed' }, // Only show active
            markedForDeletion: false
        },
        include: {
            vehicle: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    // Serialize dates for Client Component
    const serializedTickets = tickets.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        vehicle: {
            ...t.vehicle,
            createdAt: t.vehicle.createdAt.toISOString(),
            updatedAt: t.vehicle.updatedAt.toISOString(),
            purchaseDate: t.vehicle.purchaseDate?.toISOString() || null,
            // Decimal Serialization
            purchasePrice: t.vehicle.purchasePrice ? Number(t.vehicle.purchasePrice) : null,
            salePrice: t.vehicle.salePrice ? Number(t.vehicle.salePrice) : null,
            regularPrice: t.vehicle.regularPrice ? Number(t.vehicle.regularPrice) : null,
            cashPrice: t.vehicle.cashPrice ? Number(t.vehicle.cashPrice) : null,
            wholesalePrice: t.vehicle.wholesalePrice ? Number(t.vehicle.wholesalePrice) : null,
            loanValue: t.vehicle.loanValue ? Number(t.vehicle.loanValue) : null,
            msrp: t.vehicle.msrp ? Number(t.vehicle.msrp) : null,
            exportPrice: t.vehicle.exportPrice ? Number(t.vehicle.exportPrice) : null,
            blueBook: t.vehicle.blueBook ? Number(t.vehicle.blueBook) : null,
            blackBook: t.vehicle.blackBook ? Number(t.vehicle.blackBook) : null,
            edmundsBook: t.vehicle.edmundsBook ? Number(t.vehicle.edmundsBook) : null,
            nadaBook: t.vehicle.nadaBook ? Number(t.vehicle.nadaBook) : null,
            suggestedPrice: t.vehicle.suggestedPrice ? Number(t.vehicle.suggestedPrice) : null,
            carfaxPrice: t.vehicle.carfaxPrice ? Number(t.vehicle.carfaxPrice) : null,
            carsDotComPrice: t.vehicle.carsDotComPrice ? Number(t.vehicle.carsDotComPrice) : null,
            cargurusPrice: t.vehicle.cargurusPrice ? Number(t.vehicle.cargurusPrice) : null,
            downPayment: t.vehicle.downPayment ? Number(t.vehicle.downPayment) : null,
            monthlyPayment: t.vehicle.monthlyPayment ? Number(t.vehicle.monthlyPayment) : null,
            biWeeklyPayment: t.vehicle.biWeeklyPayment ? Number(t.vehicle.biWeeklyPayment) : null,
            weeklyPayment: t.vehicle.weeklyPayment ? Number(t.vehicle.weeklyPayment) : null,
            vehicleCost: t.vehicle.vehicleCost ? Number(t.vehicle.vehicleCost) : null,
            repairCost: t.vehicle.repairCost ? Number(t.vehicle.repairCost) : null,
            bottomLinePrice: t.vehicle.bottomLinePrice ? Number(t.vehicle.bottomLinePrice) : null,
            tax: t.vehicle.tax ? Number(t.vehicle.tax) : null,
            total: t.vehicle.total ? Number(t.vehicle.total) : null,
            balance: t.vehicle.balance ? Number(t.vehicle.balance) : null,
            costPerLead: t.vehicle.costPerLead ? Number(t.vehicle.costPerLead) : null,
            purchaseFee: t.vehicle.purchaseFee ? Number(t.vehicle.purchaseFee) : null,
            floorplanCost: t.vehicle.floorplanCost ? Number(t.vehicle.floorplanCost) : null,
            transportationCost: t.vehicle.transportationCost ? Number(t.vehicle.transportationCost) : null,
        }
    }));

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Detailing Dashboard</h1>
            <DetailingList initialTickets={serializedTickets} userId={session.user.id} userRoles={session.user.roles} />
        </div>
    );
}
