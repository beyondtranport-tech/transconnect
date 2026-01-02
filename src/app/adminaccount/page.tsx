
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
  Wallet,
  Banknote,
  Combine,
  Truck,
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
const ProfileContent = dynamic(() => import('@/app/adminaccount/profile-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CompanyContent = dynamic(() => import('@/app/adminaccount/company-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffContent = dynamic(() => import('@/app/adminaccount/staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopContent = dynamic(() => import('@/app/adminaccount/shop-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletContent = dynamic(() => import('@/app/adminaccount/wallet-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BillingContent = dynamic(() => import('@/app/adminaccount/billing-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BankDetailsSettings = dynamic(() => import('@/app/backend/bank-details-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationContent = dynamic(() => import('@/app/adminaccount/reconciliation-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function AdminAccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== 'beyondtransport@gmail.com') {
        router.replace('/signin?redirect=/adminaccount');
      } else {
        setAuthChecked(true);
      }
    }
  }, [user, isUserLoading, router]);

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
      case 'profile': return <ProfileContent />;
      case 'company': return <CompanyContent />;
      case 'staff': return <StaffContent />;
      case 'shop': return <ShopContent />;
      case 'wallet': return <WalletContent />;
      case 'billing': return <BillingContent />;
      case 'bank-settings': return <BankDetailsSettings />;
      case 'bank-reconciliation': return <ReconciliationContent />;
      default: return <DashboardContent />;
    }
  };

  if (isUserLoading || !authChecked) {
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
                    <SidebarMenuSubButton isActive={activeView === 'bank-settings'} onClick={() => router.push('/adminaccount?view=bank-settings', { scroll: false })}>
                        <Settings />
                        <span>Bank Details</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
               <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Wallet">
                        <Wallet />
                        <span>Wallet</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'wallet'} onClick={() => router.push('/adminaccount?view=wallet', { scroll: false })}>
                            My Wallet
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton isActive={activeView === 'billing'} onClick={() => router.push('/adminaccount?view=billing', { scroll: false })}>
                            Billing
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Company Details">
                        <Users />
                        <span>Company</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'profile'} onClick={() => router.push('/adminaccount?view=profile', { scroll: false })}>
                            My Profile
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton isActive={activeView === 'company'} onClick={() => router.push('/adminaccount?view=company', { scroll: false })}>
                            Company Details
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton isActive={activeView === 'staff'} onClick={() => router.push('/adminaccount?view=staff', { scroll: false })}>
                            Staff
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton isActive={activeView === 'shop'} onClick={() => router.push('/adminaccount?view=shop', { scroll: false })}>
                            My Shop
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
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
