
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
} from '@/components/ui/sidebar';
import {
  LogOut,
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  Landmark,
  FileText,
  BrainCircuit,
  ShoppingCart,
  CalendarCheck,
  Ship,
  ShieldAlert,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import dynamic from 'next/dynamic';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

// Dynamically import content components
const DashboardContent = dynamic(() => import('./dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceContent = dynamic(() => import('./marketplace'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AiMatchingContent = dynamic(() => import('./ai-matching'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WorkflowContent = dynamic(() => import('./workflow'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TbsIntegrationContent = dynamic(() => import('./tbs-integration'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NavisIntegrationContent = dynamic(() => import('./navis-integration'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const GateOptimizationContent = dynamic(() => import('./gate-optimization'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

function UpgradePrompt() {
    return (
        <Card className="w-full max-w-lg text-center mx-auto mt-10">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-primary"><ShieldAlert /> Premium Access Required</CardTitle>
                <CardDescription>
                    This feature is an exclusive benefit for members on a paid plan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Please upgrade your membership to gain access to this powerful tool.</p>
                <Button asChild className="mt-6">
                    <Link href="/pricing">Upgrade Your Plan</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function PortLogisticsPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

   useEffect(() => {
    if (!isUserLoading && !user) {
        router.replace('/signin?redirect=/port-logistics');
    }
  }, [isUserLoading, user, router]);

  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const isAdmin = user?.claims?.admin === true || user?.email === 'mkoton100@gmail.com' || user?.email === 'beyondtransport@gmail.com';
  const isWctaMember = user?.claims?.wcta === true || user?.companyData?.referrerId === 'WCTA';
  const hasPremiumPlan = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

  const renderContent = useCallback(() => {
    // Allow dashboard view for all WCTA members
    if (activeView === 'dashboard') {
      return <DashboardContent />;
    }
    
    // For all other views, require a paid plan or admin status
    if (!isAdmin && !hasPremiumPlan) {
      return <UpgradePrompt />;
    }

    switch (activeView) {
      case 'marketplace': return <MarketplaceContent />;
      case 'ai-matching': return <AiMatchingContent />;
      case 'workflow': return <WorkflowContent />;
      case 'tbs-integration': return <TbsIntegrationContent />;
      case 'navis-integration': return <NavisIntegrationContent />;
      case 'gate-optimization': return <GateOptimizationContent />;
      default: return <DashboardContent />;
    }
  }, [activeView, isAdmin, hasPremiumPlan]);
  
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
  
  // This top-level check now only verifies if the user is a WCTA member at all.
  if (!isAdmin && !isWctaMember) {
        return (
            <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
                 <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-destructive"><ShieldAlert /> Access Denied</CardTitle>
                        <CardDescription>
                            The Port Logistics Portal is an exclusive benefit for WCTA members.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Learn more about our partnerships or return to your account.</p>
                        <div className="flex gap-4 mt-6 justify-center">
                            <Button asChild>
                                <Link href="/account">Go to My Account</Link>
                            </Button>
                             <Button asChild variant="outline">
                                <Link href="/contact">Contact Us</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

  const navigate = (view: string) => router.push(`/port-logistics?view=${view}`, { scroll: false });

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Ship className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Port Logistics
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
                    <SidebarMenuButton tooltip="Marketplace" isActive={activeView === 'marketplace'} onClick={() => navigate('marketplace')}>
                        <ShoppingCart /><span>Marketplace</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="AI Matching" isActive={activeView === 'ai-matching'} onClick={() => navigate('ai-matching')}>
                        <BrainCircuit /><span>AI Matching</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Digital Workflow" isActive={activeView === 'workflow'} onClick={() => navigate('workflow')}>
                        <FileText /><span>Digital Workflow</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="TBS Integration" isActive={activeView === 'tbs-integration'} onClick={() => navigate('tbs-integration')}>
                        <CalendarCheck /><span>TBS Integration</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Navis N4" isActive={activeView === 'navis-integration'} onClick={() => navigate('navis-integration')}>
                        <Landmark /><span>Navis N4 Connectivity</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Gate-In Optimization" isActive={activeView === 'gate-optimization'} onClick={() => navigate('gate-optimization')}>
                        <ShieldCheck /><span>Gate-In Optimization</span>
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
                  {user.displayName || 'Admin'}
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

export default function PortLogisticsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <PortLogisticsPortalContent />
    </Suspense>
  );
}
