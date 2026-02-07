
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

// Dashboard
const DashboardContent = dynamic(() => import('./dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AnalyticsDashboard = dynamic(() => import('./analytics-dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// User Management
const MembersList = dynamic(() => import('./members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffManagement = dynamic(() => import('./staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerManagement = dynamic(() => import('./partner-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAManagement = dynamic(() => import('./isa-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorDashboard = dynamic(() => import('./investor-dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// Sales & Marketing
const LeadsAgent = dynamic(() => import('./leads-agent'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsDatabase = dynamic(() => import('./leads-database'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorAiContent = dynamic(() => import('./investor-ai-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerAiContent = dynamic(() => import('./partner-ai-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetGallery = dynamic(() => import('./asset-gallery'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkOffer = dynamic(() => import('../account/network-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkEmails = dynamic(() => import('../account/network-emails'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PerformanceContent = dynamic(() => import('../account/performance-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CampaignContent = dynamic(() => import('./campaign-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TTSStudio = dynamic(() => import('./tts-studio'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// Strategy & Pitching
const PartnerOffer = dynamic(() => import('./partner-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerElevatorPitch = dynamic(() => import('./partner-elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerEmailSequence = dynamic(() => import('./partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAEmailSequence = dynamic(() => import('./isa-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// Financials & Projections
const FinancialSetup = dynamic(() => import('./financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesRoadmap = dynamic(() => import('./sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MonthlyTargets = dynamic(() => import('./targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('./budget'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('./member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TurnoverProjection = dynamic(() => import('./turnover'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const IncomeStatementProjection = dynamic(() => import('./income-statement'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PlatformTransactions = dynamic(() => import('../backend/revenue/platform-transactions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// Lending Model
const LendingAssumptions = dynamic(() => import('./lending-assumptions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingLoanBook = dynamic(() => import('./lending-loan-book'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingIncomeStatement = dynamic(() => import('./lending-income-statement'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingBalanceSheet = dynamic(() => import('./lending-balance-sheet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingCashflow = dynamic(() => import('./lending-cashflow'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


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
      case 'analytics': return <AnalyticsDashboard />;


      // User Management moved into strategy section
      case 'members': return <MembersList />;
      case 'staff-management': return <StaffManagement />;
      case 'partners': return <PartnerManagement />;
      case 'isa-agents': return <ISAManagement />;
      case 'investors': return <InvestorDashboard />;
      
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
      case 'partner-offer': return <PartnerOffer />;
      case 'partner-pitch': return <PartnerElevatorPitch />;
      case 'partner-emails': return <PartnerEmailSequence />;
      case 'isa-emails': return <ISAEmailSequence />;
      
      // Financials
      case 'financial-setup': return <FinancialSetup />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <MonthlyTargets />;
      case 'budget': return <BudgetPage />;
      case 'member-projection': return <MemberProjection />;
      case 'turnover': return <TurnoverProjection />;
      case 'income-statement': return <IncomeStatementProjection />;
      case 'revenue-ledger': return <PlatformTransactions />;
      
      // Lending Model
      case 'lending-assumptions': return <LendingAssumptions />;
      case 'lending-loan-book': return <LendingLoanBook />;
      case 'lending-income-statement': return <LendingIncomeStatement />;
      case 'lending-balance-sheet': return <LendingBalanceSheet />;
      case 'lending-cashflow': return <LendingCashflow />;

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
  
  const isSalesActive = ['leads-agent', 'leads-database', 'marketing-studio', 'investor-studio', 'partner-studio', 'audio-studio', 'asset-gallery'].includes(activeView);
  const isStrategyActive = [
    'partner-offer', 'member-sales-offer', 'member-sales-emails', 
    'member-sales-performance', 'partner-pitch', 'partner-emails', 'isa-emails', 'elevator-pitch', 
    'investor-offer', 'investor-emails', 'isa-agents', 'members', 'partners', 'staff-management',
    'investors'
  ].includes(activeView);
  const isFinancialsActive = [
      'financial-setup', 'sales-roadmap', 'targets', 'budget', 'member-projection', 
      'turnover', 'income-statement', 'revenue-ledger'
  ].includes(activeView);
  const isLendingModelActive = activeView.startsWith('lending-');

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
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
                    <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">ISA Agents</span></SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'isa-agents'} onClick={() => navigate('isa-agents')}>
                            <Bot /> ISA Management
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'partner-offer'} onClick={() => navigate('partner-offer')}>
                            <Presentation /> ISA Offer
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'isa-emails'} onClick={() => navigate('isa-emails')}>
                            <Mail /> ISA Emails
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSeparator />
                    <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Network Members</span></SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'members'} onClick={() => navigate('members')}>
                           <Users /> Member Roster
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'member-sales-offer'} onClick={() => navigate('member-sales-offer')}>
                            <Presentation /> Network Offer
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'member-sales-emails'} onClick={() => navigate('member-sales-emails')}>
                            <Mail /> Network Emails
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'member-sales-performance'} onClick={() => navigate('member-sales-performance')}>
                            <TrendingUp /> Performance
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSeparator />
                     <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Strategic Partners</span></SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                          <SidebarMenuSubButton isActive={activeView === 'partners'} onClick={() => navigate('partners')}>
                              <Handshake /> Partner Management
                          </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partner-pitch'} onClick={() => navigate('partner-pitch')}><Info />Partner Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partner-emails'} onClick={() => navigate('partner-emails')}><Mail />Partner Emails</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSeparator />
                     <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Investors</span></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'investors'} onClick={() => navigate('investors')}><Briefcase />Investors</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Financials" isActive={isFinancialsActive}>
                        <FinancialSheetIcon /><span>App Financials</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Inputs</span></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => navigate('financial-setup')}><Settings />Set Up</SidebarMenuSubButton></SidebarMenuSubItem>
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
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Lending Model" isActive={isLendingModelActive}>
                        <Landmark /><span>Lending Model</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-assumptions'} onClick={() => navigate('lending-assumptions')}><Calculator />Assumptions</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSeparator />
                        <SidebarMenuSubItem><span className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Projections</span></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-loan-book'} onClick={() => navigate('lending-loan-book')}><Database />Loan Book</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-income-statement'} onClick={() => navigate('lending-income-statement')}><TrendingUp />Income Statement</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-balance-sheet'} onClick={() => navigate('lending-balance-sheet')}><FinancialSheetIcon />Balance Sheet</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'lending-cashflow'} onClick={() => navigate('lending-cashflow')}><DollarSign />Cashflow</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Staff Management" isActive={activeView === 'staff-management'} onClick={() => navigate('staff-management')}>
                        <Users /><span>All Staff</span>
                    </SidebarMenuButton>
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
