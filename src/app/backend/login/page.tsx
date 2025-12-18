
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { handleSecureAdminLogin } from './actions';

const formSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export default function SecureLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const result = await handleSecureAdminLogin(values.password);
        if (result && result.error) {
             toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: result.error,
            });
            setIsLoading(false);
        }
        // If successful, the server action will redirect. 
        // If we get here, it means there was an error that the action didn't handle with a redirect.
    } catch (error: any) {
        // The server action will throw an error on redirect, which is expected.
        // We only need to handle actual errors.
        if (error.message !== 'NEXT_REDIRECT') {
             toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'An unexpected error occurred.',
            });
            setIsLoading(false);
        }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl">Backend Access</CardTitle>
          <CardDescription>Enter the password to access the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Super Admin Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type={showPassword ? 'text' : 'password'} {...field} />
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
                Unlock
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
