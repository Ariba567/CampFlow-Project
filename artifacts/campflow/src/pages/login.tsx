import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { LogIn, Trees } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import type { LoginInput } from '@/types';

const getErrorMessage = (error: unknown) => error instanceof AxiosError ? String(error.response?.data?.error ?? 'We could not sign you in. Please try again.') : 'We could not sign you in. Please try again.';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    defaultValues: { email: '', password: '' },
  });

  const submit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await login(values);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-background">
      <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative hidden bg-primary text-primary-foreground md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-primary/90" aria-hidden="true" />
            <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0, transparent 45%)' }} />
            <div className="relative flex flex-1 flex-col justify-between p-12">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
                  <Trees className="h-5 w-5" />
                </div>
                <p className="eyebrow text-primary-foreground/80">Green Valley Campgrounds</p>
              </div>
              <div>
                <p className="eyebrow text-accent">Welcome back</p>
                <blockquote className="mt-4 font-serif text-4xl leading-[1.15] tracking-tight text-primary-foreground sm:text-5xl">
                  “Your next good story starts outside.”
                </blockquote>
                <p className="mt-8 max-w-sm text-sm leading-6 text-primary-foreground/75">
                  Sign in to keep your favorite stays, campfire recipes, and weekend plans close at hand.
                </p>
              </div>
              <p className="text-xs tracking-[0.18em] text-primary-foreground/50 uppercase">Est. 1972 · Pine Hollow</p>
            </div>
          </aside>

          <div className="flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-md">
              <p className="eyebrow text-primary">Sign in</p>
              <h1 className="display-3 mt-3 text-foreground">Welcome back</h1>
              <p className="lede mt-3 text-muted-foreground">Pick up where you left off on your next outdoor escape.</p>

              {serverError && (
                <ErrorState className="mt-6 p-5 text-left" title="Sign-in unavailable" message={serverError} />
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)} className="mt-8 space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    rules={{ required: 'Password is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" placeholder="Your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Spinner />
                        Signing in…
                      </>
                    ) : (
                      <>
                        <LogIn />
                        Sign in
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <p className="mt-8 text-sm text-muted-foreground">
                New to Green Valley?{' '}
                <Link className="font-medium text-primary hover:underline" to="/register">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}