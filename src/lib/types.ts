export type Transaction = {
  id: string;
  type: 'revenue' | 'expense';
  date: Date;
  amount: number;
  description: string;
  category: string;
};

export type Reminder = {
  id: string;
  date: Date;
  title: string;
  description: string;
};
