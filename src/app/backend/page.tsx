
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
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MembersList from './members-list';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ContributionsList from './contributions-list';
import WalletManagementList from './wallet-management-list';
import FinanceApplicationsList from './finance-applications-list';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import BankDetailsSettings from './bank-details-settings';
import ChartOfAccountsSettings from './chart-of-accounts-settings';


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
            <ChartOfAccountsSettings />
            <BankDetailsSettings />
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


export default function BackendPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');

  const onLogout = () => {
    // Clear the session cookie by calling our API route
    document.cookie = 'admin-session=; path=/; max-age=0';
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
      case 'wallet-management':
        return <WalletManagementList />;
      case 'dashboard':
      default:
        return <DashboardContent />;
    }
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
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members" isActive={activeView === 'members'} onClick={() => setActiveView('members')}>
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Contributions" isActive={activeView === 'contributions'} onClick={() => setActiveView('contributions')}>
                  <HeartHandshake />
                  <span>Contributions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Wallet Management" isActive={activeView === 'wallet-management'} onClick={() => setActiveView('wallet-management')}>
                  <Wallet />
                  <span>Wallet Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Platform">
                        <Server />
                        <span>Platform</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'platform-settings'} onClick={() => setActiveView('platform-settings')}>
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-logs'} onClick={() => setActiveView('platform-logs')}>
                            <FileText />
                            <span>Logs</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-tasks'} onClick={() => setActiveView('platform-tasks')}>
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
                        <SidebarMenuSubButton isActive={activeView === 'revenue-pricing'} onClick={() => setActiveView('revenue-pricing')}>
                            <TrendingUp />
                            <span>Pricing</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'revenue-transactions'} onClick={() => setActiveView('revenue-transactions')}>
                            <DollarSign />
                            <span>Transactions</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Divisions" isActive={activeView === 'divisions'} onClick={() => setActiveView('divisions')}>
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
          <div className="flex items-center justify-between">
            {renderContent()}
            <SidebarTrigger className="md:hidden" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
