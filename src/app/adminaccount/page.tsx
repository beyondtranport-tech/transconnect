
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
  SidebarMenuSeparator,
  SidebarMenuSubItem,
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
  Shield,
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
  Handshake as HandshakeIcon,
  Package,
  LayoutDashboard,
  Mail,
  Calculator,
  Target,
  Info,
  Bot,
  Database,
  ImageIcon,
  Briefcase,
  Scale,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';

import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

import dynamic from 'next/dynamic';
import React from 'react';

// --- Dynamic Imports for ALL Admin Components ---

// Dashboard
const DashboardContent = dynamic(() => import('../backend/dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Operations
const MembersList = dynamic(() => import('../backend/members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffList = dynamic(() => import('../backend/staff-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberWallet = dynamic(() => import('../backend/wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletTransactionsList = dynamic(() => import('../backend/wallet-transactions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopsList = dynamic(() => import('../backend/shops-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationPage = dynamic(() => import('../backend/reconciliation/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Sales & Marketing
const LeadsAgent = dynamic(() => import('./leads-agent'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsDatabase = dynamic(() => import('./leads-database'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CampaignContent = dynamic(() => import('./campaign-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetGallery = dynamic(() => import('./asset-gallery'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkOffer = dynamic(() => import('../account/network-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkEmails = dynamic(() => import('../account/network-emails'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PerformanceContent = dynamic(() => import('../account/performance-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Strategy & Pitching
const PartnerOffer = dynamic(() => import('./partner-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorOffer = dynamic(() => import('./investor-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ElevatorPitch = dynamic(() => import('./elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerElevatorPitch = dynamic(() => import('./partner-elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerEmailSequence = dynamic(() => import('./partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorEmailSequence = dynamic(() => import('./investor-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Financials & Projections
const FinancialSetup = dynamic(() => import('../account/financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesRoadmap = dynamic(() => import('../account/sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const Targets = dynamic(() => import('../account/targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('../account/member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CostCalculator = dynamic(() => import('./cost-calculator'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('../account/budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ForecastPage = dynamic(() => import('../account/forecast/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Platform Settings
const PermissionsContent = dynamic(() => import('../backend/permissions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LoyaltySettings = dynamic(() => import('../backend/loyalty-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PricingManagement = dynamic(() => import('../backend/revenue/pricing-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechPricing = dynamic(() => import('../backend/revenue/tech-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTasks = dynamic(() => import('../backend/platform-tasks'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformSettingsContent = dynamic(() => import('../backend/platform-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAPitchSettings = dynamic(() => import('../backend/revenue/isa-pitch-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallCommissions = dynamic(() => import('../backend/revenue/mall-commissions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ConnectPlanPricing = dynamic(() => import('../backend/revenue/connect-plan-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceFees = dynamic(() => import('../backend/revenue/marketplace-fees'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesIncentives = dynamic(() => import('../backend/revenue/sales-incentives'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) {
            return;
        }

        if (!user) {
            router.replace('/signin?redirect=/adminaccount');
        } else if (user.email !== 'beyondtransport@gmail.com' && user.email !== 'mkoton100@gmail.com') {
            router.replace('/account'); 
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || (user.email !== 'beyondtransport@gmail.com' && user.email !== 'mkoton100@gmail.com')) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials...</p>
            </div>
        );
    }
    
    return <>{children}</>;
}

function AdminAccountContent() {
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
      // Dashboard
      case 'dashboard': return <DashboardContent />;
      
      // Operations
      case 'members': return <MembersList />;
      case 'staff': return <StaffList />;
      case 'wallet': return memberId ? <MemberWallet memberId={memberId} /> : <WalletTransactionsList />;
      case 'shops': return <ShopsList />;
      case 'reconciliation': return <ReconciliationPage />;

      // Sales & Marketing
      case 'leads-agent': return <LeadsAgent />;
      case 'leads-database': return <LeadsDatabase />;
      case 'campaigns': return <CampaignContent 
        title="Marketing Campaigns AI Studio"
        description="Use these tools to generate and enhance visual assets for general marketing, member outreach, and social media."
      />;
      case 'asset-gallery': return <AssetGallery />;
      case 'member-sales-offer': return <NetworkOffer />;
      case 'member-sales-emails': return <NetworkEmails />;
      case 'member-sales-performance': return <PerformanceContent />;

      // Strategy & Pitching
      case 'partner-offer': return <PartnerOffer />;
      case 'investor-offer': return <InvestorOffer />;
      case 'elevator-pitch': return <ElevatorPitch />;
      case 'partner-pitch': return <PartnerElevatorPitch />;
      case 'partner-emails': return <PartnerEmailSequence />;
      case 'investor-emails': return <InvestorEmailSequence />;

      // Financials & Projections
      case 'financial-setup': return <FinancialSetup />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <Targets />;
      case 'member-projection': return <MemberProjection />;
      case 'cost-calculator': return <CostCalculator />;
      case 'budget': return <BudgetPage />;
      case 'forecast': return <ForecastPage />;
      
      // Platform Settings
      case 'permissions': return <PermissionsContent />;
      case 'loyalty': return <LoyaltySettings />;
      case 'pricing-memberships': return <PricingManagement />;
      case 'pricing-tech': return <TechPricing />;
      case 'pricing-connect': return <ConnectPlanPricing />;
      case 'pricing-marketplace': return <MarketplaceFees />;
      case 'commissions-isa': return <ISAPitchSettings />;
      case 'commissions-malls': return <MallCommissions />;
      case 'incentives-sales': return <SalesIncentives />;
      case 'tasks': return <PlatformTasks />;
      case 'settings-bank': return <PlatformSettingsContent />;

      default: return <DashboardContent />;
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

  const navigate = (view: string) => router.push(`/adminaccount?view=${view}`, { scroll: false });
  const isOperationsActive = ['members', 'staff', 'wallet', 'shops', 'reconciliation'].includes(activeView);
  const isSalesActive = ['leads-agent', 'leads-database', 'campaigns', 'asset-gallery', 'member-sales-offer', 'member-sales-emails', 'member-sales-performance'].includes(activeView);
  const isStrategyActive = ['partner-offer', 'investor-offer', 'elevator-pitch', 'partner-pitch', 'partner-emails', 'investor-emails'].includes(activeView);
  const isFinancialsActive = ['financial-setup', 'sales-roadmap', 'targets', 'member-projection', 'cost-calculator', 'budget', 'forecast'].includes(activeView);
  const isSettingsActive = [
    'permissions', 'loyalty', 'tasks', 'settings-bank',
    'pricing-memberships', 'pricing-tech', 'pricing-connect', 'pricing-marketplace',
    'commissions-isa', 'commissions-malls', 'incentives-sales'
  ].includes(activeView);

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Admin Account
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => navigate('dashboard')}>
                        <LayoutDashboard /><span>Dashboard</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Operations" isActive={isOperationsActive}><Shield /><span>Operations</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'members'} onClick={() => navigate('members')}><Users />Members</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'staff'} onClick={() => navigate('staff')}><Users />Staff</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'wallet'} onClick={() => navigate('wallet')}><Wallet />Wallet Transactions</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'shops'} onClick={() => navigate('shops')}><Store />Shop Approvals</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'reconciliation'} onClick={() => navigate('reconciliation')}><Scale />Bank Reconciliation</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sales & Leads" isActive={isSalesActive}><Handshake /><span>Sales & Leads</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-agent'} onClick={() => navigate('leads-agent')}><Bot />AI Leads Agent</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-database'} onClick={() => navigate('leads-database')}><Database />Leads Database</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'campaigns'} onClick={() => navigate('campaigns')}><Sparkles />AI Marketing Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'asset-gallery'} onClick={() => navigate('asset-gallery')}><ImageIcon />Asset Gallery</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSeparator />
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'member-sales-offer'} onClick={() => navigate('member-sales-offer')}><Presentation />Network Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'member-sales-emails'} onClick={() => navigate('member-sales-emails')}><Mail />Network Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'member-sales-performance'} onClick={() => navigate('member-sales-performance')}><TrendingUp />Performance</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Strategy & Pitching" isActive={isStrategyActive}><Briefcase /><span>Strategy & Pitching</span></SidebarMenuButton>
                  <SidebarMenuSub>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partner-pitch'} onClick={() => navigate('partner-pitch')}><Info />Partner Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partner-offer'} onClick={() => navigate('partner-offer')}><Presentation />Partner Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                      <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partner-emails'} onClick={() => navigate('partner-emails')}><Mail />Partner Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSeparator />
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'elevator-pitch'} onClick={() => navigate('elevator-pitch')}><Info />Investor Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'investor-offer'} onClick={() => navigate('investor-offer')}><Presentation />Investor Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'investor-emails'} onClick={() => navigate('investor-emails')}><Mail />Investor Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Financials" isActive={isFinancialsActive}><DollarSign /><span>Financials</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => navigate('financial-setup')}><Settings />Setup</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'sales-roadmap'} onClick={() => navigate('sales-roadmap')}><Map />Sales Roadmap</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'targets'} onClick={() => navigate('targets')}><Target />Targets</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'member-projection'} onClick={() => navigate('member-projection')}><Users />Member Projection</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'cost-calculator'} onClick={() => navigate('cost-calculator')}><Calculator />Cost Calculator</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => navigate('budget')}><FinancialSheetIcon />Budget</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'forecast'} onClick={() => navigate('forecast')}><TrendingUp />Forecast</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Platform Settings" isActive={isSettingsActive}><Settings /><span>Platform Settings</span></SidebarMenuButton>
                  <SidebarMenuSub>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'permissions'} onClick={() => navigate('permissions')}><Lock />Permissions</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'loyalty'} onClick={() => navigate('loyalty')}><Star />Loyalty & Points</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-memberships'} onClick={() => navigate('pricing-memberships')}><TicketPercent />Membership Pricing</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-connect'} onClick={() => navigate('pricing-connect')}><TicketPercent />Connect Plan Pricing</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-tech'} onClick={() => navigate('pricing-tech')}><TicketPercent />Tech SaaS Pricing</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pricing-marketplace'} onClick={() => navigate('pricing-marketplace')}><TicketPercent />Marketplace Fees</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'commissions-isa'} onClick={() => navigate('commissions-isa')}><Percent />ISA Commissions</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'commissions-malls'} onClick={() => navigate('commissions-malls')}><Percent />Mall Commissions</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'incentives-sales'} onClick={() => navigate('incentives-sales')}><Percent />Sales Incentives</SidebarMenuSubButton></SidebarMenuSubItem>
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


export default function AdminAccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <AdminAccountContent />
    </Suspense>
  );
}
