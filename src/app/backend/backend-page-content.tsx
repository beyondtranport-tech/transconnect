
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
  Handshake as HandshakeIcon,
  Package,
  LayoutDashboard,
  Mail,
  Calculator,
  Target,
  Info,
  Bot,
  Database,
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

// --- Business Strategy Components ---
const SalesRoadmap = dynamic(() => import('../account/sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('../account/budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ForecastPage = dynamic(() => import('../account/forecast/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerOffer = dynamic(() => import('../adminaccount/partner-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorOffer = dynamic(() => import('../adminaccount/investor-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ElevatorPitch = dynamic(() => import('../adminaccount/elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerElevatorPitch = dynamic(() => import('../adminaccount/partner-elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerEmailSequence = dynamic(() => import('../adminaccount/partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorEmailSequence = dynamic(() => import('../adminaccount/investor-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialSetup = dynamic(() => import('../account/financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('../account/member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const Targets = dynamic(() => import('../account/targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffContent = dynamic(() => import('./staff-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CostCalculator = dynamic(() => import('../adminaccount/cost-calculator'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// --- Business Operations Components (from /backend) ---
const MemberWallet = dynamic(() => import('./wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DashboardContent = dynamic(() => import('./dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsAgent = dynamic(() => import('../adminaccount/leads-agent'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsDatabase = dynamic(() => import('../adminaccount/leads-database'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CampaignContent = dynamic(() => import('../adminaccount/campaign-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// --- Sales Section (from /account) ---
const NetworkContent = dynamic(() => import('../account/network-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkOffer = dynamic(() => import('../account/network-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkEmails = dynamic(() => import('../account/network-emails'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PerformanceContent = dynamic(() => import('../account/performance-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// --- Placeholder Components ---
function ProductSalesContent() {
    return (
        <Card>
            <CardHeader><CardTitle>Product Sales</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">This section is under construction.</p></CardContent>
        </Card>
    )
}
function EarningsContent() {
     return (
        <Card>
            <CardHeader><CardTitle>My Earnings</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">This section is under construction.</p></CardContent>
        </Card>
    )
}

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

  const renderContent = useCallback(() => {
    switch (activeView) {
      // Business Strategy
      case 'partner-offer': return <PartnerOffer />;
      case 'partner-elevator-pitch': return <PartnerElevatorPitch />;
      case 'partner-email': return <PartnerEmailSequence />;
      case 'investor-offer': return <InvestorOffer />;
      case 'elevator-pitch': return <ElevatorPitch />;
      case 'investor-email': return <InvestorEmailSequence />;
      case 'financial-setup': return <FinancialSetup />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <Targets />;
      case 'member-projection': return <MemberProjection />;
      case 'budget': return <BudgetPage />;
      case 'forecast': return <ForecastPage />;
      case 'cost-calculator': return <CostCalculator />;
      
      // Business Operations
      case 'dashboard': return <DashboardContent />;
      case 'staff': return <StaffContent />;
      case 'leads-agent': return <LeadsAgent />;
      case 'leads-database': return <LeadsDatabase />;
      case 'campaigns': return <CampaignContent />;
       case 'wallet':
        if (memberId) {
            return <MemberWallet memberId={memberId} />;
        }
        return null;

       // Sales Section
      case 'network': return <NetworkContent />;
      case 'network-offer': return <NetworkOffer />;
      case 'network-emails': return <NetworkEmails />;
      case 'performance': return <PerformanceContent />;
      case 'product-sales': return <ProductSalesContent />;
      case 'earnings': return <EarningsContent />;

      default:
        return <DashboardContent />;
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

  const isSalesActive = ['network', 'network-offer', 'network-emails', 'performance', 'product-sales', 'earnings'].includes(activeView);
  const isPartnerPitchActive = ['partner-offer', 'partner-email', 'partner-elevator-pitch'].includes(activeView);
  const isInvestorPitchActive = ['investor-offer', 'investor-email', 'elevator-pitch'].includes(activeView);


  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                App Backend
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Admin Account" asChild>
                      <Link href="/adminaccount">
                          <Server />
                          <span>Admin Account</span>
                      </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/backend?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Partner Pitch" isActive={isPartnerPitchActive}>
                  <Presentation />
                  <span>Partner Pitch</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'partner-elevator-pitch'} onClick={() => router.push('/backend?view=partner-elevator-pitch', { scroll: false })}>
                        <Info />
                        <span>Elevator Pitch</span>
                    </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'partner-offer'} onClick={() => router.push('/backend?view=partner-offer', { scroll: false })}>
                        <Presentation />
                        <span>Partner Offer</span>
                    </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'partner-email'} onClick={() => router.push('/backend?view=partner-email', { scroll: false })}>
                        <Mail />
                        <span>Email Sequence</span>
                    </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Investor Pitch" isActive={isInvestorPitchActive}>
                  <Presentation />
                  <span>Investor Pitch</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'elevator-pitch'} onClick={() => router.push('/backend?view=elevator-pitch', { scroll: false })}>
                        <Info />
                        <span>Elevator Pitch</span>
                    </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'investor-offer'} onClick={() => router.push('/backend?view=investor-offer', { scroll: false })}>
                        <Presentation />
                        <span>Investor Offer</span>
                    </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'investor-email'} onClick={() => router.push('/backend?view=investor-email', { scroll: false })}>
                        <Mail />
                        <span>Email Sequence</span>
                    </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sales" isActive={isSalesActive}>
                    <HandshakeIcon />
                    <span>Sales</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'network'} onClick={() => router.push('/backend?view=network', { scroll: false })}>
                          <Users />
                          <span>My Network</span>
                      </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'network-offer'} onClick={() => router.push('/backend?view=network-offer', { scroll: false })}>
                          <Presentation />
                          <span>Network Offer</span>
                      </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'network-emails'} onClick={() => router.push('/backend?view=network-emails', { scroll: false })}>
                          <Mail />
                          <span>Network Emails</span>
                      </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'performance'} onClick={() => router.push('/backend?view=performance', { scroll: false })}>
                          <TrendingUp />
                          <span>Performance</span>
                      </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'product-sales'} onClick={() => router.push('/backend?view=product-sales', { scroll: false })}>
                          <Package />
                          <span>Product Sales</span>
                      </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'earnings'} onClick={() => router.push('/backend?view=earnings', { scroll: false })}>
                          <DollarSign />
                          <span>Earnings</span>
                      </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                  </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Projection" isActive={['financial-setup', 'sales-roadmap', 'targets', 'member-projection', 'budget', 'forecast', 'cost-calculator'].includes(activeView)}>
                      <TrendingUp />
                      <span>Projection</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => router.push('/backend?view=financial-setup', { scroll: false })}>
                          <Settings />
                          <span>Setup</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'sales-roadmap'} onClick={() => router.push('/backend?view=sales-roadmap', { scroll: false })}>
                          <Map />
                          <span>Sales Roadmap</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'targets'} onClick={() => router.push('/backend?view=targets', { scroll: false })}>
                          <Target />
                          <span>Targets</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'member-projection'} onClick={() => router.push('/backend?view=member-projection', { scroll: false })}>
                          <Users />
                          <span>Member Projection</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'cost-calculator'} onClick={() => router.push('/backend?view=cost-calculator', { scroll: false })}>
                          <Calculator />
                          <span>Cost Calculator</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => router.push('/backend?view=budget', { scroll: false })}>
                          <FinancialSheetIcon />
                          <span>Budget</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={activeView === 'forecast'} onClick={() => router.push('/backend?view=forecast', { scroll: false })}>
                          <TrendingUp />
                          <span>Forecast</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
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
  );
}
