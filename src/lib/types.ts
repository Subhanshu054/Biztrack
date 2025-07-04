export type Transaction = {
  id: string;
  type: 'revenue' | 'expense';
  date: Date;
  amount: number;
  description: string;
  category: string;
};

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  description: string;
};
