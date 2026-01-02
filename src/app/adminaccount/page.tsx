
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
  HeartHandshake,
  Store,
  Boxes,
  Server,
  FileText,
  ListTodo,
  DollarSign,
  LineChart,
  ShoppingBasket,
  Cpu,
  Landmark,
  HandCoins,
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
const DashboardContent = dynamic(() => import('@/app/backend/dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MembersList = dynamic(() => import('@/app/backend/members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopsList = dynamic(() => import('@/app/backend/shops-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ContributionsList = dynamic(() => import('@/app/backend/contributions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletTransactionsList = dynamic(() => import('@/app/backend/wallet-transactions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationPage = dynamic(() => import('@/app/backend/reconciliation/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BankDetailsSettings = dynamic(() => import('@/app/backend/bank-details-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ChartOfAccountsSettings = dynamic(() => import('@/app/backend/chart-of-accounts-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTransactions = dynamic(() => import('@/app/backend/platform-transactions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberWallet = dynamic(() => import('@/app/backend/wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PricingManagement = dynamic(() => import('@/app/backend/revenue/pricing-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallCommissions = dynamic(() => import('@/app/backend/revenue/mall-commissions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceFees = dynamic(() => import('@/app/backend/revenue/marketplace-fees'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ConnectPlanPricing = dynamic(() => import('@/app/backend/revenue/connect-plan-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechPricing = dynamic(() => import('@/app/backend/revenue/tech-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function AdminAccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const memberId = searchParams.get('memberId');
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
      case 'members': return <MembersList />;
      case 'shops': return <ShopsList />;
      case 'contributions': return <ContributionsList />;
      case 'wallet-transactions': return <WalletTransactionsList />;
      case 'platform-transactions': return <PlatformTransactions />;
      case 'bank-reconciliation': return <ReconciliationPage />;
      case 'bank-settings': return <BankDetailsSettings />;
      case 'chart-of-accounts': return <ChartOfAccountsSettings />;
      case 'wallet': if (memberId) { return <MemberWallet memberId={memberId} />; } return <WalletTransactionsList />;
      case 'revenue-membership': return <PricingManagement />;
      case 'revenue-mall-commissions': return <MallCommissions />;
      case 'revenue-marketplace-fees': return <MarketplaceFees />;
      case 'revenue-connect-plans': return <ConnectPlanPricing />;
      case 'revenue-tech-pricing': return <TechPricing />;
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
              Admin Operations
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
                        <SidebarMenuSubButton isActive={activeView === 'wallet-transactions'} onClick={() => router.push('/adminaccount?view=wallet-transactions', { scroll: false })}>
                            <DollarSign />
                            <span>Member Ledger</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-transactions'} onClick={() => router.push('/adminaccount?view=platform-transactions', { scroll: false })}>
                            <Banknote />
                            <span>Platform Ledger</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Revenue" isActive={activeView.startsWith('revenue')}>
                        <DollarSign />
                        <span>Revenue</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'revenue-membership'} onClick={() => router.push('/adminaccount?view=revenue-membership', { scroll: false })}>
                          Membership
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'revenue-mall-commissions'} onClick={() => router.push('/adminaccount?view=revenue-mall-commissions', { scroll: false })}>
                          Mall Commissions
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton isActive={activeView === 'revenue-tech-pricing'} onClick={() => router.push('/adminaccount?view=revenue-tech-pricing', { scroll: false })}>
                          Tech Pricing
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings">
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'chart-of-accounts'} onClick={() => router.push('/adminaccount?view=chart-of-accounts', { scroll: false })}>
                            Chart of Accounts
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
