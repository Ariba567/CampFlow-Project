import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PagePlaceholderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionPath?: string;
}

export default function PagePlaceholder({
  title,
  subtitle = 'This page is under construction. We are shaping the perfect outdoor experience for you.',
  actionLabel = 'Return home',
  actionPath = '/',
}: PagePlaceholderProps) {
  return (
    <div className="grid min-h-[70vh] place-items-center py-12">
      <Card className="w-full max-w-3xl rounded-[2rem] border border-border bg-card/95 shadow-2xl shadow-primary/10">
        <CardHeader className="text-center py-16 px-8 md:px-14">
          <CardTitle className="text-4xl font-serif tracking-tight text-foreground md:text-5xl">
            {title}
          </CardTitle>
          <CardDescription className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {subtitle}
          </CardDescription>
          <div className="mt-10 flex justify-center">
            <Button asChild>
              <Link to={actionPath}>{actionLabel}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 px-8 pb-10 pt-4 text-center text-sm text-muted-foreground">
          <p>Designed for nature stays with a serene palette and spacious layout.</p>
          <p>Use this shell to begin building product pages without wiring API logic yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
