'use client';

import { useState } from 'react';
import MemberProfileModal from './MemberProfileModal';

type Member = {
    id: string; // userId
    name: string | null;
    email: string;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    personalEmail: string | null;
    roles: string[];
    position: string | null;
    status: string | null;
    workPhone: string | null;
};

export default function CompanyPhoneBook({ members, availableLots }: { members: Member[], availableLots: any[] }) {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Company Phone Book</h3>
                <span className="text-sm text-gray-500">{members.length} Employees</span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position/Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {member.image ? (
                                            <img className="h-10 w-10 rounded-full mr-3 object-cover" src={member.image} alt="" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-500 font-bold">
                                                {(member.firstName?.[0] || member.name?.[0] || '?').toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {(member.firstName && member.lastName) ? `${member.firstName} ${member.lastName}` : (member.name || 'Unknown')}
                                            </div>
                                            <div className="text-xs text-gray-500">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{member.position || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">{member.roles.join(', ')}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        {member.workPhone && <span className='flex items-center gap-1'><span className="text-blue-500 text-xs font-bold">W:</span> {member.workPhone}</span>}
                                        {member.phone && <span className='flex items-center gap-1'><span className="text-gray-400 text-xs font-bold">P:</span> {member.phone}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800' :
                                        member.status === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {member.status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setSelectedMemberId(member.id)}
                                        className="text-blue-600 hover:text-blue-900 font-medium"
                                    >
                                        Edit / View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedMemberId && (
                <MemberProfileModal
                    userId={selectedMemberId}
                    availableLots={availableLots}
                    onClose={() => setSelectedMemberId(null)}
                />
            )}
        </div>
    );
}
