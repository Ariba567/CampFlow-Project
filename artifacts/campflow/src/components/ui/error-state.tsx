import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again or refresh the page.',
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-sm ${className}`}>
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
