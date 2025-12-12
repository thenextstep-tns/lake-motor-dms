
import { DomainEvents } from '@/lib/events';
import { TicketService } from '@/app/services/TicketService';
import { prisma } from '@/lib/prisma';

export function registerWorkflowListeners() {
    console.log('[Listener] Registering Workflow Listeners...');

    DomainEvents.on('INSPECTION_COMPLETED', async (event) => {
        console.log('[WorkflowListener] Received INSPECTION_COMPLETED:', JSON.stringify(event, null, 2));
        const { inspectionId, vehicleVin, findings, priority, notes, detailedFindings, user } = event;

        try {
            if (findings.needsMechanical || findings.needsCosmetic) {
                const inspection = await prisma.inspection.findUnique({
                    where: { id: inspectionId },
                    include: { codes: true }
                });

                if (!inspection) {
                    console.error(`[WorkflowListener] Inspection ${inspectionId} not found!`);
                    return;
                }

                // Fetch User Context via CompanyMember
                const member = await prisma.companyMember.findUnique({
                    where: {
                        userId_companyId: {
                            userId: user.id,
                            companyId: user.companyId
                        }
                    },
                    include: {
                        roles: {
                            include: { permissions: { include: { permission: true } } }
                        }
                    }
                });

                if (!member) {
                    console.error(`[WorkflowListener] User ${user.id} is not a member of company ${user.companyId}`);
                    return;
                }

                const context = {
                    id: user.id,
                    name: '(System/Async)',
                    companyId: member.companyId,
                    lotId: member.lotId || null,
                    roles: member.roles.map(r => r.name),
                    permissions: member.roles.flatMap(r =>
                        r.permissions.map(rp => `${rp.permission.action}:${rp.permission.resource}`)
                    )
                };

                const vehicle = await prisma.vehicle.findUnique({
                    where: { vin: vehicleVin },
                    select: { status: true }
                });

                if (vehicle?.status !== 'SOLD') {
                    const issues = [];
                    if (findings.needsMechanical) issues.push("Mechanical Recon");
                    if (findings.needsCosmetic) issues.push("Cosmetic Recon");

                    let issueSummary = `Inspection: ${issues.join(' & ')}`;

                    // Append General Notes
                    if (notes) {
                        issueSummary += `\n\nNotes: ${notes}`;
                    }

                    // Append Failed Checklist Items
                    const details: string[] = [];
                    const collectFailures = (data: any, type: string) => {
                        if (!data) return;
                        const parsed = typeof data === 'string' ? JSON.parse(data) : data;

                        Object.entries(parsed).forEach(([item, val]: [string, any]) => {
                            const status = typeof val === 'string' ? val : val.status;
                            const note = typeof val === 'string' ? '' : val.notes;
                            if (status === 'Fail' || status === 'Attention') {
                                details.push(`${type} - ${item}: ${status}${note ? ` (${note})` : ''}`);
                            }
                        });
                    };

                    if (detailedFindings) {
                        collectFailures(detailedFindings.mechanical, 'Mech');
                        collectFailures(detailedFindings.cosmetic, 'Cosm');
                    }

                    if (details.length > 0) {
                        issueSummary += `\n\nDetails:\n- ${details.join('\n- ')}`;
                    }

                    // Append Diagnostic Codes
                    if (inspection.codes && inspection.codes.length > 0) {
                        issueSummary += `\n\nCodes: ${inspection.codes.map(c => `${c.code} (${c.description})`).join(', ')}`;
                    }

                    await TicketService.create(context, {
                        vehicleVin,
                        description: issueSummary,
                        inspectionId: inspection.id,
                        repairDifficulty: 'Medium',
                        priority: priority || 'Normal',
                        type: 'RECON'
                    });
                }
            }
        } catch (error) {
            console.error(`[WorkflowListener] Failed to sync ticket:`, error);
        }
    });
}
