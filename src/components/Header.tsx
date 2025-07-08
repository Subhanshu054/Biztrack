import { Briefcase } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaderProps {
    currency: 'USD' | 'INR';
    setCurrency: (currency: 'USD' | 'INR') => void;
}

export default function Header({ currency, setCurrency }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">BizTrack</h1>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Currency</span>
            <Select value={currency} onValueChange={(value: 'USD' | 'INR') => setCurrency(value)}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
  );
}
