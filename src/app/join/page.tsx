
'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  getIdToken,
  sendPasswordResetEmail,
} from 'firebase/auth';

import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, User, Eye, EyeOff, Handshake, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type JoinFormValues = z.infer<typeof formSchema>;

function JoinFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authActionInitiated, setAuthActionInitiated] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading, forceRefresh } = useUser();
  const redirectParam = searchParams.get('redirect');

  // Attribution & Integrity Params
  const userRole = searchParams.get('role');
  const financierType = searchParams.get('type');
  const referrerId = searchParams.get('ref');
  const emailParam = searchParams.get('email');
  const firstNameParam = searchParams.get('firstName');
  const lastNameParam = searchParams.get('lastName');
  const phoneParam = searchParams.get('phone');

  // This effect handles the final redirect after the user profile is confirmed to be loaded.
  useEffect(() => {
    if (authActionInitiated && !isUserLoading && user?.uid && user?.companyId) {
        setIsLoading(false);
        setAuthActionInitiated(false);
        toast({
            title: 'Account Ready!',
            description: "Redirecting to your dashboard...",
        });
        const isAdmin = user.claims?.admin === true || user.email === 'mkoton100@gmail.com' || user.email === 'beyondtransport@gmail.com';
        const defaultRedirect = isAdmin ? '/adminaccount' : '/account';
        router.push(redirectParam || defaultRedirect);
    }
  }, [authActionInitiated, isUserLoading, user, router, redirectParam, toast]);

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: firstNameParam || '',
      lastName: lastNameParam || '',
      email: emailParam || '',
      phone: phoneParam || '',
      password: '',
    },
  });

  const handlePasswordReset = async () => {
    const email = form.getValues('email');
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }
    
    if (!auth) return;
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${email}, a password reset link has been sent.`,
      });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error sending reset email', description: 'Please try again later.' });
    } finally {
        setIsLoading(false);
    }
  };


  const onSubmit = async (values: JoinFormValues) => {
    setIsLoading(true);
    if (!auth) {
      toast({ variant: 'destructive', title: 'Initialization Error', description: 'Services are not ready. Please try again.' });
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      });
      
      const token = await getIdToken(user, true);
      
      const checkAndCreateUserResponse = await fetch('/api/checkAndCreateUser', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ referrerId }),
      });
      
      if (!checkAndCreateUserResponse.ok) {
          const result = await checkAndCreateUserResponse.json();
          throw new Error(result.error || "Failed to create user profile.");
      }
      
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      setAuthActionInitiated(true);
      forceRefresh();
      
      toast({ title: 'Account Created!', description: "Finalizing your profile..." });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Join Failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };
  
  const roleLabel = userRole?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">Join Logistics Flow</CardTitle>
        <CardDescription>Create your secure account to access the ecosystem.</CardDescription>
      </CardHeader>
      <CardContent>
        {roleLabel && (
          <div className="mb-4">
            <Badge variant="outline" className="w-full justify-center p-2 text-sm">
                Registering as: {roleLabel}
            </Badge>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {emailParam && (
                <div className="bg-primary/5 p-3 rounded-md border border-primary/20 flex items-center gap-3 mb-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <p className="text-xs text-primary font-medium">Your registration email is locked to ensure lead attribution.</p>
                </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input placeholder="you@example.com" {...field} disabled={!!emailParam} />
                        {!!emailParam && <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <button type="button" onClick={handlePasswordReset} className="text-sm font-medium text-primary hover:underline" disabled={isLoading}>
                          Forgot password?
                      </button>
                  </div>
                  <FormControl>
                    <div className="relative">
                        <Input type={showPassword ? "text" : "password"} className="pr-10" autoComplete="new-password" {...field} />
                        <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent" onClick={() => setShowPassword((prev) => !prev)}>
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Creating Account...' : 'Create Free Account'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account? <Link href="/signin" className="underline">Sign In</Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function JoinPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
        <JoinFormComponent />
      </Suspense>
    </div>
  );
}
