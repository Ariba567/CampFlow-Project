import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { LogIn, Trees } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import ErrorState from '@/components/ui/error-state';
import type { LoginInput } from '@/types';

const getErrorMessage = (error: unknown) => error instanceof AxiosError ? String(error.response?.data?.error ?? 'We could not sign you in. Please try again.') : 'We could not sign you in. Please try again.';

export default function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ defaultValues: { email: '', password: '' } });
  const submit = async (values: LoginInput) => { setServerError(null); try { await login(values); const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'; navigate(from, { replace: true }); } catch (error) { setServerError(getErrorMessage(error)); } };
  return <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl md:grid-cols-[0.85fr_1.15fr]"><aside className="hidden bg-primary p-10 text-primary-foreground md:flex md:flex-col md:justify-between"><div><div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Trees className="h-5 w-5" /></div><p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">Welcome back</p><h1 className="mt-3 font-serif text-5xl leading-tight">Your next good story starts outside.</h1></div><p className="text-sm leading-6 text-primary-foreground/75">Sign in to keep your favorite stays and camping plans close at hand.</p></aside><div className="p-6 sm:p-10"><div className="max-w-md"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Green Valley Campgrounds</p><h1 className="mt-3 font-serif text-4xl tracking-tight">Welcome back</h1><p className="mt-3 text-muted-foreground">Sign in to manage your Green Valley experience.</p>{serverError && <ErrorState className="mt-6 p-5 text-left" title="Sign-in unavailable" message={serverError} />}<Form {...form}><form onSubmit={form.handleSubmit(submit)} className="mt-7 space-y-5"><FormField control={form.control} name="email" rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } }} render={({ field }) => <FormItem><FormLabel>Email address</FormLabel><FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="password" rules={{ required: 'Password is required' }} render={({ field }) => <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" autoComplete="current-password" placeholder="Your password" {...field} /></FormControl><FormMessage /></FormItem>} /><Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><Spinner />Signing in…</> : <><LogIn />Sign in</>}</Button></form></Form><p className="mt-7 text-sm text-muted-foreground">New to Green Valley? <Link className="font-medium text-primary hover:underline" to="/register">Create an account</Link></p></div></div></div>;
}
