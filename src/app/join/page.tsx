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
  CardFooter,
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
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { roles } from '@/lib/roles';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  // URL Params
  const initialRole = searchParams.get('role');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(initialRole);
  
  const referrerId = searchParams.get('ref');
  const emailParam = searchParams.get('email');
  const firstNameParam = searchParams.get('firstName');
  const lastNameParam = searchParams.get('lastName');
  const phoneParam = searchParams.get('phone');

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
       toast({ variant: 'destructive', title: 'Error sending reset email' });
    } finally {
        setIsLoading(false);
    }
  };

  const onSubmit = async (values: JoinFormValues) => {
    if (!selectedPosition) {
        toast({ variant: 'destructive', title: 'Position Required', description: 'Please declare your position first.' });
        return;
    }
    setIsLoading(true);
    if (!auth) {
      toast({ variant: 'destructive', title: 'Initialization Error' });
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: `${values.firstName} ${values.lastName}` });
      const token = await getIdToken(user, true);
      
      const response = await fetch('/api/checkAndCreateUser', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrerId, role: selectedPosition }),
      });
      
      if (!response.ok) throw new Error((await response.json()).error || "Registration failed.");
      
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      setAuthActionInitiated(true);
      forceRefresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Join Failed', description: error.message });
      setIsLoading(false);
    }
  };

  if (!selectedPosition) {
      return (
          <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Choose Your Position</CardTitle>
                <CardDescription>Select the role that best describes your business goals within the ecosystem.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[50vh] pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            return (
                                <Button 
                                    key={role.id}
                                    variant="outline" 
                                    className="h-auto min-h-[100px] justify-start px-6 gap-4 border-2 hover:border-primary transition-all" 
                                    onClick={() => setSelectedPosition(role.id)}
                                >
                                    <div className="bg-primary/10 p-2 rounded-full shrink-0"><Icon className="text-primary"/></div>
                                    <div className="text-left py-2">
                                        <p className="font-bold">{role.title}</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight mt-1">{role.description}</p>
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
          </div>
      )
  }

  const selectedRoleData = roles.find(r => r.id === selectedPosition);

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">Register Your Account</CardTitle>
        <CardDescription className="flex items-center justify-center gap-2 mt-2">
            Setting up your <Badge variant="secondary" className="capitalize">{selectedRoleData?.title || selectedPosition}</Badge> profile. 
            <Button variant="link" size="sm" className="px-1 h-auto text-xs" onClick={() => setSelectedPosition(null)}>Change Role</Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email Address</FormLabel><FormControl><div className="relative"><Input {...field} disabled={!!emailParam} />{!!emailParam && <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />}</div></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><div className="flex items-center justify-between"><FormLabel>Password</FormLabel><button type="button" onClick={handlePasswordReset} className="text-xs text-primary underline">Forgot?</button></div>
                <FormControl><div className="relative"><Input type={showPassword ? "text" : "password"} {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full py-6 text-lg font-bold mt-6" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create My Account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center border-t py-4 bg-muted/20">
        <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/signin" className="text-primary font-bold hover:underline ml-1">Sign In</Link>
        </p>
      </CardFooter>
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
