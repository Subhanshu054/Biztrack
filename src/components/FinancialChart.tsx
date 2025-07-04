'use client';

import type { Transaction } from '@/lib/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface FinancialChartProps {
  transactions: Transaction[];
}

export default function FinancialChart({ transactions }: FinancialChartProps) {
  const data = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  }).map(day => {
    const dailyTransactions = transactions.filter(
      t => format(t.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
    const revenue = dailyTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = dailyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, 'MMM d'),
      revenue,
      expenses,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `$${value}`} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Legend iconSize={10} wrapperStyle={{fontSize: "14px"}}/>
        <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="Expenses" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
