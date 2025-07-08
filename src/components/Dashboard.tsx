'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Sparkles,
  Loader2,
  Download,
} from 'lucide-react';
import type { Transaction, CalendarEvent } from '@/lib/types';
import { suggestFinancialCategories } from '@/ai/flows/suggest-financial-categories';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Header from './Header';
import FinancialChart from './FinancialChart';

const transactionSchema = z.object({
  type: z.enum(['revenue', 'expense']),
  date: z.date(),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
});

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.date(),
  description: z.string().optional(),
});

export default function Dashboard() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
      amount: 0,
      description: '',
      category: '',
    },
  });

  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: '', date: selectedDate, description: '' }
  });

  const financialSummary = useMemo(() => {
    const revenue = transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { revenue, expenses, profit: revenue - expenses };
  }, [transactions]);
  
  const selectedDayEvents = useMemo(() => {
    return events.filter(e => format(e.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));
  }, [events, selectedDate]);

  async function onTransactionSubmit(values: z.infer<typeof transactionSchema>) {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...values,
    };
    setTransactions(prev => [newTransaction, ...prev]);
    transactionForm.reset();
    setSuggestedCategories([]);
    toast({ title: "Success", description: "Transaction added." });
  }

  async function handleSuggestCategories() {
    const description = transactionForm.getValues('description');
    if (!description) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a description first.' });
      return;
    }
    setIsSuggesting(true);
    setSuggestedCategories([]);
    try {
      const result = await suggestFinancialCategories({ description });
      setSuggestedCategories(result.categories);
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Error', description: 'Could not suggest categories.' });
    } finally {
      setIsSuggesting(false);
    }
  }

  function onEventSubmit(values: z.infer<typeof eventSchema>) {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      ...values,
      description: values.description || '',
    };
    setEvents(prev => [...prev, newEvent]);
    eventForm.reset({ title: '', date: selectedDate, description: '' });
    setIsEventDialogOpen(false);
    toast({ title: "Success", description: "Event added to calendar." });
  }
  
  function handleExportTransactions() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    if (monthlyTransactions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Transactions',
        description: 'There are no transactions for the current month to export.',
      });
      return;
    }

    const headers = ['ID', 'Type', 'Date', 'Amount', 'Description', 'Category'];
    const csvRows = [
      headers.join(','),
      ...monthlyTransactions.map(t =>
        [
          t.id,
          t.type,
          format(t.date, 'yyyy-MM-dd'),
          t.amount,
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.category.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Transactions for the current month exported.' });
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Header currency={currency} setCurrency={setCurrency} />
      <div className="grid gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{financialSummary.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{financialSummary.expenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialSummary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currencySymbol}{financialSummary.profit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
              <CardDescription>Log a new revenue or expense entry.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...transactionForm}>
                <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                  <FormField
                    control={transactionForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="expense" />
                              </FormControl>
                              <FormLabel className="font-normal">Expense</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="revenue" />
                              </FormControl>
                              <FormLabel className="font-normal">Revenue</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={transactionForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Office lunch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={transactionForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={transactionForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input placeholder="e.g., Marketing" {...field} />
                            </FormControl>
                            {transactionForm.getValues('type') === 'expense' && (
                              <Button type="button" variant="outline" size="icon" onClick={handleSuggestCategories} disabled={isSuggesting}>
                                {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                          {suggestedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {suggestedCategories.map(cat => (
                                <Badge key={cat} variant="secondary" className="cursor-pointer" onClick={() => transactionForm.setValue('category', cat, { shouldValidate: true })}>{cat}</Badge>
                              ))}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={transactionForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">Add Transaction</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>View and export your recent transactions.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell>{format(t.date, 'dd MMM, yyyy')}</TableCell>
                        <TableCell className={`text-right ${t.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'revenue' ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialChart transactions={transactions} currency={currency} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Manage your appointments and events.</CardDescription>
              </div>
              <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Event</DialogTitle>
                  </DialogHeader>
                  <Form {...eventForm}>
                    <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4">
                      <FormField control={eventForm.control} name="title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl><Input placeholder="e.g., Project Kick-off" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={eventForm.control} name="date" render={({ field }) => (
                         <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                           <Popover>
                             <PopoverTrigger asChild>
                               <FormControl>
                                 <Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>
                                   {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                   <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                               </FormControl>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                             </PopoverContent>
                           </Popover>
                           <FormMessage />
                         </FormItem>
                      )} />
                      <FormField control={eventForm.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input placeholder="Optional details..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit">Create Event</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="flex flex-col lg:flex-row gap-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => setSelectedDate(day || new Date())}
                className="rounded-md border"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Events for {format(selectedDate, 'PPP')}</h3>
                 <ScrollArea className="h-48">
                  {selectedDayEvents.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedDayEvents.map(event => (
                        <li key={event.id} className="p-2 rounded-md border bg-secondary/50">
                          <p className="font-semibold text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground pt-2">No events for this day.</p>
                  )}
                 </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
