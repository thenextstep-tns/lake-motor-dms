import { getCurrentUser } from '@/lib/session';
import { getCompanyLots } from '@/app/actions/lot';
import { prisma } from '@/lib/prisma';
import LotListClient from './LotListClient';
import { redirect } from 'next/navigation';

export default async function LotsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/api/auth/signin');
    }

    const member = await prisma.companyMember.findFirst({
        where: { userId: user.id },
        select: { companyId: true, company: { include: { contacts: true } } }
    });

    if (!member) {
        return <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">You are not a member of any company.</div>;
    }

    const lots = await getCompanyLots(member.companyId);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Lot Management</h2>
                <p className="mt-1 text-sm text-gray-500">Add, edit, and organize your dealership locations.</p>
            </div>

            <LotListClient
                companyId={member.companyId}
                initialLots={lots}
                companySettings={member.company}
            />
        </div>
    );
}
