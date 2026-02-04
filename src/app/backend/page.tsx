
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
  Handshake,
  DollarSign,
  Sparkles,
  Settings,
  Users,
  Mic,
  LineChart,
  Shield,
  Activity,
  Wrench,
  Wallet,
  ListTodo,
  Store,
  Lock,
  Star,
  Banknote,
  FileText,
  Landmark,
  Truck,
  ShieldCheck,
  Repeat,
  FileSignature,
  Building,
  FileSearch,
  UserPlus,
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// --- Dynamic Imports for Business Components ---

// Operations
const AdminDashboardContent = dynamic(() => import('./dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberWallet = dynamic(() => import('./wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletTransactionsList = dynamic(() => import('./wallet-transactions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopsList = dynamic(() => import('./shops-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationPage = dynamic(() => import('./reconciliation/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ContributionsList = dynamic(() => import('./contributions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ActivityFeed = dynamic(() => import('./activity-feed'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MembersList = dynamic(() => import('./members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Lending DMS
const ClientsContent = dynamic(() => import('./lending/clients-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AgreementsContent = dynamic(() => import('./lending/agreements-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FacilitiesContent = dynamic(() => import('./lending/facilities-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingTransactionsContent = dynamic(() => import('./lending/transactions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetsContent = dynamic(() => import('./lending/assets-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SecurityContent = dynamic(() => import('./lending/security-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CollateralContent = dynamic(() => import('./lending/collateral-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PaymentsContent = dynamic(() => import('./lending/payments-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingPartnersContent = dynamic(() => import('./lending/partners-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerDetails = dynamic(() => import('./lending/partner-details'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DiscoveryContent = dynamic(() => import('./lending/discovery-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ScoringContent = dynamic(() => import('./lending/scoring-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// Platform Settings
const PermissionsContent = dynamic(() => import('./permissions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PricingManagement = dynamic(() => import('./revenue/pricing-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechPricing = dynamic(() => import('./revenue/tech-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTasks = dynamic(() => import('./platform-tasks'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformSettingsContent = dynamic(() => import('./platform-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallCommissions = dynamic(() => import('./revenue/mall-commissions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ConnectPlanPricing = dynamic(() => import('./revenue/connect-plan-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceFees = dynamic(() => import('./revenue/marketplace-fees'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesIncentives = dynamic(() => import('./revenue/sales-incentives'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LoyaltySettings = dynamic(() => import('./loyalty-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) {
            return;
        }

        if (!user) {
            router.replace('/signin?redirect=/backend');
        } else if (user.email !== 'beyondtransport@gmail.com' && user.email !== 'mkoton100@gmail.com') {
            router.replace('/account'); 
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
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
      // Dashboard
      case 'dashboard': return <AdminDashboardContent />;
      case 'activity': return <ActivityFeed />;
      
      // Operations
      case 'members': return <MembersList />;
      case 'wallet': return memberId ? <MemberWallet memberId={memberId} /> : <WalletTransactionsList />;
      case 'wallet-transactions': return <WalletTransactionsList />;
      case 'shops': return <ShopsList />;
      case 'reconciliation': return <ReconciliationPage />;
      case 'contributions': return <ContributionsList />;
      
      // Origination
      case 'client-onboarding': return <ClientsContent />;
      case 'agreement-onboarding': return <AgreementsContent />;
      case 'discovery': return <DiscoveryContent />;
      case 'scoring': return <ScoringContent />;

      // Lending DMS (Servicing)
      case 'lending-clients': return <ClientsContent />;
      case 'lending-agreements': return <AgreementsContent />;
      case 'lending-facilities': return <FacilitiesContent />;
      case 'lending-transactions': return <LendingTransactionsContent />;
      case 'lending-assets': return <AssetsContent />;
      case 'lending-security': return <SecurityContent />;
      case 'lending-collateral': return <CollateralContent />;
      case 'lending-payments': return <PaymentsContent />;
      case 'lending-partners': return <LendingPartnersContent />;

      // Partners
      case 'partners-suppliers': return <PartnerDetails partnerType="Suppliers" />;
      case 'partners-vendors': return <PartnerDetails partnerType="Vendors" />;
      case 'partners-associates': return <PartnerDetails partnerType="Associates" />;
      case 'partners-debtors': return <PartnerDetails partnerType="Debtors" />;


      // Platform Settings
      case 'permissions': return <PermissionsContent />;
      case 'loyalty': return <LoyaltySettings />;
      case 'pricing-memberships': return <PricingManagement />;
      case 'pricing-connect': return <ConnectPlanPricing />;
      case 'pricing-tech': return <TechPricing />;
      case 'pricing-marketplace': return <MarketplaceFees />;
      case 'commissions-malls': return <MallCommissions />;
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
  
  const isOperationsActive = ['members', 'wallet', 'wallet-transactions', 'shops', 'reconciliation', 'contributions'].includes(activeView);
  const isClientOnboardingActive = ['client-onboarding', 'discovery', 'scoring'].includes(activeView);
  const isAgreementOnboardingActive = ['agreement-onboarding'].includes(activeView);
  const isLendingActive = activeView.startsWith('lending-') || activeView.startsWith('partners-');
  const isRevenueActive = [
    'pricing-memberships', 'pricing-connect', 'pricing-tech', 'pricing-marketplace',
    'commissions-malls', 'incentives-sales'
  ].includes(activeView);
  const isPlatformSettingsActive = [
    'permissions', 'loyalty', 'tasks', 'settings-bank'
  ].includes(activeView);
  const isPartnersActive = activeView.startsWith('partners-');


  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                App Backend
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
                    <SidebarMenuButton tooltip="Activity" isActive={activeView === 'activity'} onClick={() => navigate('activity')}>
                        <Activity /><span>Activity Feed</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Operations" isActive={isOperationsActive}><Wrench /><span>Operations</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'members'} onClick={() => navigate('members')}><Users />Members</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'wallet-transactions'} onClick={() => navigate('wallet-transactions')}><Wallet />Wallet Transactions</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'contributions'} onClick={() => navigate('contributions')}><ListTodo />Contributions</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'shops'} onClick={() => navigate('shops')}><Store />Shops</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'reconciliation'} onClick={() => navigate('reconciliation')}><Scale />Bank Reconciliation</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Client Onboarding" isActive={isClientOnboardingActive}><UserPlus /><span>Client Onboarding</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'client-onboarding'} onClick={() => navigate('client-onboarding')}><Users/>Client Onboarding</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'discovery'} onClick={() => navigate('discovery')}><FileSearch/>Discovery</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'scoring'} onClick={() => navigate('scoring')}><Star />Scoring</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>

                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Agreement Onboarding" isActive={isAgreementOnboardingActive}><FileText /><span>Agreement Onboarding</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'agreement-onboarding'} onClick={() => navigate('agreement-onboarding')}><FileText />Agreement Onboarding</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Lending Management" isActive={isLendingActive}><Landmark /><span>Lending Management</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-clients'} onClick={() => navigate('lending-clients')}><Users/>Clients</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-agreements'} onClick={() => navigate('lending-agreements')}><FileText />Agreements</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-facilities'} onClick={() => navigate('lending-facilities')}><Landmark />Facilities</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-transactions'} onClick={() => navigate('lending-transactions')}><DollarSign />Transactions</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-assets'} onClick={() => navigate('lending-assets')}><Truck />Assets</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-security'} onClick={() => navigate('lending-security')}><FileSignature />Security</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-collateral'} onClick={() => navigate('lending-collateral')}><ShieldCheck />Collateral</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-payments'} onClick={() => navigate('lending-payments')}><Banknote />Payments</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSeparator />
                    <SidebarMenuSubItem>
                        <SidebarMenuButton tooltip="Partners" isActive={isPartnersActive}>
                            <Handshake /><span>Partners</span>
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-suppliers'} onClick={() => navigate('partners-suppliers')}><Building />Suppliers</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-vendors'} onClick={() => navigate('partners-vendors')}><Store />Vendors</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-associates'} onClick={() => navigate('partners-associates')}><Briefcase />Associates</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-debtors'} onClick={() => navigate('partners-debtors')}><Users />Debtors</SidebarMenuSubButton></SidebarMenuSubItem>
                        </SidebarMenuSub>
                    </SidebarMenuSubItem>
                    <SidebarMenuSeparator />
                    <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Administration</span></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton disabled><Settings className="mr-2 h-4 w-4" />System Admin</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton disabled><Wrench className="mr-2 h-4 w-4" />Utilities</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton disabled><FileText className="mr-2 h-4 w-4" />Reports</SidebarMenuSubButton></SidebarMenuSubItem>
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
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'incentives-sales'} onClick={() => navigate('incentives-sales')}>Sales Incentives</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Platform Settings" isActive={isPlatformSettingsActive}><Settings /><span>Platform Settings</span></SidebarMenuButton>
                  <SidebarMenuSub>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'permissions'} onClick={() => navigate('permissions')}><Lock />Permissions</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'loyalty'} onClick={() => navigate('loyalty')}><Star />Loyalty & Points</SidebarMenuSubButton></SidebarMenuSubItem>
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
