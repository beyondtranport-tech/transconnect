
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
  Filter,
  Lightbulb,
  ClipboardList,
  MessageSquare,
  Code,
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
const AdminDashboardContent = dynamic(() => import('@/app/backend/dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberWallet = dynamic(() => import('@/app/backend/wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletTransactionsList = dynamic(() => import('@/app/backend/wallet-transactions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopsList = dynamic(() => import('@/app/backend/shops-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationPage = dynamic(() => import('@/app/backend/reconciliation/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ContributionsList = dynamic(() => import('@/app/backend/contributions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ActivityFeed = dynamic(() => import('@/app/backend/activity-feed'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MembersList = dynamic(() => import('@/app/backend/members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CommunicationsContent = dynamic(() => import('@/app/backend/communications-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SupportChatInbox = dynamic(() => import('@/app/backend/support-chat-inbox'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const UsersList = dynamic(() => import('@/app/backend/users-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// Lending DMS
const ClientsContent = dynamic(() => import('@/app/backend/lending/clients-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AgreementsContent = dynamic(() => import('@/app/backend/lending/agreements-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FacilitiesContent = dynamic(() => import('@/app/backend/lending/facilities-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingTransactionsContent = dynamic(() => import('@/app/backend/lending/transactions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetsContent = dynamic(() => import('@/app/backend/lending/assets-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SecurityContent = dynamic(() => import('@/app/backend/lending/security-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CollateralContent = dynamic(() => import('@/app/backend/lending/collateral-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PaymentsContent = dynamic(() => import('@/app/backend/lending/payments-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingPartnersContent = dynamic(() => import('@/app/backend/lending/partners-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerDetails = dynamic(() => import('@/app/backend/lending/partner-details'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DiscoveryContent = dynamic(() => import('@/app/backend/lending/discovery-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ScoringContent = dynamic(() => import('@/app/backend/lending/scoring-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FundingDivisionContent = dynamic(() => import('@/app/backend/funding-division-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsDatabase = dynamic(() => import('@/app/backend/leads-database'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });



// Platform Settings
const PermissionsContent = dynamic(() => import('@/app/backend/permissions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PricingManagement = dynamic(() => import('@/app/backend/revenue/pricing-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechPricing = dynamic(() => import('@/app/backend/revenue/tech-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTasks = dynamic(() => import('@/app/backend/platform-tasks'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformSettingsContent = dynamic(() => import('@/app/backend/platform-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallCommissions = dynamic(() => import('@/app/backend/revenue/mall-commissions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ConnectPlanPricing = dynamic(() => import('@/app/backend/revenue/connect-plan-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceFees = dynamic(() => import('@/app/backend/revenue/marketplace-fees'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesIncentives = dynamic(() => import('@/app/backend/revenue/sales-incentives'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LoyaltySettings = dynamic(() => import('@/app/backend/loyalty-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAPitchSettings = dynamic(() => import('@/app/backend/revenue/isa-pitch-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Lending Model
const LendingAssumptions = dynamic(() => import('@/app/backend/lending-assumptions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
// Admin-specific pages
const InvestorManagement = dynamic(() => import('@/app/adminaccount/investor-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerManagement = dynamic(() => import('./partner-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffManagement = dynamic(() => import('@/app/backend/staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAManagement = dynamic(() => import('./isa-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AnalyticsDashboard = dynamic(() => import('./analytics-dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsAgent = dynamic(() => import('./leads-agent'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CampaignContent = dynamic(() => import('./campaign-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorAiContent = dynamic(() => import('./investor-ai-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerAiContent = dynamic(() => import('./partner-ai-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TTSStudio = dynamic(() => import('./tts-studio'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetGallery = dynamic(() => import('./asset-gallery'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkOffer = dynamic(() => import('../account/network-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkEmails = dynamic(() => import('../account/network-emails'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PerformanceContent = dynamic(() => import('../account/performance-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerOffer = dynamic(() => import('./partner-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerElevatorPitch = dynamic(() => import('./partner-elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerEmailSequence = dynamic(() => import('./partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAEmailSequence = dynamic(() => import('./isa-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialSetup = dynamic(() => import('./financial-setup/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BankDetailsSettings = dynamic(() => import('./bank-details-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesRoadmap = dynamic(() => import('./sales-roadmap/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MonthlyTargets = dynamic(() => import('./targets/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('./budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('./member-projection/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TurnoverProjection = dynamic(() => import('./turnover/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const IncomeStatementProjection = dynamic(() => import('./income-statement/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTransactions = dynamic(() => import('@/app/backend/revenue/platform-transactions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorElevatorPitch = dynamic(() => import('./investor-elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorOffer = dynamic(() => import('./investor-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorEmailSequence = dynamic(() => import('./investor-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DeveloperManagement = dynamic(() => import('./developer-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DeveloperElevatorPitch = dynamic(() => import('./developer-elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DeveloperOffer = dynamic(() => import('./developer-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DeveloperEmailSequence = dynamic(() => import('./developer-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) {
            return;
        }

        if (!user) {
            router.replace('/signin?redirect=/adminaccount');
        } else if (user.email !== 'mkoton100@gmail.com' && user.email !== 'beyondtransport@gmail.com') {
            router.replace('/account'); 
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || (user.email !== 'mkoton100@gmail.com' && user.email !== 'beyondtransport@gmail.com')) {
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
      case 'analytics': return <AnalyticsDashboard />;
      
      // Sales & Marketing
      case 'leads-agent': return <LeadsAgent />;
      case 'leads-database': return <LeadsDatabase />;
      case 'marketing-studio': return <CampaignContent 
        title="Marketing Campaigns AI Studio"
        description="Use these tools to generate and enhance visual assets for general marketing, member outreach, and social media."
      />;
       case 'investor-studio': return <InvestorAiContent />;
      case 'partner-studio': return <PartnerAiContent />;
      case 'audio-studio': return <TTSStudio />;
      case 'asset-gallery': return <AssetGallery />;
      case 'member-sales-offer': return <NetworkOffer />;
      case 'member-sales-emails': return <NetworkEmails />;
      case 'member-sales-performance': return <PerformanceContent />;

      // Strategy & Pitching
      case 'members': return <MembersList />;
      case 'staff-management': return <StaffManagement />;
      case 'partners': return <PartnerManagement />;
      case 'isa-agents': return <ISAManagement />;
      case 'investors': return <InvestorManagement />;
      case 'developer-list': return <DeveloperManagement />;
      case 'partner-pitch': return <PartnerElevatorPitch />;
      case 'partner-offer': return <PartnerOffer />;
      case 'partner-emails': return <PartnerEmailSequence />;
      case 'isa-emails': return <ISAEmailSequence />;
      case 'investor-pitch': return <InvestorElevatorPitch />;
      case 'investor-offer': return <InvestorOffer />;
      case 'investor-emails': return <InvestorEmailSequence />;
      case 'developer-pitch': return <DeveloperElevatorPitch />;
      case 'developer-offer': return <DeveloperOffer />;
      case 'developer-emails': return <DeveloperEmailSequence />;
      
      // Financials
      case 'financial-setup': return <FinancialSetup />;
      case 'financial-bank-details': return <BankDetailsSettings />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <MonthlyTargets />;
      case 'budget': return <BudgetPage />;
      case 'member-projection': return <MemberProjection />;
      case 'turnover': return <TurnoverProjection />;
      case 'income-statement': return <IncomeStatementProjection />;
      case 'revenue-ledger': return <PlatformTransactions />;
      
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

  const navigate = (view: string) => router.push(`/adminaccount?view=${view}`, { scroll: false });
  
  const isSalesActive = ['leads-agent', 'leads-database', 'marketing-studio', 'investor-studio', 'partner-studio', 'audio-studio', 'asset-gallery'].includes(activeView);
  const isStrategyActive = [
    'members', 'staff-management', 'partners', 'isa-agents', 'investors', 'developer-list',
    'partner-pitch', 'member-sales-offer', 'member-sales-emails', 
    'partner-offer', 'isa-emails', 'partner-emails',
    'investor-pitch', 'investor-offer', 'investor-emails',
    'developer-pitch', 'developer-offer', 'developer-emails'
  ].includes(activeView);
  const isFinancialsActive = [
      'financial-setup', 'sales-roadmap', 'targets', 'budget', 'member-projection', 
      'turnover', 'income-statement', 'revenue-ledger', 'financial-bank-details'
  ].includes(activeView);
  const isLendingModelActive = activeView.startsWith('lending-');

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
                    <SidebarMenuButton tooltip="Analytics" isActive={activeView === 'analytics'} onClick={() => navigate('analytics')}>
                        <LineChart /><span>Analytics</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sales & Marketing" isActive={isSalesActive}><Handshake /><span>Sales & Marketing</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-agent'} onClick={() => navigate('leads-agent')}><Bot />AI Leads Agent</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-database'} onClick={() => navigate('leads-database')}><Database />Leads Database</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSeparator />
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'marketing-studio'} onClick={() => navigate('marketing-studio')}><Sparkles />Marketing Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'investor-studio'} onClick={() => navigate('investor-studio')}><Sparkles />Investor Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partner-studio'} onClick={() => navigate('partner-studio')}><Sparkles />Partner Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'audio-studio'} onClick={() => navigate('audio-studio')}><Mic />Audio Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'asset-gallery'} onClick={() => navigate('asset-gallery')}><ImageIcon />Asset Gallery</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Strategy & Pitching" isActive={isStrategyActive}><Presentation /><span>Strategy & Pitching</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <SidebarMenuButton size="sm" isActive={['members', 'partner-pitch', 'member-sales-offer', 'member-sales-emails'].includes(activeView)}>
                            <Users />Member Pitch
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'members'} onClick={() => navigate('members')}>Member List</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'partner-pitch'} onClick={() => navigate('partner-pitch')}>Elevator Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'member-sales-offer'} onClick={() => navigate('member-sales-offer')}>Network Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'member-sales-emails'} onClick={() => navigate('member-sales-emails')}>Network Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                        </SidebarMenuSub>
                    </SidebarMenuSubItem>

                    <SidebarMenuSubItem>
                        <SidebarMenuButton size="sm" isActive={['isa-agents', 'partner-pitch', 'partner-offer', 'isa-emails'].some(v => activeView === v)}>
                            <Bot />ISA Pitch
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'isa-agents'} onClick={() => navigate('isa-agents')}>ISA List</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'partner-pitch'} onClick={() => navigate('partner-pitch')}>Elevator Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'partner-offer'} onClick={() => navigate('partner-offer')}>ISA Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'isa-emails'} onClick={() => navigate('isa-emails')}>ISA Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                        </SidebarMenuSub>
                    </SidebarMenuSubItem>

                    <SidebarMenuSubItem>
                        <SidebarMenuButton size="sm" isActive={['partners', 'partner-pitch', 'partner-offer', 'partner-emails'].includes(activeView)}>
                            <Handshake />Partner Pitch
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'partners'} onClick={() => navigate('partners')}>Partner List</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'partner-pitch'} onClick={() => navigate('partner-pitch')}>Elevator Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'partner-offer'} onClick={() => navigate('partner-offer')}>Partner Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'partner-emails'} onClick={() => navigate('partner-emails')}>Partner Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                        </SidebarMenuSub>
                    </SidebarMenuSubItem>

                    <SidebarMenuSubItem>
                        <SidebarMenuButton size="sm" isActive={['investors', 'investor-pitch', 'investor-offer', 'investor-emails'].includes(activeView)}>
                            <Briefcase />Investor Pitch
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                             <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'investors'} onClick={() => navigate('investors')}>Investor List</SidebarMenuSubButton></SidebarMenuSubItem>
                             <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'investor-pitch'} onClick={() => navigate('investor-pitch')}>Elevator Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                             <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'investor-offer'} onClick={() => navigate('investor-offer')}>Investor Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                             <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'investor-emails'} onClick={() => navigate('investor-emails')}>Investor Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                        </SidebarMenuSub>
                    </SidebarMenuSubItem>

                    <SidebarMenuSubItem>
                        <SidebarMenuButton size="sm" isActive={['developer-list', 'developer-pitch', 'developer-offer', 'developer-emails'].includes(activeView)}>
                            <Code />Developer Pitch
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'developer-list'} onClick={() => navigate('developer-list')}>Developer List</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'developer-pitch'} onClick={() => navigate('developer-pitch')}>Elevator Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'developer-offer'} onClick={() => navigate('developer-offer')}>Developer Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                            <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'developer-emails'} onClick={() => navigate('developer-emails')}>Developer Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                        </SidebarMenuSub>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Financials" isActive={isFinancialsActive}>
                        <FinancialSheetIcon /><span>App Financials</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Inputs</span></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => navigate('financial-setup')}><Settings />Set Up</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'financial-bank-details'} onClick={() => navigate('financial-bank-details')}><Banknote />Bank Details</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'sales-roadmap'} onClick={() => navigate('sales-roadmap')}><Map />Sales Roadmap</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'targets'} onClick={() => navigate('targets')}><Target />Monthly Targets</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => navigate('budget')}><Calculator />Budget</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSeparator />
                        <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Projections</span></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'member-projection'} onClick={() => navigate('member-projection')}><Users />Members</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'turnover'} onClick={() => navigate('turnover')}><DollarSign />Turnover</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'income-statement'} onClick={() => navigate('income-statement')}><TrendingUp />Income Statement</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSeparator />
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'revenue-ledger'} onClick={() => navigate('revenue-ledger')}><DollarSign />Revenue Ledger</SidebarMenuSubButton></SidebarMenuSubItem>
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
      <BackendContent />
    </Suspense>
  );
}
    

    

    

    
