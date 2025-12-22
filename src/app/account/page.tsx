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
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  DollarSign,
  User,
  Building,
  Banknote,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import AccountDashboard from './dashboard';
import { Loader2 } from 'lucide-react';
import FinanceView from './finance-view';

function ProfileContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="mt-2 text-muted-foreground">This is where profile editing will go.</p>
        </div>
    )
}
function CompanyContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Company</h1>
            <p className="mt-2 text-muted-foreground">This is where company editing will go.</p>
        </div>
    )
}
function StaffContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Staff</h1>
            <p className="mt-2 text-muted-foreground">This is where staff management will go.</p>
        </div>
    )
}
function TransactionsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="mt-2 text-muted-foreground">This is where transaction history will go.</p>
        </div>
    )
}
function DocumentsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="mt-2 text-muted-foreground">This is where document management will go.</p>
        </div>
    )
}
function SettingsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-2 text-muted-foreground">This is where account settings will go.</p>
        </div>
    )
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/signin');
    }
  }, [user, isUserLoading, router]);


  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AC";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfileContent />;
      case 'company':
        return <CompanyContent />;
      case 'staff':
        return <StaffContent />;
      case 'finance':
        return <FinanceView />;
      case 'transactions':
        return <TransactionsContent />;
      case 'documents':
        return <DocumentsContent />;
      case 'settings':
        return <SettingsContent />;
      case 'dashboard':
      default:
        return <AccountDashboard />;
    }
  }

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
            <div className="bg-primary/10 p-2 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Member Area
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
                <SidebarMenuButton tooltip="My Profile" isActive={activeView === 'profile'} onClick={() => setActiveView('profile')}>
                  <User />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Company" isActive={activeView === 'company'} onClick={() => setActiveView('company')}>
                  <Building />
                  <span>Company</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => setActiveView('staff')}>
                  <Users />
                  <span>Staff</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Finance" isActive={activeView === 'finance'} onClick={() => setActiveView('finance')}>
                  <Banknote />
                  <span>Finance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Transactions" isActive={activeView === 'transactions'} onClick={() => setActiveView('transactions')}>
                  <DollarSign />
                  <span>Transactions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Documents" isActive={activeView === 'documents'} onClick={() => setActiveView('documents')}>
                  <FileText />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')}>
                  <Settings />
                  <span>Settings</span>
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
            <div className="flex justify-between items-center">
                {renderContent()}
                <SidebarTrigger className="md:hidden"/>
            </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
