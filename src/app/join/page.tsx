'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { useAuth, useFirestore } from '@/firebase';
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
import { Loader2, Eye, EyeOff, Building2, User } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
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
  const auth = useAuth();
  const firestore = useFirestore();

  const userRole = searchParams.get('role');
  const financierType = searchParams.get('type');

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (values: JoinFormValues) => {
    setIsLoading(true);
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Initialization Error',
        description: 'Firebase is not ready. Please try again in a moment.',
      });
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

      const memberData: any = {
        id: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        companyName: values.companyName,
        membershipId: 'free', // Default to a free plan
        rewardPoints: 0,
        walletBalance: 0,
      };

      // This is the special logic to make the specified user an admin upon signup.
      if (values.email === 'transconnect@gmail.com') {
        memberData.admin = true;
      }

      if (userRole) {
        memberData.role = userRole;
      }
      if (financierType) {
        memberData.financierType = financierType;
      }

      const memberDocRef = doc(firestore, 'members', user.uid);
      
      await setDoc(memberDocRef, memberData);

      toast({
        title: 'Account Created!',
        description: "Welcome to TransConnect. You're now signed in.",
      });

      const redirectUrl = '/account';
      router.push(redirectUrl);

    } catch (error: any) {
      let title = 'An error occurred.';
      let description = 'Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        title = 'Email already in use.';
        description = 'Please sign in or use a different email address.';
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
  
  const getRoleLabel = () => {
    if (!userRole) return null;
    let label = userRole.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (financierType) {
      label += ` (${financierType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())})`;
    }
    return label;
  }
  
  const RoleIcon = userRole === 'financier' ? Building2 : User;
  const roleLabel = getRoleLabel();


  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">
          Join TransConnect
        </CardTitle>
        <CardDescription>
          Create your free account to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {roleLabel && (
          <div className="mb-4">
            <Badge variant="outline" className="w-full justify-center p-2 text-sm">
                <RoleIcon className="mr-2 h-4 w-4" />
                Registering as: {roleLabel}
            </Badge>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe Transport Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/signin" className="underline">
            Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function JoinPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <Suspense fallback={<div>Loading...</div>}>
        <JoinFormComponent />
      </Suspense>
    </div>
  );
}

    