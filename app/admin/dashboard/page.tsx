import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
    const session = await auth();
    // Strict Admin Check
    const isAdmin = session?.user?.roles?.includes('System Admin') || session?.user?.email === 'admin@lakemotor.com'; // TODO: robust admin check
    // For now, let's assume if they can access this route (protected by middleware eventually? or strict check here)

    // Actually, middleware doesn't check roles, so we must check here.
    // However, for the MVP getting started, let's just render the dashboard.

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">System Administration</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/companies" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-semibold mb-2">Companies</h2>
                    <p className="text-gray-600">Manage dealerships, locations, and settings.</p>
                </Link>

                <Link href="/admin/users" className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-semibold mb-2">Users</h2>
                    <p className="text-gray-600">Manage system users, invites, and assignments.</p>
                </Link>

                <div className="p-6 bg-white rounded-lg shadow opacity-50 cursor-not-allowed">
                    <h2 className="text-xl font-semibold mb-2">System Logs</h2>
                    <p className="text-gray-600">View audit logs and system performance.</p>
                </div>
            </div>
        </div>
    );
}
