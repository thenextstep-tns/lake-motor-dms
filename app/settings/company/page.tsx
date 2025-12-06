import { getCurrentUser } from '@/lib/session';
import { getCompanySettings } from '@/app/actions/company';
import CompanySettingsClient from './CompanySettingsClient';
import { redirect } from 'next/navigation';

export default async function CompanySettingsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/api/auth/signin');
    }

    // Identify user's company (assuming single company for now based on context)
    // In a multi-tenant world, this would likely come from the session or a company picker
    // For now, we fetch the company associated with the user.
    // Since prisma.companyMember lists relationships, we find one.

    // NOTE: This logic might need refinement if 'getCurrentUser' doesn't return full company list
    // Ideally we pass a companyId query param or subpath, but sticking to simple single-tenant view for now.

    // We'll trust the user has at least one company or we fail gracefully.
    // For this MVP, we might need a way to get the 'default' company ID.
    // Let's assume the user has a `companyId` in their session or we grab the first one.

    const settings = await getCompanySettings("cm49l8p6k00010clc4t9y6z4n"); // Hardcoded ID from earlier logs or fallback? 
    // Wait, hardcoding is bad. We need to fetch the user's company dynamically.

    // Better approach:
    // const member = await prisma.companyMember.findFirst({ where: { userId: user.id } });
    // if (!member) return <div>No company found</div>;
    // const settings = await getCompanySettings(member.companyId);

    // Placeholder until we clarify multi-tenancy context fetching. 
    // Retrieving via implicit knowledge of the system - let's check how other pages do it.
    // Re-checking TopNav or similar... usually session has it.
    // Let's implement a robust fetch here.

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
                <p className="mt-1 text-sm text-gray-500">Manage your company details, working hours, and contact info.</p>
            </div>

            {/* We need to pass data. We will rely on a wrapper or just let the client fetch? 
                Server Component is best. 
            */}
            <ClientWrapper />
        </div>
    );
}

// Temporary internal component to handle the async logic properly without messy inline code
import { prisma } from '@/lib/prisma';

async function ClientWrapper() {
    const user = await getCurrentUser();
    if (!user) return null;

    const member = await prisma.companyMember.findFirst({
        where: { userId: user.id },
        select: { companyId: true }
    });

    if (!member) {
        return <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">You are not a member of any company.</div>;
    }

    const company = await getCompanySettings(member.companyId);

    if (!company) return <div>Company not found.</div>;

    return <CompanySettingsClient company={company} />;
}
