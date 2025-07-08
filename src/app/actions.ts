
'use server';

import { addTransaction as dbAddTransaction, getTransactions as dbGetTransactions, addEvent as dbAddEvent, getEvents as dbGetEvents } from '@/lib/db';
import type { Transaction, CalendarEvent } from '@/lib/types';
import { subDays } from 'date-fns';

export async function getTransactions(): Promise<Transaction[]> {
    return dbGetTransactions();
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    return dbAddTransaction(transaction);
}

export async function getEvents(): Promise<CalendarEvent[]> {
    return dbGetEvents();
}

export async function addEvent(event: Omit<CalendarEvent, 'id' | 'description'> & { description?: string }): Promise<CalendarEvent> {
    const eventData = { ...event, description: event.description || '' };
    return dbAddEvent(eventData);
}

export async function getFinancialYearTransactions(): Promise<Transaction[]> {
    const allTransactions = await dbGetTransactions();
    const oneYearAgo = subDays(new Date(), 365);
    return allTransactions.filter(t => new Date(t.date) >= oneYearAgo);
}
