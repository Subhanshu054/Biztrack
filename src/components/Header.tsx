import { Briefcase } from 'lucide-react';

export default function Header() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <Briefcase className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-bold text-foreground">BizTrack</h1>
    </div>
  );
}
