'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, Save } from 'lucide-react';
import { getClientSideAuthToken, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query } from 'firebase/firestore';

const memberFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  membershipId: z.string().min(1, 'Membership plan is required.'),
  status: z.enum(['pending', 'active', 'suspended']),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

interface EditMemberDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  member: any;
  onUpdate: () => void;
}

export function EditMemberDialog({ isOpen, setIsOpen, member, onUpdate }: EditMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const membershipsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'memberships')) : null, [firestore]);
  const { data: memberships, isLoading: areMembershipsLoading } = useCollection(membershipsQuery);

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
  });
  
  useEffect(() => {
    if (member && isOpen) {
        form.reset({
            companyName: member.companyName || '',
            membershipId: member.membershipId || 'free',
            status: member.status || 'pending',
        });
    }
  }, [member, isOpen, form]);

  const onSubmit = async (values: MemberFormValues) => {
    setIsLoading(true);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      const dataToUpdate: any = {
        ...values,
        updatedAt: { _methodName: 'serverTimestamp' }
      };
      
      const isUpgradingToPaid = !['free', ''].includes(values.membershipId) && ['free', '', null, undefined, 'Plan001'].includes(member.membershipId);
      const isDowngradingToFree = values.membershipId === 'free' && !['free', '', null, undefined].includes(member.membershipId);

      if (isUpgradingToPaid) {
          // If createdAt is a string (from Firestore), convert it to a Date object.
          // Otherwise, assume it's a Firestore Timestamp and use its toDate() method.
          const startDate = typeof member.createdAt === 'string' 
              ? new Date(member.createdAt) 
              : member.createdAt.toDate();
          
          dataToUpdate.membershipStartDate = startDate;
          dataToUpdate.nextBillingDate = startDate; // Pass JS Date object
          dataToUpdate.isBillable = true;
      } else if (isDowngradingToFree) {
          dataToUpdate.isBillable = false;
      }


      const response = await fetch('/api/updateUserDoc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: `companies/${member.id}`,
          data: dataToUpdate
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update member details.');
      }

      toast({
        title: 'Member Updated',
        description: `${values.companyName}'s details have been saved.`,
      });

      onUpdate();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member Details</DialogTitle>
          <DialogDescription>
            Modify core details for {member?.companyName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="membershipId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Membership Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areMembershipsLoading}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={areMembershipsLoading ? 'Loading plans...' : 'Select a plan'} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {(memberships || []).map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Account Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
