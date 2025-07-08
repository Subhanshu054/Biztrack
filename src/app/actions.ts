
'use server';

import { addTransaction as dbAddTransaction, getTransactions as dbGetTransactions, addReminder as dbAddReminder, getReminders as dbGetReminders } from '@/lib/db';
import type { Transaction, Reminder } from '@/lib/types';
import { subDays } from 'date-fns';

export async function getTransactions(): Promise<Transaction[]> {
    return dbGetTransactions();
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    return dbAddTransaction(transaction);
}

export async function getReminders(): Promise<Reminder[]> {
    return dbGetReminders();
}

export async function addReminder(reminder: Omit<Reminder, 'id' | 'description'> & { description?: string }): Promise<Reminder> {
    const reminderData = { ...reminder, description: reminder.description || '' };
    return dbAddReminder(reminderData);
}

export async function getFinancialYearTransactions(): Promise<Transaction[]> {
    const allTransactions = await dbGetTransactions();
    const oneYearAgo = subDays(new Date(), 365);
    return allTransactions.filter(t => new Date(t.date) >= oneYearAgo);
}
