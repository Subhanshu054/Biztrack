
import fs from 'fs/promises';
import path from 'path';
import type { Transaction, CalendarEvent } from './types';

// NOTE: in a real-world scenario, you would want to use a proper database.
// For this prototype, we'll use a JSON file as a simple "database".
const dbPath = path.join(process.cwd(), 'data', 'db.json');

type DbData = {
  transactions: Transaction[];
  events: CalendarEvent[];
};

async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data);
    
    // Dates are stored as ISO strings in JSON, so we need to convert them back to Date objects
    if (parsedData.transactions) {
      parsedData.transactions.forEach((t: any) => t.date = new Date(t.date));
    }
    if (parsedData.events) {
      parsedData.events.forEach((e: any) => e.date = new Date(e.date));
    }
    
    return parsedData;
  } catch (error) {
    // If the file doesn't exist or is empty, return a default structure
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeDb({ transactions: [], events: [] });
      return { transactions: [], events: [] };
    }
    console.error("Failed to read or parse db.json", error);
    // Return empty structure on other errors to prevent app crash
    return { transactions: [], events: [] };
  }
}

async function writeDb(data: DbData) {
  try {
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to db.json", error);
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await readDb();
  // Sort by date descending
  return (db.transactions || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const db = await readDb();
  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now().toString(),
  };
  if (!db.transactions) {
    db.transactions = [];
  }
  db.transactions.push(newTransaction);
  await writeDb(db);
  return newTransaction;
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const db = await readDb();
  return db.events || [];
}

export async function addEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const db = await readDb();
  const newEvent: CalendarEvent = {
    ...event,
    description: event.description || '',
    id: Date.now().toString(),
  };
  if (!db.events) {
    db.events = [];
  }
  db.events.push(newEvent);
  await writeDb(db);
  return newEvent;
}
