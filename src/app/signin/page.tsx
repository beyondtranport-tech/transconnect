
'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, sendPasswordResetEmail, getIdTokenResult } from 'firebase/auth';

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

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Ensure the cookie is set for the root path
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function SignInFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: searchParams.get('email') || '',
      password: '',
    },
  });
  
  useEffect(() => {
    // This effect handles redirection for already-logged-in users visiting the signin page.
    // The middleware should handle this, but this is a client-side backup.
    if (!isUserLoading && user) {
        const redirectParam = searchParams.get('redirect');
        const isAdmin = user.email === 'beyondtransport@gmail.com';
        const defaultRedirect = isAdmin ? '/backend' : '/account';
        router.replace(redirectParam || defaultRedirect);
    }
  }, [user, isUserLoading, router, searchParams]);

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
    }
  };


  const onSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Could not connect to authentication service. Please try again later.',
        });
        setIsLoading(false);
        return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      const decodedToken = await getIdTokenResult(user);
      
      // Set a cookie with the claims for the middleware to read.
      setCookie('decodedToken', JSON.stringify(decodedToken), 1);
      
      const redirectParam = searchParams.get('redirect');
      const isAdmin = user.email === 'beyondtransport@gmail.com';
      const defaultRedirect = isAdmin ? '/backend' : '/account';

      // After setting the cookie, push to the correct dashboard.
      // The middleware will see the cookie on the next request and allow the navigation.
      router.push(redirectParam || defaultRedirect);
      // We force a reload to ensure the new cookie state is picked up by the server and middleware.
      router.refresh();
      
    } catch (error: any) {
      let title = 'An error occurred.';
      let description = 'Please check your credentials and try again.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        title = 'Invalid Credentials';
        description = 'The email or password you entered is incorrect.';
      }

      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
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
          Access your TransConnect account.
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
                      <button type="button" onClick={handlePasswordReset} className="text-sm font-medium text-primary hover:underline">
                          Forgot password?
                      </button>
                  </div>
                  <div className="relative">
                      <FormControl>
                        <Input type={showPassword ? "text" : "password"} {...field} />
                      </FormControl>
                      <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                  </div>
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
