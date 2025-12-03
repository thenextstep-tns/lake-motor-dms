'use server';

import { prisma } from '@/lib/prisma';
import { Deposit, Task, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// --- Deposits ---
export async function createDeposit(data: Prisma.DepositCreateInput) {
    const deposit = await prisma.deposit.create({ data });
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
    await prisma.task.update({
        where: { id: taskId },
        data: { status: 'DONE' },
    });
    revalidatePath('/dashboard');
}
