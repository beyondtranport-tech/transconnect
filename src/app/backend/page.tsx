

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
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  Truck,
  LayoutDashboard,
  LogOut,
  Server,
  FileText,
  ListTodo,
  DollarSign,
  TrendingUp,
  Boxes,
  HeartHandshake,
  Wallet,
  Banknote,
  Book,
  Loader2,
  ShieldAlert,
  Combine,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import MembersList from './members-list';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import ContributionsList from './contributions-list';
import FinanceApplicationsList from './finance-applications-list';
import { useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import BankDetailsSettings from './bank-details-settings';
import ChartOfAccountsSettings from './chart-of-accounts-settings';
import ReconciliationPage from './reconciliation/page';

// Placeholder Content Components
function DashboardContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Main Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Aggregated view of all platform metrics.</p>
        </div>
    )
}

function PlatformSettingsContent() {
    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">Platform Settings</h1>
                <p className="mt-2 text-muted-foreground">Manage central configurations for the TransConnect platform.</p>
            </div>
            <BankDetailsSettings />
            <ChartOfAccountsSettings />
        </div>
    )
}


function PlatformLogsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Platform Logs</h1>
            <p className="mt-2 text-muted-foreground">Monitor system activity and errors.</p>
        </div>
    )
}

function PlatformTasksContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Platform Tasks</h1>
            <p className="mt-2 text-muted-foreground">Manage background jobs and scheduled processes.</p>
        </div>
    )
}

function RevenuePricingContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Revenue Pricing</h1>
            <p className="mt-2 text-muted-foreground">Define and manage membership tiers and prices.</p>
        </div>
    )
}

function DivisionsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Divisions Management</h1>
            <p className="mt-2 text-muted-foreground">Manage settings for Funding, Mall, Marketplace, and Tech.</p>
        </div>
    )
}

function ContributionsContent() {
    return (
        <ContributionsList />
    )
}

function BackendPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'members';
  const [activeView, setActiveView] = useState(initialView);
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== 'transconnect@gmail.com') {
        router.push('/signin');
      } else {
        setIsAdmin(true);
      }
    }
  }, [user, isUserLoading, router]);


  const onLogout = () => {
    // This is a simplified logout for the backend, assuming no complex session management.
    // For a real app, you might call a server action to invalidate a session.
    router.push('/');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'members':
        return <MembersList />;
      case 'platform-logs':
        return <PlatformLogsContent />;
      case 'platform-tasks':
        return <PlatformTasksContent />;
      case 'platform-settings':
        return <PlatformSettingsContent />;
      case 'revenue-pricing':
        return <RevenuePricingContent />;
      case 'revenue-transactions':
        return <FinanceApplicationsList />;
      case 'divisions':
        return <DivisionsContent />;
      case 'contributions':
        return <ContributionsContent />;
      case 'reconciliation':
        return <ReconciliationPage />;
      case 'dashboard':
      default:
        return <DashboardContent />;
    }
  }
  
  if (isUserLoading || !isAdmin) {
    return (
        <div className="flex justify-center items-center min-h-screen">
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
              Admin Backend
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/backend?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members" isActive={activeView === 'members'} onClick={() => router.push('/backend?view=members', { scroll: false })}>
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Contributions" isActive={activeView === 'contributions'} onClick={() => router.push('/backend?view=contributions', { scroll: false })}>
                  <HeartHandshake />
                  <span>Contributions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Reconciliation" isActive={activeView === 'reconciliation'} onClick={() => router.push('/backend?view=reconciliation', { scroll: false })}>
                  <Combine />
                  <span>Reconciliation</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Platform">
                        <Server />
                        <span>Platform</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'platform-settings'} onClick={() => router.push('/backend?view=platform-settings', { scroll: false })}>
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-logs'} onClick={() => router.push('/backend?view=platform-logs', { scroll: false })}>
                            <FileText />
                            <span>Logs</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-tasks'} onClick={() => router.push('/backend?view=platform-tasks', { scroll: false })}>
                            <ListTodo />
                            <span>Tasks</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Revenue">
                        <DollarSign />
                        <span>Revenue</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'revenue-pricing'} onClick={() => router.push('/backend?view=revenue-pricing', { scroll: false })}>
                            <TrendingUp />
                            <span>Pricing</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'revenue-transactions'} onClick={() => router.push('/backend?view=revenue-transactions', { scroll: false })}>
                            <DollarSign />
                            <span>Transactions</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Divisions" isActive={activeView === 'divisions'} onClick={() => router.push('/backend?view=divisions', { scroll: false })}>
                  <Boxes />
                  <span>Divisions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
              <AvatarFallback>SA</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                Super Admin
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                transconnect@gmail.com
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={onLogout}
              title="Sign Out of Backend"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-6">
            {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function Backend() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <BackendPageContent />
        </Suspense>
    )
}
