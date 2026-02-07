
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Loader2, MessageSquare, PlusCircle, Edit, Trash2, Send, Copy } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, getClientSideAuthToken, useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { collection, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles as potentialRoles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Schema for the lead form
const leadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'invited', 'registered']).default('new'),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

// Shared InviteDialog
function InviteDialog({ lead, companyId, onInviteSent }: { lead: any, companyId: string, onInviteSent: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const { toast } = useToast();

    const onOpenChange = (open: boolean) => {
        if (!open) {
            setInviteLink('');
        }
        setIsOpen(open);
    };

    const handleGenerateLink = async () => {
        if (!lead.email) {
            toast({
                variant: 'destructive',
                title: 'Cannot Invite Lead',
                description: 'This lead does not have an email address. Please edit the lead to add one before inviting.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            // Update lead status to 'invited'
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'saveCompanyLead', 
                    payload: { companyId, lead: { id: lead.id, status: 'invited' } } 
                }),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            const nameParts = (lead.contactPerson || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            const baseUrl = window.location.origin;
            const link = `${baseUrl}/join?email=${encodeURIComponent(lead.email)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}${lead.phone ? `&phone=${encodeURIComponent(lead.phone)}` : ''}`;
            
            setInviteLink(link);
            
            toast({ title: "Invite Link Generated", description: "You can now share the secure link." });
            onInviteSent(); // Refresh table in the background
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Invite Failed', description: e.message });
            setIsOpen(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        toast({ title: 'Link Copied!' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Invite Lead" disabled={lead.status === 'invited' || lead.status === 'registered'}>
                    <Send className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite {lead.companyName}</DialogTitle>
                     <DialogDescription>
                        {inviteLink
                          ? "Share this secure sign-up link. It will pre-fill their email on the registration form."
                          : `This will generate a sign-up link for ${lead.email || 'this lead'}.`}
                    </DialogDescription>
                </DialogHeader>
                
                {isLoading && (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                )}
                
                {inviteLink && (
                    <div className="flex items-center space-x-2 py-4">
                        <Input value={inviteLink} readOnly />
                        <Button onClick={copyToClipboard}>
                           <Copy className="mr-2 h-4 w-4" />
                           Copy Link
                        </Button>
                    </div>
                )}

                <DialogFooter>
                    {inviteLink ? (
                        <Button onClick={() => onOpenChange(false)}>Done</Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                            <Button onClick={handleGenerateLink} disabled={isLoading}>
                               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                               Generate Invite Link
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function MessageDialog({ lead, companyId }: { lead: any, companyId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !companyId || !lead?.id) return null;
        return query(
            collection(firestore, `companies/${companyId}/leads/${lead.id}/messages`),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, companyId, lead]);

    const { data: messages, isLoading: areMessagesLoading, forceRefresh } = useCollection(messagesQuery);

    const participants = useMemo(() => {
        if (!messages || messages.length === 0 || !user) return { agentId: user?.uid || null, leadId: null };
    
        const agentId = user.uid;
        // Find the first sender who is NOT the current user (agent).
        const otherMessage = messages.find(m => m.senderId !== agentId);
        const otherId = otherMessage ? otherMessage.senderId : null;
    
        return { agentId, leadId: otherId };
    }, [messages, user]);

    useEffect(() => {
        if(isOpen) {
            forceRefresh();
        }
    }, [isOpen, forceRefresh]);


    const handleSend = async () => {
        if (!user || !message.trim()) return;
        setIsSending(true);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const path = `companies/${companyId}/leads/${lead.id}/messages`;
            const messageData = {
                text: message,
                senderId: user.uid,
                timestamp: serverTimestamp(),
                read: false,
            };

            const response = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: path, data: messageData }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to send message.');
            }
            
            setMessage('');
            forceRefresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Send Failed',
                description: error.message,
            });
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Message Lead">
                    <MessageSquare className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md flex flex-col h-[70vh]">
                <DialogHeader>
                    <DialogTitle>Chat with {lead.companyName}</DialogTitle>
                    <DialogDescription>
                        {lead.contactPerson || 'No contact person'} - {lead.email || 'No email'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 p-4 -mx-6 border-y">
                    <div className="space-y-4 px-6">
                        {areMessagesLoading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
                        {messages?.map((msg: any) => {
                            const isAgent = msg.senderId === participants.agentId;
                            // Any sender who is not the agent or the determined lead is an admin
                            const isAdmin = !isAgent && msg.senderId !== participants.leadId;
                            const alignment = isAgent ? "justify-end" : "justify-start";

                            return (
                                <div key={msg.id} className={cn("flex items-end gap-2", alignment)}>
                                    {!isAgent && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className={isAdmin ? 'bg-amber-500 text-white' : 'bg-muted'}>
                                                {isAdmin ? 'AD' : 'L'}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "rounded-lg px-3 py-2 max-w-[80%] text-sm", 
                                        isAgent ? "bg-primary text-primary-foreground" : 
                                        isAdmin ? "bg-amber-100 text-amber-900" :
                                        "bg-muted"
                                    )}>
                                        <p>{msg.text}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                    </div>
                                    {isAgent && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>YOU</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            );
                        })}
                        {messages?.length === 0 && !areMessagesLoading && (
                            <p className="text-center text-sm text-muted-foreground pt-8">No messages yet. Start the conversation!</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                    <Input 
                        placeholder="Type your message..." 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()}
                        disabled={isSending}
                    />
                    <Button onClick={handleSend} disabled={isSending || !message.trim()} size="icon">
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// LeadDialog for adding/editing leads
function LeadDialog({ lead, companyId, onSave, children }: { lead?: any, companyId: string, onSave: () => void, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteStep, setInviteStep] = useState(false);
  const [newLeadInfo, setNewLeadInfo] = useState<LeadFormValues | null>(null);

  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  });

  const onOpenChange = (open: boolean) => {
    if (!open) {
        form.reset();
        setInviteStep(false);
        setNewLeadInfo(null);
    }
    setIsOpen(open);
  }

  useEffect(() => {
    if (isOpen) {
      form.reset(lead || { companyName: '', contactPerson: '', email: '', phone: '', role: '', status: 'new', notes: '' });
    }
  }, [isOpen, lead, form]);

  const onSubmit = async (values: LeadFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

      const payload = { 
          lead: { 
              ...values,
              id: lead?.id, // Pass existing ID if editing
          },
          companyId: companyId
      };

      const response = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveCompanyLead', payload }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      toast({ title: lead ? 'Lead Updated' : 'Lead Added' });
      onSave();

      if (lead) { // If editing, just close
        setIsOpen(false);
      } else { // If creating, go to invite step
        setNewLeadInfo(values);
        setInviteStep(true);
      }
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!newLeadInfo?.email) return;

    const nameParts = (newLeadInfo.contactPerson || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const baseUrl = window.location.origin;
    const signupUrl = `${baseUrl}/join?email=${encodeURIComponent(newLeadInfo.email)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}${newLeadInfo.phone ? `&phone=${encodeURIComponent(newLeadInfo.phone)}` : ''}`;

    navigator.clipboard.writeText(signupUrl);
    toast({
        title: 'Sign-up Link Copied!',
        description: 'You can now send the link to the new lead.'
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        {inviteStep && newLeadInfo ? (
            <>
                 <DialogHeader>
                    <DialogTitle>Step 2: Invite Your Lead</DialogTitle>
                    <DialogDescription>
                        The lead for {newLeadInfo.companyName} has been created. Now, send them the secure sign-up link.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <p className="text-sm">Please copy the sign-up link and send it to <span className="font-semibold text-primary">{newLeadInfo.email}</span>. They will be invited to create an account.</p>
                     <Button onClick={copyInviteLink} className="w-full">
                        <Copy className="mr-2 h-4 w-4" /> Copy Sign-up Link
                    </Button>
                </div>
                 <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </>
        ) : (
            <>
                <DialogHeader>
                  <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                  <DialogDescription>
                    Enter the details for the potential member.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                      <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Potential Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{potentialRoles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="qualified">Qualified</SelectItem><SelectItem value="unqualified">Unqualified</SelectItem><SelectItem value="invited">Invited</SelectItem><SelectItem value="registered">Registered</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </form>
                </Form>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save Lead</Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}


// Main Component
export default function NetworkContent() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ companyId: string }>(userDocRef);
    const companyId = userData?.companyId;

    const leadsQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
        return collection(firestore, `companies/${companyId}/leads`);
    }, [firestore, companyId]);

    const { data: leads, isLoading: areLeadsLoading, forceRefresh } = useCollection(leadsQuery);
    
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);

    const handleDelete = async () => {
        if (!companyId || !selectedLead) return;
        
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            await fetch('/api/deleteUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `companies/${companyId}/leads/${selectedLead.id}` }),
            });
            
            toast({ title: "Lead Deleted" });
            forceRefresh();
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
            setDeleteAlertOpen(false);
            setSelectedLead(null);
        }
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
          accessorKey: 'companyName',
          header: 'Company Name',
          cell: ({ row }) => <div>{row.original.companyName}</div>
        },
        {
          accessorKey: 'contactPerson',
          header: 'Contact',
          cell: ({ row }) => <div>{row.original.contactPerson}</div>
        },
        {
          accessorKey: 'email',
          header: 'Email',
          cell: ({ row }) => <div>{row.original.email}</div>
        },
        {
          accessorKey: 'phone',
          header: 'Phone',
          cell: ({ row }) => <div>{row.original.phone}</div>
        },
        {
          accessorKey: 'role',
          header: 'Role',
          cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>
        },
        {
          id: 'actions',
          header: () => <div className="text-right">Actions</div>,
          cell: ({ row }) => (
            <div className="flex items-center justify-end">
              <MessageDialog lead={row.original} companyId={companyId!} />
              <InviteDialog lead={row.original} companyId={companyId!} onInviteSent={forceRefresh} />
              <LeadDialog lead={row.original} companyId={companyId!} onSave={forceRefresh}>
                <Button variant="ghost" size="icon" title="Edit Lead"><Edit className="h-4 w-4" /></Button>
              </LeadDialog>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedLead(row.original); setDeleteAlertOpen(true); }} title="Delete Lead">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [companyId, forceRefresh]);
    
    const isLoading = isUserLoading || isUserDocLoading || areLeadsLoading;

    return (
      <>
        {/* Main Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-2xl"><Handshake />My Network Leads</CardTitle>
                    <CardDescription>Add potential leads to provision their account and generate a secure sign-up link.</CardDescription>
                </div>
                {companyId && (
                    <LeadDialog companyId={companyId} onSave={forceRefresh}>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Lead</Button>
                    </LeadDialog>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : !companyId ? (
                     <div className="text-center py-10 text-muted-foreground">Could not load your company profile.</div>
                ) : (
                    <DataTable columns={columns} data={leads || []} />
                )}
            </CardContent>
        </Card>
        
        {/* Delete Confirmation */}
         <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action will permanently delete the lead for {selectedLead?.companyName}.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedLead(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    );
}

    