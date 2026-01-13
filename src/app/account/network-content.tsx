'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Handshake, Loader2, UserPlus, UploadCloud, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Schema for uploading a single lead
const leadFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

// Mock data for network performance
const initialNetworkData = [
  { id: 'mem1', name: 'ABC Transport', status: 'Active', productsSold: 5, commissionEarned: 250 },
  { id: 'mem2', name: 'Freight Movers', status: 'Invited', productsSold: 0, commissionEarned: 0 },
  { id: 'mem3', name: 'Speedy Logistics', status: 'Active', productsSold: 12, commissionEarned: 600 },
  { id: 'mem4', name: 'SA Haulers', status: 'Prospect', productsSold: 0, commissionEarned: 0 },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

export default function NetworkContent() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [networkData, setNetworkData] = useState(initialNetworkData);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { companyName: '', contactName: '', contactEmail: '', contactPhone: '' },
  });

  const onSubmit = async (values: LeadFormValues) => {
    setIsLoading(true);
    // Simulate API call to submit lead
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Submitted lead:', values);

    // Add the new lead to the local state
    const newLead = {
      id: `mem${networkData.length + 1}`,
      name: values.companyName,
      status: 'Prospect',
      productsSold: 0,
      commissionEarned: 0,
    };
    setNetworkData(prevData => [newLead, ...prevData]);

    toast({
      title: 'Lead Uploaded!',
      description: `${values.companyName} has been added to your prospect list.`,
    });
    form.reset();
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Handshake />
            My Network & Referrals
          </CardTitle>
          <CardDescription>
            Manage your leads, track your network's growth, and see your commissions.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UploadCloud /> Upload a New Lead</CardTitle>
          <CardDescription>
            Add a potential member to your referral pipeline. We'll track their progress for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g., SA Haulage" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>Contact Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., John Smith" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email (Optional)</FormLabel><FormControl><Input placeholder="e.g., john@sahaulage.co.za" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone (Optional)</FormLabel><FormControl><Input placeholder="e.g., 082 123 4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Add Lead
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Network Performance</CardTitle>
          <CardDescription>
            Monitor the status and activity of members you've referred.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Products Sold</TableHead>
                        <TableHead className="text-right">Commission Earned</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {networkData.map(member => (
                        <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>
                              <Badge variant={
                                member.status === 'Active' ? 'default' 
                                : member.status === 'Prospect' ? 'outline'
                                : 'secondary'
                              }>
                                {member.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center flex items-center justify-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                {member.productsSold}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold flex items-center justify-end gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                {formatCurrency(member.commissionEarned)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
