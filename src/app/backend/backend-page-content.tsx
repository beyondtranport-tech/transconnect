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
  Loader2,
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

const MemberWallet = dynamic(() => import('./wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DashboardContent = dynamic(() => import('./dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MembersList = dynamic(() => import('./members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffList = dynamic(() => import('./staff-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopsList = dynamic(() => import('./shops-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ContributionsList = dynamic(() => import('./contributions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletTransactionsList = dynamic(() => import('./wallet-transactions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationPage = dynamic(() => import('./reconciliation/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BankDetailsSettings = dynamic(() => import('./bank-details-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ChartOfAccountsSettings = dynamic(() => import('./chart-of-accounts-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LoyaltySettings = dynamic(() => import('./loyalty-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const RewardsManagement = dynamic(() => import('./rewards-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const RewardStatus = dynamic(() => import('./reward-status'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PricingManagement = dynamic(() => import('./revenue/pricing-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallCommissions = dynamic(() => import('./revenue/mall-commissions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceFees = dynamic(() => import('./revenue/marketplace-fees'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ConnectPlanPricing = dynamic(() => import('./revenue/connect-plan-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechPricing = dynamic(() => import('./revenue/tech-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PermissionsContent = dynamic(() => import('./permissions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ActivityFeed = dynamic(() => import('./activity-feed'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTasksContent = dynamic(() => import('./platform-tasks'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

const FundingDivisionContent = dynamic(() => import('./funding-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallDivisionContent = dynamic(() => import('./mall-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceDivisionContent = dynamic(() => import('./marketplace-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechDivisionContent = dynamic(() => import('./tech-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformSettingsContent = dynamic(() => import('./platform-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DivisionsContent = dynamic(() => import('./divisions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CampaignContent = dynamic(() => import('../adminaccount/campaign-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


export default function BackendPageContent() {
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

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardContent />;
      case 'members':
        return <MembersList />;
      case 'staff':
        return <StaffList />;
      case 'shops':
        return <ShopsList />;
      case 'wallet':
        if (memberId) {
            return <MemberWallet memberId={memberId} />;
        }
        return <WalletTransactionsList />; // Fallback if no memberId
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
      case 'wallet-transactions':
        return <WalletTransactionsList />;
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
      case 'contributions':
        return <ContributionsList />;
      case 'wallet-reconciliation':
        return <ReconciliationPage />;
      case 'campaigns':
        return <CampaignContent />;
      default:
        return <DashboardContent />;
    }
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="w-full">
                    <SidebarMenuButton tooltip="Analytics">
                        <LineChart />
                        <span>Analytics</span>
                    </SidebarMenuButton>
                </a>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Campaigns" isActive={activeView === 'campaigns'} onClick={() => router.push('/backend?view=campaigns', { scroll: false })}>
                  <Sparkles />
                  <span>Campaigns</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members" isActive={activeView === 'members'} onClick={() => router.push('/backend?view=members', { scroll: false })}>
                <Users />
                <span>Members</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => router.push('/backend?view=staff', { scroll: false })}>
                <Users />
                <span>Staff</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Shops" isActive={activeView === 'shops'} onClick={() => router.push('/backend?view=shops', { scroll: false })}>
                <Store />
                <span>Shops</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Contributions" isActive={activeView === 'contributions'} onClick={() => router.push('/backend?view=contributions', { scroll: false })}>
                <HeartHandshake />
                <span>Contributions</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Permissions" isActive={activeView === 'permissions'} onClick={() => router.push('/backend?view=permissions', { scroll: false })}>
                    <Lock />
                    <span>Permissions</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Wallet">
                        <Wallet />
                        <span>Wallet</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'wallet-transactions'} onClick={() => router.push('/backend?view=wallet-transactions', { scroll: false })}>
                            <DollarSign />
                            <span>Member Wallet Ledger</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'wallet-reconciliation'} onClick={() => router.push('/backend?view=wallet-reconciliation', { scroll: false })}>
                            <Combine />
                            <span>Reconciliation</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
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
                            <TrendingUp />
                            <span>Membership</span>
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
        <div className="p-6">
            <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" />}>
            {renderContent()}
            </Suspense>
        </div>
    </SidebarInset>
    </SidebarProvider>
  );
}
