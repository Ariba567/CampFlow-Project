import { Badge } from '@/components/ui/badge';
export default function ReservationStatus({ status }: { status?: string }) { const value = status ?? 'pending'; return <Badge variant={value === 'cancelled' ? 'destructive' : value === 'completed' ? 'outline' : value === 'confirmed' ? 'default' : 'secondary'}>{value.replace('_', ' ')}</Badge>; }
