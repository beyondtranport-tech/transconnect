
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
  ImageIcon,
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
const PartnerOffer = dynamic(() => import('./partner-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorOffer = dynamic(() => import('./investor-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ElevatorPitch = dynamic(() => import('./elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerElevatorPitch = dynamic(() => import('./partner-elevator-pitch'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerEmailSequence = dynamic(() => import('./partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorEmailSequence = dynamic(() => import('./investor-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialSetup = dynamic(() => import('../account/financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('../account/member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const Targets = dynamic(() => import('../account/targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffContent = dynamic(() => import('./staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CostCalculator = dynamic(() => import('./cost-calculator'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// --- Business Operations Components (from /backend) ---
const MemberWallet = dynamic(() => import('../backend/wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DashboardContent = dynamic(() => import('../backend/dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsAgent = dynamic(() => import('./leads-agent'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsDatabase = dynamic(() => import('./leads-database'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


// --- Sales & Marketing AI ---
const AssetGallery = dynamic(() => import('./asset-gallery'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerAiContent = dynamic(() => import('./partner-ai-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorAiContent = dynamic(() => import('./investor-ai-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberAiContent = dynamic(() => import('./campaign-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


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
  const initialView = searchParams.get('view') || 'partner-offer';
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
      case 'financial-setup': return <FinancialSetup />;
      case 'cost-calculator': return <CostCalculator />;
      
      // Business Operations
      case 'dashboard': return <DashboardContent />;
      case 'staff': return <StaffContent />;
       case 'wallet':
        if (memberId) {
            return <MemberWallet memberId={memberId} />;
        }
        return null;

       // Sales & Lead Gen (shared components)
      case 'leads-agent': return <LeadsAgent />;
      case 'leads-database': return <LeadsDatabase />;
      
      // Member Sales
      case 'member-sales-offer': return <NetworkOffer />;
      case 'member-sales-emails': return <NetworkEmails />;
      case 'member-sales-performance': return <PerformanceContent />;
      case 'member-ai-content': return <MemberAiContent 
        title="Member Sales & Marketing AI Studio"
        description="Use these tools to generate and enhance visual assets for your sales and marketing campaigns to members."
      />;

      // Partner Sales
      case 'partner-sales-pitch': return <PartnerElevatorPitch />;
      case 'partner-sales-offer': return <PartnerOffer />;
      case 'partner-sales-emails': return <PartnerEmailSequence />;
      case 'partner-ai-content': return <PartnerAiContent />;
      
      // Investor Sales
      case 'investor-sales-pitch': return <ElevatorPitch />;
      case 'investor-sales-offer': return <InvestorOffer />;
      case 'investor-sales-emails': return <InvestorEmailSequence />;
      case 'investor-ai-content': return <InvestorAiContent />;
      
      // Marketing & AI
      case 'asset-gallery': return <AssetGallery />;

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

  const context = searchParams.get('context');
  
  const isMemberSalesActive = ['member-sales-offer', 'member-sales-emails', 'member-sales-performance', 'member-ai-content'].includes(activeView) || (['leads-agent', 'leads-database'].includes(activeView) && context === 'member');
  const isPartnerSalesActive = ['partner-sales-pitch', 'partner-sales-offer', 'partner-sales-emails', 'partner-ai-content'].includes(activeView) || (['leads-agent', 'leads-database'].includes(activeView) && context === 'partner');
  const isInvestorSalesActive = ['investor-sales-pitch', 'investor-sales-offer', 'investor-sales-emails', 'investor-ai-content'].includes(activeView) || (['leads-agent', 'leads-database'].includes(activeView) && context === 'investor');
  const isMarketingActive = ['asset-gallery'].includes(activeView);

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
                  <SidebarMenuButton tooltip="App Backend" asChild>
                      <Link href="/backend">
                          <Server />
                          <span>App Backend</span>
                      </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/adminaccount?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Platform Staff" isActive={activeView === 'staff'} onClick={() => router.push('/adminaccount?view=staff', { scroll: false })}>
                  <Users />
                  <span>Platform Staff</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Member Sales" isActive={isMemberSalesActive}>
                    <HandshakeIcon />
                    <span>Member Sales</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'leads-agent' && context === 'member'} onClick={() => router.push('/adminaccount?view=leads-agent&context=member', { scroll: false })}>
                          <Bot />
                          <span>AI Prospecting</span>
                      </SidebarMenuSubButton>
                       <SidebarMenuSubButton isActive={activeView === 'leads-database' && context === 'member'} onClick={() => router.push('/adminaccount?view=leads-database&context=member', { scroll: false })}>
                          <Database />
                          <span>Leads Database</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSeparator />
                       <SidebarMenuSubButton isActive={activeView === 'member-sales-offer'} onClick={() => router.push('/adminaccount?view=member-sales-offer', { scroll: false })}>
                          <Presentation />
                          <span>Network Offer</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'member-sales-emails'} onClick={() => router.push('/adminaccount?view=member-sales-emails', { scroll: false })}>
                          <Mail />
                          <span>Email Sequence</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'member-sales-performance'} onClick={() => router.push('/adminaccount?view=member-sales-performance', { scroll: false })}>
                          <TrendingUp />
                          <span>Performance</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'member-ai-content'} onClick={() => router.push('/adminaccount?view=member-ai-content', { scroll: false })}>
                          <Sparkles />
                          <span>AI Content</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Partner Sales" isActive={isPartnerSalesActive}>
                  <Briefcase />
                  <span>Partner Sales</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubButton isActive={activeView === 'leads-agent' && context === 'partner'} onClick={() => router.push('/adminaccount?view=leads-agent&context=partner', { scroll: false })}>
                        <Bot />
                        <span>AI Prospecting</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'leads-database' && context === 'partner'} onClick={() => router.push('/adminaccount?view=leads-database&context=partner', { scroll: false })}>
                        <Database />
                        <span>Partner Database</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSeparator />
                    <SidebarMenuSubButton isActive={activeView === 'partner-sales-pitch'} onClick={() => router.push('/adminaccount?view=partner-sales-pitch', { scroll: false })}>
                        <Info />
                        <span>Elevator Pitch</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'partner-sales-offer'} onClick={() => router.push('/adminaccount?view=partner-sales-offer', { scroll: false })}>
                        <Presentation />
                        <span>Partner Offer</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'partner-sales-emails'} onClick={() => router.push('/adminaccount?view=partner-sales-emails', { scroll: false })}>
                        <Mail />
                        <span>Email Sequence</span>
                    </SidebarMenuSubButton>
                     <SidebarMenuSubButton isActive={activeView === 'partner-ai-content'} onClick={() => router.push('/adminaccount?view=partner-ai-content', { scroll: false })}>
                        <Sparkles />
                        <span>AI Content</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Investor Sales" isActive={isInvestorSalesActive}>
                  <DollarSign />
                  <span>Investor Sales</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                     <SidebarMenuSubButton isActive={activeView === 'leads-agent' && context === 'investor'} onClick={() => router.push('/adminaccount?view=leads-agent&context=investor', { scroll: false })}>
                        <Bot />
                        <span>AI Prospecting</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'leads-database' && context === 'investor'} onClick={() => router.push('/adminaccount?view=leads-database&context=investor', { scroll: false })}>
                        <Database />
                        <span>Investor Database</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSeparator />
                    <SidebarMenuSubButton isActive={activeView === 'investor-sales-pitch'} onClick={() => router.push('/adminaccount?view=investor-sales-pitch', { scroll: false })}>
                        <Info />
                        <span>Elevator Pitch</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'investor-sales-offer'} onClick={() => router.push('/adminaccount?view=investor-sales-offer', { scroll: false })}>
                        <Presentation />
                        <span>Investor Offer</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'investor-sales-emails'} onClick={() => router.push('/adminaccount?view=investor-sales-emails', { scroll: false })}>
                        <Mail />
                        <span>Email Sequence</span>
                    </SidebarMenuSubButton>
                     <SidebarMenuSubButton isActive={activeView === 'investor-ai-content'} onClick={() => router.push('/adminaccount?view=investor-ai-content', { scroll: false })}>
                        <Sparkles />
                        <span>AI Content</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Marketing & AI" isActive={isMarketingActive}>
                      <Sparkles />
                      <span>Marketing & AI</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'asset-gallery'} onClick={() => router.push('/adminaccount?view=asset-gallery', { scroll: false })}>
                          <ImageIcon />
                          <span>Asset Gallery</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Projection" isActive={['financial-setup', 'cost-calculator'].includes(activeView)}>
                      <TrendingUp />
                      <span>Projection</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => router.push('/adminaccount?view=financial-setup', { scroll: false })}>
                          <Settings />
                          <span>Setup</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'cost-calculator'} onClick={() => router.push('/adminaccount?view=cost-calculator', { scroll: false })}>
                          <Calculator />
                          <span>Cost Calculator</span>
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
