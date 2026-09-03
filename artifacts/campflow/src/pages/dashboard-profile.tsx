import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { ArrowUpRight, KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import { toast } from 'sonner';

type ContactValues = { firstName: string; lastName: string; email: string; phone: string };
type PasswordValues = { password: string; confirmPassword: string };
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const message = (error: unknown) => error instanceof AxiosError ? String(error.response?.data?.error ?? 'We could not save your changes.') : 'We could not save your changes.';

export default function DashboardProfile() {
  const { user, refreshUser, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const contact = useForm<ContactValues>({ defaultValues: { firstName: '', lastName: '', email: '', phone: '' } });
  const password = useForm<PasswordValues>({ defaultValues: { password: '', confirmPassword: '' } });

  useEffect(() => {
    if (user) contact.reset({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? '' });
  }, [user, contact]);

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }
  if (!user) return <ErrorState title="Profile unavailable" message="Please sign in again to manage your profile." />;

  const saveContact = async (values: ContactValues) => {
    setError(null);
    try {
      await authService.updateProfile(user.id, values);
      await refreshUser();
      toast.success('Profile saved');
    } catch (caught) {
      setError(message(caught));
    }
  };

  const savePassword = async ({ password: newPassword }: PasswordValues) => {
    setError(null);
    try {
      await authService.updateProfile(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        password: newPassword,
      });
      password.reset();
      toast.success('Password updated');
    } catch (caught) {
      setError(message(caught));
    }
  };

  return (
    <div className="container-page mx-auto max-w-4xl space-y-16 pb-16">
      <section className="border-b border-border/60 pb-12">
        <p className="eyebrow">Your account</p>
        <h1 className="display-1 mt-5">Profile settings</h1>
        <p className="lede mt-5 max-w-2xl">
          Keep your details current so we can make every stay feel easy &mdash; from the
          first reservation to the morning you check out.
        </p>
      </section>

      {error && (
        <ErrorState title="Changes not saved" message={error} />
      )}

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Who you are</p>
            <h2 className="display-3 mt-3">Personal details</h2>
          </div>
          <span className="hidden font-serif text-sm italic text-muted-foreground sm:inline">01</span>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="font-serif text-2xl">Contact information</CardTitle>
                <p className="lede mt-1 text-sm">Your name and how we reach you.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...contact}>
              <form onSubmit={contact.handleSubmit(saveContact)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={contact.control}
                    name="firstName"
                    rules={{ required: 'First name is required', minLength: { value: 2, message: 'Use at least 2 characters' } }}
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
                    control={contact.control}
                    name="lastName"
                    rules={{ required: 'Last name is required', minLength: { value: 2, message: 'Use at least 2 characters' } }}
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
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={contact.control}
                    name="email"
                    rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contact.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" autoComplete="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Save />Save changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Keep it yours</p>
            <h2 className="display-3 mt-3">Change password</h2>
          </div>
          <span className="hidden font-serif text-sm italic text-muted-foreground sm:inline">02</span>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="font-serif text-2xl">Security</CardTitle>
                <p className="lede mt-1 text-sm">
                  Use at least 8 characters, including a lowercase letter, an uppercase letter, and a number.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...password}>
              <form onSubmit={password.handleSubmit(savePassword)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={password.control}
                    name="password"
                    rules={{
                      required: 'Password is required',
                      pattern: { value: passwordRule, message: 'Use 8+ chars with upper, lower, and a number' },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={password.control}
                    name="confirmPassword"
                    rules={{
                      required: 'Please confirm your password',
                      validate: (value) => value === password.getValues('password') || 'Passwords do not match',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Encrypted end-to-end
                  </p>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Save />Update password
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-8">
        <p className="lede text-sm">
          Need to step away? Sign out from any device, anytime.
        </p>
        <Button asChild variant="outline" className="border-primary/30">
          <a href="/account/security">Manage security <ArrowUpRight /></a>
        </Button>
      </section>
    </div>
  );
}