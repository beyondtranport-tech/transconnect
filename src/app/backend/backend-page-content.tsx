
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LogOut,
  Loader2,
  TrendingUp,
  Map,
  Sheet as FinancialSheetIcon,
  Presentation,
  User,
  Settings,
  Users,
  Banknote,
  Combine,
  Truck,
  Building,
  ShieldAlert,
  Store,
  Wrench,
  CheckCircle,
  XCircle,
  ShoppingBasket,
  Cpu,
  Landmark,
  ArrowRight,
  Key,
  HandCoins,
  TicketPercent,
  Star,
  Gift,
  Award,
  HeartHandshake,
  Boxes,
  Server,
  ListTodo,
  Wallet,
  DollarSign,
  FileText,
  Lock,
  Activity,
  Sparkles,
  Handshake,
  LayoutDashboard,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';

import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

// Using next/dynamic to lazy-load components
import dynamic from 'next/dynamic';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

const AdminAccountContent = dynamic(() => import('../adminaccount/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DashboardContent = dynamic(() => import('./dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MembersList = dynamic(() => import('./members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PermissionsContent = dynamic(() => import('./permissions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ActivityFeed = dynamic(() => import('./activity-feed'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTasksContent = dynamic(() => import('./platform-tasks'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

const FundingDivisionContent = dynamic(() => import('./funding-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallDivisionContent = dynamic(() => import('./mall-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceDivisionContent = dynamic(() => import('./marketplace-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechDivisionContent = dynamic(() => import('./tech-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformSettingsContent = dynamic(() => import('./platform-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DivisionsContent = dynamic(() => import('./divisions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CampaignContent = dynamic(() => import('./campaign-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberWallet = dynamic(() => import('./wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletTransactionsList = dynamic(() => import('./wallet-transactions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationPage = dynamic(() => import('./reconciliation/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

const LoyaltySettings = dynamic(() => import('./loyalty-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const RewardsManagement = dynamic(() => import('./rewards-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const RewardStatus = dynamic(() => import('./reward-status'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PricingManagement = dynamic(() => import('./revenue/pricing-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallCommissions = dynamic(() => import('./revenue/mall-commissions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceFees = dynamic(() => import('./revenue/marketplace-fees'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ConnectPlanPricing = dynamic(() => import('./revenue/connect-plan-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechPricing = dynamic(() => import('./revenue/tech-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAPitchSettings = dynamic(() => import('./revenue/isa-pitch-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesIncentives = dynamic(() => import('./revenue/sales-incentives'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


export default function BackendPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'platform-settings';
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

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardContent />;
      case 'members':
        return <MembersList />;
      case 'wallet':
        return memberId ? <MemberWallet memberId={memberId} /> : <WalletTransactionsList />;
      case 'wallet-transactions':
        return <WalletTransactionsList />;
      case 'bank-reconciliation':
        return <ReconciliationPage />;
      case 'activity-feed':
        return <ActivityFeed />;
      case 'platform-tasks':
        return <PlatformTasksContent />;
      case 'platform-settings':
        return <PlatformSettingsContent />;
      case 'permissions':
        return <PermissionsContent />;
      case 'loyalty-settings':
        return <LoyaltySettings />;
      case 'rewards':
        return <RewardsManagement />;
      case 'reward-status':
        return <RewardStatus />;
      case 'revenue-membership':
        return <PricingManagement />;
      case 'revenue-mall-commissions':
        return <MallCommissions />;
      case 'revenue-marketplace-fees':
        return <MarketplaceFees />;
      case 'revenue-connect-plans':
        return <ConnectPlanPricing />;
      case 'revenue-tech-pricing':
        return <TechPricing />;
      case 'revenue-isa-pitch':
        return <ISAPitchSettings />;
      case 'revenue-sales-incentives':
        return <SalesIncentives />;
      case 'divisions':
        return <DivisionsContent />;
      case 'divisions-funding':
        return <FundingDivisionContent />;
      case 'divisions-mall':
        return <MallDivisionContent />;
      case 'divisions-marketplace':
        return <MarketplaceDivisionContent />;
      case 'divisions-tech':
        return <TechDivisionContent />;
      case 'campaigns':
        return <CampaignContent />;
      default:
        return <PlatformSettingsContent />;
    }
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
    <Sidebar>
        <div className="md:hidden p-2 flex items-center justify-between border-b">
            <SheetHeader>
                <SheetTitle>Backend Menu</SheetTitle>
            </SheetHeader>
            <SidebarTrigger />
        </div>
        <SidebarHeader>
        <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              App Backend
            </h2>
        </div>
        </SidebarHeader>
        <SidebarContent>
        <SidebarGroup>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Go to Admin Account" asChild>
                    <Link href="/adminaccount">
                        <Building />
                        <span>Business Hub</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Go to Member Area" asChild>
                    <Link href="/account">
                        <Users />
                        <span>Member Area</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members" isActive={activeView === 'members'} onClick={() => router.push('/backend?view=members', { scroll: false })}>
                <Users />
                <span>Members</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Wallet" isActive={['wallet', 'wallet-transactions', 'bank-reconciliation'].includes(activeView)}>
                      <Wallet />
                      <span>Wallet</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'wallet-transactions'} onClick={() => router.push('/backend?view=wallet-transactions', { scroll: false })}>
                          <DollarSign />
                          <span>Member Wallet Ledger</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'bank-reconciliation'} onClick={() => router.push('/backend?view=bank-reconciliation', { scroll: false })}>
                          <Combine />
                          <span>Bank Reconciliation</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
              </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Campaigns" isActive={activeView === 'campaigns'} onClick={() => router.push('/backend?view=campaigns', { scroll: false })}>
                  <Sparkles />
                  <span>Campaigns</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Permissions" isActive={activeView === 'permissions'} onClick={() => router.push('/backend?view=permissions', { scroll: false })}>
                    <Lock />
                    <span>Permissions</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Divisions" isActive={activeView.startsWith('divisions')}>
                        <Boxes />
                        <span>Divisions</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'divisions-funding'} onClick={() => router.push('/backend?view=divisions-funding', { scroll: false })}>
                            <Landmark />
                            <span>Funding</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'divisions-mall'} onClick={() => router.push('/backend?view=divisions-mall', { scroll: false })}>
                            <ShoppingBasket />
                            <span>Mall</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'divisions-marketplace'} onClick={() => router.push('/backend?view=divisions-marketplace', { scroll: false })}>
                            <Store />
                            <span>Marketplace</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'divisions-tech'} onClick={() => router.push('/backend?view=divisions-tech', { scroll: false })}>
                            <Cpu />
                            <span>Tech</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Rewards and Loyalty" isActive={activeView.includes('loyalty') || activeView.includes('reward')}>
                        <Star />
                        <span>Rewards and Loyalty</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'loyalty-settings'} onClick={() => router.push('/backend?view=loyalty-settings', { scroll: false })}>
                            <Settings />
                            <span>Tier & Point Settings</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'reward-status'} onClick={() => router.push('/backend?view=reward-status', { scroll: false })}>
                            <Award />
                            <span>Reward Status</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'rewards'} onClick={() => router.push('/backend?view=rewards', { scroll: false })}>
                            <Gift />
                            <span>Redeemable Rewards</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
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
                        <SidebarMenuSubButton isActive={activeView === 'activity-feed'} onClick={() => router.push('/backend?view=activity-feed', { scroll: false })}>
                            <Activity />
                            <span>Activity Feed</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-tasks'} onClick={() => router.push('/backend?view=platform-tasks', { scroll: false })}>
                            <ListTodo />
                            <span>Tasks</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Revenue" isActive={activeView.startsWith('revenue')}>
                        <DollarSign />
                        <span>Revenue</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton tooltip="Membership Plans" isActive={activeView === 'revenue-membership'} onClick={() => router.push('/backend?view=revenue-membership', { scroll: false })}>
                            <Users />
                            <span>Membership</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton tooltip="ISA Pitch" isActive={activeView === 'revenue-isa-pitch'} onClick={() => router.push('/backend?view=revenue-isa-pitch', { scroll: false })}>
                            <Handshake />
                            <span>ISA Pitch</span>
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton tooltip="Sales Incentives" isActive={activeView === 'revenue-sales-incentives'} onClick={() => router.push('/backend?view=revenue-sales-incentives', { scroll: false })}>
                            <TrendingUp />
                            <span>Sales Incentives</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton tooltip="Mall Commissions" isActive={activeView === 'revenue-mall-commissions'} onClick={() => router.push('/backend?view=revenue-mall-commissions', { scroll: false })}>
                            <ShoppingBasket />
                            <span>Mall Commissions</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton tooltip="Marketplace Fees" isActive={activeView === 'revenue-marketplace-fees'} onClick={() => router.push('/backend?view=revenue-marketplace-fees', { scroll: false })}>
                            <Store />
                            <span>Marketplace Fees</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton tooltip="Connect Plan Pricing" isActive={activeView === 'revenue-connect-plans'} onClick={() => router.push('/backend?view=revenue-connect-plans', { scroll: false })}>
                            <HandCoins />
                            <span>Connect Plans</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton tooltip="Tech Component Pricing" isActive={activeView === 'revenue-tech-pricing'} onClick={() => router.push('/backend?view=revenue-tech-pricing', { scroll: false })}>
                            <Cpu />
                            <span>Tech Pricing</span>
                        </SidebarMenuSubButton>
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
                title="Sign Out of Backend"
            >
                <LogOut className="h-5 w-5" />
            </Button>
            </div>
        )}
        </SidebarFooter>
    </Sidebar>
    <SidebarInset>
        <div className="md:hidden flex items-center justify-between border-b p-2">
            <Link href="/backend" className="flex items-center gap-2">
                <Server className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">App Backend</span>
            </Link>
            <SidebarTrigger />
        </div>
        <div className="p-6">
            <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" />}>
            {renderContent()}
            </Suspense>
        </div>
    </SidebarInset>
    </SidebarProvider>
  );
}
