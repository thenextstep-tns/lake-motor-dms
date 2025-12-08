import { getCurrentUser } from '@/lib/session';
import { getCompanySettings } from '@/app/actions/company';
import { getCompanyUsers } from '@/app/actions/settings';
import { prisma } from '@/lib/prisma';
import CompanySettingsClient from './CompanySettingsClient';
import CompanyPhoneBook from './CompanyPhoneBook';
import { redirect } from 'next/navigation';

export default async function CompanySettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
                <p className="mt-1 text-sm text-gray-500">Manage your company details, working hours, and employees.</p>
            </div>

            <ClientWrapper />
        </div>
    );
}

async function ClientWrapper() {
    const user = await getCurrentUser();
    if (!user) return redirect('/login');

    const member = await prisma.companyMember.findFirst({
        where: { userId: user.id },
        select: { companyId: true }
    });

    if (!member) {
        return <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">You are not a member of any company.</div>;
    }

    // Parallel fetch for speed
    const [company, members] = await Promise.all([
        getCompanySettings(member.companyId),
        getCompanyUsers()
    ]);

    if (!company) return <div>Company not found.</div>;

    return (
        <div className="space-y-12">
            <section>
                <CompanySettingsClient company={company} />
            </section>

            <section>
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Employee Directory</h3>
                    <p className="text-sm text-gray-500">View and manage company staff.</p>
                </div>
                {/* @ts-ignore */}
                <CompanyPhoneBook members={members} />
            </section>
        </div>
    );
}
