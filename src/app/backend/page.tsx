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
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  LogOut,
  Loader2,
  TrendingUp,
  User,
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  Activity,
  Wrench,
  Wallet,
  ListTodo,
  Store,
  Lock,
  Star,
  Award,
  Banknote,
  Handshake,
  DollarSign,
  MessageSquare,
  Gift,
  Zap,
  PieChart,
  Scale,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';

import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import dynamic from 'next/dynamic';
import React from 'react';

// --- Static Imports for Member Success Focus ---
import AdminDashboardContent from '@/app/backend/dashboard-content';
import MemberWallet from '@/app/backend/wallet/[memberId]/member-wallet';
import WalletTransactionsList from '@/app/backend/wallet-transactions-list';
import ShopsList from '@/app/backend/shops-list';
import ReconciliationPage from '@/app/backend/reconciliation/page';
import ContributionsList from '@/app/backend/contributions-list';
import ActivityFeed from '@/app/backend/activity-feed';
import MembersList from '@/app/backend/members-list';
import SupportChatInbox from '@/app/backend/support-chat-inbox';
import UsersList from '@/app/backend/users-list';
import CommercialNegotiations from '@/app/backend/commercial-negotiations';
import MemberLoyaltyStatus from '@/app/backend/member-loyalty-status';
import MemberSuccessEngine from '@/app/backend/member-success-engine';

// Platform Settings
import PermissionsContent from '@/app/backend/permissions-content';
import PricingManagement from '@/app/backend/revenue/pricing-management';
import ConnectPlanPricing from '@/app/backend/revenue/connect-plan-pricing';
import TechPricing from '@/app/backend/revenue/tech-pricing';
import MarketplaceFees from '@/app/backend/revenue/marketplace-fees';
import MallCommissions from '@/app/backend/revenue/mall-commissions';
import ISAPitchSettings from '@/app/backend/revenue/isa-pitch-settings';
import SalesIncentives from '@/app/backend/revenue/sales-incentives';
import ActionPlanSettings from '@/app/backend/loyalty-settings';
import TierBenefits from '@/app/backend/tier-benefits';
import RewardsManagement from '@/app/backend/rewards-management';
import PlatformTasks from '@/app/backend/platform-tasks';
import PlatformSettingsContent from '@/app/backend/platform-settings';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/signin?redirect=/backend');
        } else if (
          user.email !== 'mkoton100@gmail.com' && 
          user.email !== 'beyondtransport@gmail.com' &&
          user.email !== 'michael@logisticsflow.co.za'
        ) {
            router.replace('/account'); 
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || (user.email !== 'mkoton100@gmail.com' && user.email !== 'beyondtransport@gmail.com' && user.email !== 'michael@logisticsflow.co.za')) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials...</p>
            </div>
        );
    }
    return <>{children}</>;
}

function BackendContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const memberId = searchParams.get('memberId');
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

  const renderContent = useCallback(() => {
    switch (activeView) {
      case 'dashboard': return <AdminDashboardContent />;
      case 'members': return <MembersList />;
      case 'users': return <UsersList />;
      case 'wallet': return memberId ? <MemberWallet memberId={memberId} /> : <WalletTransactionsList />;
      case 'wallet-transactions': return <WalletTransactionsList />;
      case 'activity': return <ActivityFeed />;
      case 'support-inbox': return <SupportChatInbox />;
      
      // Member Success & Growth
      case 'success-engine': return <MemberSuccessEngine />;
      case 'loyalty-overview': return <MemberLoyaltyStatus />;
      case 'contributions': return <ContributionsList />;
      case 'shops': return <ShopsList />;
      case 'commercial-negotiations': return <CommercialNegotiations />;
      case 'reconciliation': return <ReconciliationPage />;
      
      // Platform Settings
      case 'permissions': return <PermissionsContent />;
      case 'action-plan': return <ActionPlanSettings />;
      case 'loyalty-plan': return <TierBenefits />;
      case 'rewards-plan': return <RewardsManagement />;
      case 'pricing-memberships': return <PricingManagement />;
      case 'pricing-connect': return <ConnectPlanPricing />;
      case 'pricing-tech': return <TechPricing />;
      case 'pricing-marketplace': return <MarketplaceFees />;
      case 'commissions-malls': return <MallCommissions />;
      case 'commissions-isa': return <ISAPitchSettings />;
      case 'incentives-sales': return <SalesIncentives />;
      case 'tasks': return <PlatformTasks />;
      case 'settings-bank': return <PlatformSettingsContent />;
      default: return <AdminDashboardContent />;
    }
  }, [activeView, memberId]);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const navigate = (view: string) => router.push(`/backend?view=${view}`, { scroll: false });
  
  const isOperationsActive = ['dashboard', 'activity', 'members', 'users', 'wallet', 'wallet-transactions', 'reconciliation', 'support-inbox'].includes(activeView);
  const isSuccessActive = ['success-engine', 'loyalty-overview', 'contributions', 'shops', 'commercial-negotiations'].includes(activeView);
  const isRevenueActive = [
    'pricing-memberships', 'pricing-connect', 'pricing-tech', 'pricing-marketplace',
    'commissions-malls', 'commissions-isa', 'incentives-sales'
  ].includes(activeView);
  const isPlatformSettingsActive = [
    'permissions', 'action-plan', 'loyalty-plan', 'rewards-plan', 'tasks', 'settings-bank'
  ].includes(activeView);

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Success & Growth
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => navigate('dashboard')}>
                        <LayoutDashboard /><span>Overview</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Operations" isActive={isOperationsActive}><Wrench /><span>Operations</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'activity'} onClick={() => navigate('activity')}><Activity />Activity Feed</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'support-inbox'} onClick={() => navigate('support-inbox')}><MessageSquare />Support Inbox</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'members'} onClick={() => navigate('members')}><Users />Member Roster</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'wallet-transactions'} onClick={() => navigate('wallet-transactions')}><Wallet />Wallet Ledger</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'reconciliation'} onClick={() => navigate('reconciliation')}><Scale />Bank Reconciliation</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Member Success" isActive={isSuccessActive}><TrendingUp /><span>Success Engine</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'success-engine'} onClick={() => navigate('success-engine')}><PieChart />Conversion Engine</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'loyalty-overview'} onClick={() => navigate('loyalty-overview')}><Award />Loyalty & Tiers</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'contributions'} onClick={() => navigate('contributions')}><ListTodo />Data Contributions</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'shops'} onClick={() => navigate('shops')}><Store />Shop Management</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'commercial-negotiations'} onClick={() => navigate('commercial-negotiations')}><Handshake />Commercials</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Revenue & Pricing" isActive={isRevenueActive}><DollarSign /><span>Revenue & Pricing</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-memberships'} onClick={() => navigate('pricing-memberships')}>Membership Pricing</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-connect'} onClick={() => navigate('pricing-connect')}>Connect Plan Pricing</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-tech'} onClick={() => navigate('pricing-tech')}>Tech SaaS Pricing</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-marketplace'} onClick={() => navigate('pricing-marketplace')}>Marketplace Fees</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'commissions-malls'} onClick={() => navigate('commissions-malls')}>Mall Commissions</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'commissions-isa'} onClick={() => navigate('commissions-isa')}>ISA Commissions</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'incentives-sales'} onClick={() => navigate('incentives-sales')}>Sales Incentives</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Platform Settings" isActive={isPlatformSettingsActive}><Settings /><span>Platform Settings</span></SidebarMenuButton>
                  <SidebarMenuSub>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'permissions'} onClick={() => navigate('permissions')}><Lock />Permissions</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'action-plan'} onClick={() => navigate('action-plan')}><Star />Action Plan</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'loyalty-plan'} onClick={() => navigate('loyalty-plan')}><Award />Loyalty Plan</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'rewards-plan'} onClick={() => navigate('rewards-plan')}><Gift />Rewards Plan</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'settings-bank'} onClick={() => navigate('settings-bank')}><Banknote />Bank Details</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'tasks'} onClick={() => navigate('tasks')}><Wrench />Platform Tasks</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
          {user && (
              <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
              <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.displayName || 'Super Admin'}
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
                  title="Sign Out"
              >
                  <LogOut className="h-5 w-5" />
              </Button>
              </div>
          )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className="p-6">
                <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" />}>
                    {renderContent()}
                </Suspense>
            </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}


export default function BackendPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <BackendContent />
    </Suspense>
  );
}