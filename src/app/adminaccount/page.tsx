
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  Banknote,
  Combine,
  Truck,
  Building,
  TrendingUp,
  LineChart,
  Book,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import all the components that will be rendered in the admin account view
const DashboardContent = dynamic(() => import('@/app/adminaccount/dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BankDetailsSettings = dynamic(() => import('@/app/backend/bank-details-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationContent = dynamic(() => import('@/app/adminaccount/reconciliation-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTransactions = dynamic(() => import('@/app/adminaccount/platform-transactions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffContent = dynamic(() => import('@/app/adminaccount/staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function AdminAccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardContent />;
      case 'bank-settings': return <BankDetailsSettings />;
      case 'bank-reconciliation': return <ReconciliationContent />;
      case 'platform-transactions': return <PlatformTransactions />;
      case 'staff': return <StaffContent />;
      // Add placeholders for new views
      case 'business': return <div><h1>Business</h1></div>;
      case 'marketing':
        router.push('/marketing');
        return null;
      case 'forecasting': return <div><h1>Forecasting</h1></div>;
      case 'budgets': return <div><h1>Budgets</h1></div>;
      default: return <DashboardContent />;
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Business Account
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/adminaccount?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Banking">
                    <Banknote />
                    <span>Bank</span>
                </SidebarMenuButton>
                 <SidebarMenuSub>
                    <SidebarMenuSubButton isActive={activeView === 'bank-reconciliation'} onClick={() => router.push('/adminaccount?view=bank-reconciliation', { scroll: false })}>
                        <Combine />
                        <span>Reconciliation</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'platform-transactions'} onClick={() => router.push('/adminaccount?view=platform-transactions', { scroll: false })}>
                        <Book />
                        <span>Platform Ledger</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'bank-settings'} onClick={() => router.push('/adminaccount?view=bank-settings', { scroll: false })}>
                        <Settings />
                        <span>Bank Details</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Business" isActive={activeView === 'business'} onClick={() => router.push('/adminaccount?view=business', { scroll: false })}>
                  <Building />
                  <span>Business</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => router.push('/adminaccount?view=staff', { scroll: false })}>
                  <Users />
                  <span>Staff</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Marketing" isActive={activeView === 'marketing'} onClick={() => router.push('/marketing', { scroll: false })}>
                  <TrendingUp />
                  <span>Marketing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Forecasting" isActive={activeView === 'forecasting'} onClick={() => router.push('/adminaccount?view=forecasting', { scroll: false })}>
                  <LineChart />
                  <span>Forecasting</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Budgets" isActive={activeView === 'budgets'} onClick={() => router.push('/adminaccount?view=budgets', { scroll: false })}>
                  <Book />
                  <span>Budgets</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user.displayName}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-6">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function AdminAccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <AdminAccountPageContent />
    </Suspense>
  );
}
