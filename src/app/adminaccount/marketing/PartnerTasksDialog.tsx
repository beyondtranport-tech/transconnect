'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlusCircle, ClipboardList, Edit, Trash2, CheckCircle, Circle, User, Save } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { getClientSideAuthToken, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatDateSafe } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, orderBy } from 'firebase/firestore';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().min(1, 'Please assign this task to someone.'),
});
type TaskFormValues = z.infer<typeof taskSchema>;

async function fetchAdmins(token: string) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listAllUsers' }),
    });
    const result = await response.json();
    return result.success ? result.data : [];
}

function TaskForm({ partner, onTaskAdded }: { partner: any; onTaskAdded: () => void; }) {
    const { toast } = useToast();
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [admins, setAdmins] = useState<any[]>([]);
    
    const form = useForm<TaskFormValues>({ 
        resolver: zodResolver(taskSchema), 
        defaultValues: { title: '', description: '', dueDate: '', assigneeId: user?.uid || '' } 
    });

    useEffect(() => {
        const loadAdmins = async () => {
            try {
                const token = await getClientSideAuthToken();
                if (token) {
                    const data = await fetchAdmins(token);
                    setAdmins(data);
                }
            } catch (e) {
                console.error("Failed to load admins", e);
            }
        };
        loadAdmins();
    }, []);

    const onSubmit = async (values: TaskFormValues) => {
        setIsLoading(true);
        if (!user) {
            toast({ variant: 'destructive', title: 'Not logged in' });
            setIsLoading(false);
            return;
        }
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const taskData = { 
                ...values, 
                relatedToName: partner.name || `${partner.firstName} ${partner.lastName}`, 
                status: 'pending', 
                createdAt: { _methodName: 'serverTimestamp' },
                updatedAt: { _methodName: 'serverTimestamp' }
            };
            const path = `/partners/${partner.id}/tasks`;

            await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: path, data: taskData }),
            });
            
            toast({ title: 'Task Created' });
            onTaskAdded();
            form.reset({ title: '', description: '', dueDate: '', assigneeId: user.uid });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Add New CRM Task</h4>
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input placeholder="e.g., Follow up on signed proposal" {...field} /></FormControl><FormMessage /></FormItem> )} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="dueDate" render={({ field }) => ( <FormItem><FormLabel>Due Date (Action Date)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="assigneeId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select staff member..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {admins.map(admin => (
                                        <SelectItem key={admin.uid} value={admin.uid}>{admin.displayName || admin.email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Notes / Comments</FormLabel><FormControl><Textarea placeholder="Add details relating to the discussion or specific requirements..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} 
                    Create Task
                </Button>
            </form>
        </Form>
    );
}

export function PartnerTasksDialog({ partner }: { partner: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    const tasksQuery = useMemoFirebase(() => {
        if (!firestore || !partner?.id) return null;
        return query(collection(firestore, `/partners/${partner.id}/tasks`), orderBy('createdAt', 'desc'));
    }, [firestore, partner]);

    const { data: tasks, isLoading, forceRefresh } = useCollection(tasksQuery);

    const handleAction = useCallback(async (task: any, action: 'toggle' | 'delete') => {
        if (!user) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            if (action === 'delete') {
                await fetch('/api/deleteUserDoc', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: `/partners/${partner.id}/tasks/${task.id}` }),
                });
                toast({ title: "Task Deleted" });
            } else if (action === 'toggle') {
                await fetch('/api/updateUserDoc', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        path: `/partners/${partner.id}/tasks/${task.id}`,
                        data: { status: task.status === 'pending' ? 'completed' : 'pending', updatedAt: { _methodName: 'serverTimestamp' } }
                    }),
                });
                toast({ title: `Task marked as ${task.status === 'pending' ? 'completed' : 'pending'}.` });
            }
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
        }
    }, [user, partner, toast, forceRefresh]);
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            id: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Button variant="ghost" size="icon" onClick={() => handleAction(row.original, 'toggle')}>
                    {row.original.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                </Button>
            ),
        },
        { accessorKey: 'title', header: 'Task' },
        { accessorKey: 'dueDate', header: 'Due', cell: ({ row }) => formatDateSafe(row.original.dueDate, 'dd MMM') },
        {
            id: 'actions',
            header: <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleAction(row.original, 'delete')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            )
        },
    ], [handleAction]);

    const pendingTasks = useMemo(() => tasks?.filter(t => t.status === 'pending') || [], [tasks]);
    const completedTasks = useMemo(() => tasks?.filter(t => t.status === 'completed') || [], [tasks]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" title="View/Manage Tasks">
                    <ClipboardList className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>CRM Tasks for {partner.name || `${partner?.firstName || ''} ${partner?.lastName || ''}`}</DialogTitle>
                    <DialogDescription>Track follow-ups and assign responsibilities for this partner.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="space-y-6">
                            {pendingTasks.length > 0 ? (
                                <DataTable columns={columns} data={pendingTasks} />
                            ) : (
                                <p className="text-center text-sm text-muted-foreground py-4">No pending tasks.</p>
                            )}
                            
                            {completedTasks.length > 0 && (
                                <div>
                                    <h4 className="font-semibold my-4">Completed Tasks</h4>
                                    <DataTable columns={columns} data={completedTasks} />
                                </div>
                            )}
                        </div>
                    )}
                    <TaskForm partner={partner} onTaskAdded={forceRefresh} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
