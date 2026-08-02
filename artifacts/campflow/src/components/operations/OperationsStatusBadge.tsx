import { Badge } from '@/components/ui/badge';

const labels: Record<string, string> = { confirmed: 'Approved', pending: 'Pending', cancelled: 'Cancelled', completed: 'Completed', no_show: 'No show' };

export default function OperationsStatusBadge({ status }: { status?: string }) {
  const value = status ?? 'pending';
  const variant = value === 'cancelled' || value === 'no_show' ? 'destructive' : value === 'confirmed' ? 'default' : value === 'completed' ? 'outline' : 'secondary';
  return <Badge variant={variant}>{labels[value] ?? value.replace('_', ' ')}</Badge>;
}
