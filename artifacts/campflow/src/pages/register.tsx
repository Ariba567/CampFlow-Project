import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { ArrowRight, Trees } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import type { RegisterInput } from '@/types';

type RegisterValues = RegisterInput & { confirmPassword: string };
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const getErrorMessage = (error: unknown) => error instanceof AxiosError ? String(error.response?.data?.error ?? 'We could not create your account. Please try again.') : 'We could not create your account. Please try again.';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const submit = async ({ confirmPassword, phone, ...values }: RegisterValues) => {
    setServerError(null);
    try {
      const normalizedPhone = phone?.trim();
      await register(
        normalizedPhone ? { ...values, phone: normalizedPhone } : values,
      );
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-background">
      <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:grid-cols-[1.2fr_1fr]">
          <aside className="relative hidden bg-primary text-primary-foreground md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-primary/90" aria-hidden="true" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 25%, rgba(255,255,255,0.55) 0, transparent 40%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.45) 0, transparent 45%)',
              }}
            />
            <div className="relative flex flex-1 flex-col justify-between p-12">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
                  <Trees className="h-5 w-5" />
                </div>
                <p className="eyebrow text-primary-foreground/80">Green Valley Campgrounds</p>
              </div>
              <div>
                <p className="eyebrow text-accent">Begin here</p>
                <blockquote className="mt-4 font-serif text-4xl leading-[1.15] tracking-tight text-primary-foreground sm:text-5xl">
                  “The trail you’ll love tomorrow starts with a single booking.”
                </blockquote>
                <p className="mt-8 max-w-sm text-sm leading-6 text-primary-foreground/75">
                  Create an account to save your favorite cabins, plan group trips, and pick up seasonal offers from the valley.
                </p>
                <ul className="mt-8 space-y-2 text-sm text-primary-foreground/80">
                  <li className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Curated stays across the valley</li>
                  <li className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Member-only weekend availability</li>
                  <li className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Trip planning that travels with you</li>
                </ul>
              </div>
              <p className="text-xs tracking-[0.18em] text-primary-foreground/50 uppercase">Est. 1972 · Pine Hollow</p>
            </div>
          </aside>

          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
              <p className="eyebrow text-primary">Create account</p>
              <h1 className="display-3 mt-3 text-foreground">Start your next escape.</h1>
              <p className="lede mt-3 text-muted-foreground">A few details and you’ll be ready to plan your stay.</p>

              {serverError && (
                <ErrorState className="mt-6 p-5 text-left" title="Account not created" message={serverError} />
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      rules={{
                        required: 'First name is required',
                        minLength: { value: 2, message: 'Use at least 2 characters' },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input autoComplete="given-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      rules={{
                        required: 'Last name is required',
                        minLength: { value: 2, message: 'Use at least 2 characters' },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input autoComplete="family-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                    name="phone"
                    rules={{
                      pattern: {
                        value: /^$|^\+?[\d\s\-().]{7,20}$/,
                        message: 'Enter a valid phone number',
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone <span className="font-normal text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="tel" autoComplete="tel" placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="password"
                      rules={{
                        required: 'Password is required',
                        pattern: { value: passwordRule, message: 'Use 8+ characters with upper, lower, and number' },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      rules={{
                        required: 'Please confirm your password',
                        validate: (value) => value === form.getValues('password') || 'Passwords do not match',
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Passwords need at least 8 characters, including uppercase, lowercase, and a number.
                  </p>

                  <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Spinner />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <p className="mt-8 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link className="font-medium text-primary hover:underline" to="/login">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}