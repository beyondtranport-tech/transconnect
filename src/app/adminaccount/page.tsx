
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
  Sheet as FinancialSheetIcon, // Renaming to avoid conflict
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
import { SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// --- Business Strategy Components ---
const SalesRoadmap = dynamic(() => import('../account/sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('../account/budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ForecastPage = dynamic(() => import('../account/forecast/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerOffer = dynamic(() => import('./partner-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerEmailSequence = dynamic(() => import('./partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialSetup = dynamic(() => import('../account/financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('../account/member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const Targets = dynamic(() => import('../account/targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffContent = dynamic(() => import('./staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// --- Business Operations Components (from /backend) ---
const MemberWallet = dynamic(() => import('../backend/wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DashboardContent = dynamic(() => import('../backend/dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

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
      case 'partner-offer': return <PartnerOffer />;
      case 'partner-email': return <PartnerEmailSequence />;
      case 'financial-setup': return <FinancialSetup />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <Targets />;
      case 'member-projection': return <MemberProjection />;
      case 'budget': return <BudgetPage />;
      case 'forecast': return <ForecastPage />;
      
      // Business Operations
      case 'dashboard': return <DashboardContent />;
      case 'staff': return <StaffContent />;
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
        return <PartnerOffer />;
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

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SheetContent side="left" className="md:hidden">
            <SheetHeader>
              <SheetTitle>Admin Account</SheetTitle>
            </SheetHeader>
          </SheetContent>
          <div className="flex w-full items-center justify-between border-b p-2 md:hidden">
              <Link href="/adminaccount" className="flex items-center gap-2 font-semibold">
                  <Building className="h-6 w-6 text-primary" />
                  <span>Admin Account</span>
              </Link>
              <SidebarTrigger />
          </div>
          <SidebarHeader className="hidden md:flex">
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
                  <SidebarMenuButton tooltip="Member Area" asChild>
                      <Link href="/account">
                          <Users />
                          <span>Member Area</span>
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
                <SidebarMenuButton tooltip="Partner Pitch" isActive={['partner-offer', 'partner-email'].includes(activeView)}>
                  <Presentation />
                  <span>Partner Pitch</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubButton isActive={activeView === 'partner-offer'} onClick={() => router.push('/adminaccount?view=partner-offer', { scroll: false })}>
                        <Presentation />
                        <span>Partner Offer</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'partner-email'} onClick={() => router.push('/adminaccount?view=partner-email', { scroll: false })}>
                        <Mail />
                        <span>Email Sequence</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
               <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Sales" isActive={isSalesActive}>
                    <HandshakeIcon />
                    <span>Sales</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'network'} onClick={() => router.push('/adminaccount?view=network', { scroll: false })}>
                          <Users />
                          <span>My Network</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'network-offer'} onClick={() => router.push('/adminaccount?view=network-offer', { scroll: false })}>
                          <Presentation />
                          <span>Network Offer</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'network-emails'} onClick={() => router.push('/adminaccount?view=network-emails', { scroll: false })}>
                          <Mail />
                          <span>Network Emails</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'performance'} onClick={() => router.push('/adminaccount?view=performance', { scroll: false })}>
                          <TrendingUp />
                          <span>Performance</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'product-sales'} onClick={() => router.push('/adminaccount?view=product-sales', { scroll: false })}>
                          <Package />
                          <span>Product Sales</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'earnings'} onClick={() => router.push('/adminaccount?view=earnings', { scroll: false })}>
                          <DollarSign />
                          <span>Earnings</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => router.push('/adminaccount?view=staff', { scroll: false })}>
                  <Users />
                  <span>Staff</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Projection" isActive={['financial-setup', 'sales-roadmap', 'targets', 'member-projection', 'budget', 'forecast'].includes(activeView)}>
                      <TrendingUp />
                      <span>Projection</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => router.push('/adminaccount?view=financial-setup', { scroll: false })}>
                          <Settings />
                          <span>Setup</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'sales-roadmap'} onClick={() => router.push('/adminaccount?view=sales-roadmap', { scroll: false })}>
                          <Map />
                          <span>Sales Roadmap</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'targets'} onClick={() => router.push('/adminaccount?view=targets', { scroll: false })}>
                          <FinancialSheetIcon />
                          <span>Targets</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'member-projection'} onClick={() => router.push('/adminaccount?view=member-projection', { scroll: false })}>
                          <Users />
                          <span>Member Projection</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => router.push('/adminaccount?view=budget', { scroll: false })}>
                          <FinancialSheetIcon />
                          <span>Budget</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'forecast'} onClick={() => router.push('/adminaccount?view=forecast', { scroll: false })}>
                          <TrendingUp />
                          <span>Forecast</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Backend" onClick={() => router.push('/backend', { scroll: false })}>
                      <Server />
                      <span>App Backend</span>
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
