'use server';

import { prisma } from '@/lib/prisma';
import { SystemLogger } from '@/lib/logger';
import { Deposit, Task, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// --- Deposits ---
export async function createDeposit(data: Prisma.DepositCreateInput) {
    const deposit = await prisma.deposit.create({ data });

    // Async Notification Hook
    const { DomainEvents } = await import('@/lib/events');
    // salesPersonId might not exist on type, use generic user or check input
    const inputFn = data as any;
    const user = { id: inputFn.salespersonId || 'system', companyId: 'unknown' };

    if (deposit.vehicleVin) {
        DomainEvents.emit('DEPOSIT_CREATED', {
            depositId: deposit.id,
            vehicleVin: deposit.vehicleVin,
            amount: Number(deposit.amount),
            user: { id: user.id, companyId: user.companyId }
        });
        await SystemLogger.log('DEPOSIT_CREATED', { depositId: deposit.id, vin: deposit.vehicleVin, amount: Number(deposit.amount) }, user);
    }

    revalidatePath('/sales');
    return deposit;
}

export async function getDeposits() {
    return await prisma.deposit.findMany({
        include: { vehicle: true },
        orderBy: { createdAt: 'desc' },
    });
}

// --- Tasks ---
export async function createTask(data: Prisma.TaskCreateInput) {
    const task = await prisma.task.create({ data });
    revalidatePath('/dashboard');
    return task;
}

export async function getTasks(userId?: string) {
    const where = userId ? { assignedToId: userId } : {};
    return await prisma.task.findMany({
        where,
        include: { vehicle: true, assignedTo: true },
        orderBy: { status: 'asc' }, // Pending first
    });
}

export async function completeTask(taskId: string) {
    const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: 'DONE' },
    });

    const { DomainEvents } = await import('@/lib/events');
    DomainEvents.emit('TASK_COMPLETED', {
        taskId,
        completedBy: 'user', // We don't have user context readily here without auth() call, can add if needed.
        vehicleVin: task.vehicleVin || undefined
    });
    // SystemLogger call requires user context, passing undefined for now as auth is not available here
    await SystemLogger.log('TASK_COMPLETED', { taskId, vin: task.vehicleVin }, undefined);


    revalidatePath('/dashboard');
}
