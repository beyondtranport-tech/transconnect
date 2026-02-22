'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, sendPasswordResetEmail, getIdToken } from 'firebase/auth';

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
import { Loader2, Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormValues = z.infer<typeof formSchema>;

function SignInFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const redirectParam = searchParams.get('redirect');

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
      const isAdmin = user.email === 'mkoton100@gmail.com';
      const defaultRedirect = isAdmin ? '/adminaccount' : '/account';
      router.replace(redirectParam || defaultRedirect);
    }
  }, [user, isUserLoading, router, redirectParam]);


  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: searchParams.get('email') || '',
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
    
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Could not connect to authentication service. Please try again later.',
        });
        return;
    }
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${email}, a password reset link has been sent.`,
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error sending reset email',
        description: 'Please try again later.',
      });
    } finally {
        setIsLoading(false);
    }
  };


  const onSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Initialization Error',
            description: 'Services are not ready. Please try again in a moment.',
        });
        setIsLoading(false);
        return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const loggedInUser = userCredential.user;
      
      const idToken = await getIdToken(loggedInUser, true);
      const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to set session cookie.');
      }
      
      // Explicitly call checkAndCreateUser after successful sign-in
      const checkAndCreateUserResponse = await fetch('/api/checkAndCreateUser', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Body can be empty for sign-in
      });

      if (!checkAndCreateUserResponse.ok) {
        const result = await checkAndCreateUserResponse.json();
        // Log error but don't block the user, as the user document might already exist.
        console.error("checkAndCreateUser call failed on sign-in:", result.error);
      }

      toast({
        title: 'Sign In Successful',
        description: 'Redirecting to your dashboard...',
      });
      
      const isAdmin = loggedInUser.email === 'mkoton100@gmail.com';
      const defaultRedirect = isAdmin ? '/adminaccount' : '/account';
      
      router.push(redirectParam || defaultRedirect);

    } catch (error: any) {
      let title = 'An error occurred.';
      let description = 'Please check your credentials and try again.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        title = 'Invalid Credentials';
        description = 'The email or password you entered is incorrect.';
      } else {
        description = error.message;
      }

      toast({
        variant: 'destructive',
        title,
        description,
      });
       setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">
          Member Sign In
        </CardTitle>
        <CardDescription>
          Access your Logistics Flow account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        <Input
                            type={showPassword ? "text" : "password"}
                            className="pr-10"
                            autoComplete="current-password"
                            {...field}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowPassword((prev) => !prev)}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/join" className="underline">
            Join Now
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
    return (
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
            <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
                <SignInFormComponent />
            </Suspense>
        </div>
    )
}
