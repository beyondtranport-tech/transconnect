
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
  LogOut,
  Loader2,
  TrendingUp,
  Map,
  Sheet,
  Presentation,
  User,
  Settings,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';

import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

import dynamic from 'next/dynamic';
import React from 'react';

const SalesRoadmap = dynamic(() => import('./sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('./budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ForecastPage = dynamic(() => import('./forecast/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PitchContent = dynamic(() => import('./pitch-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialSetup = dynamic(() => import('../account/financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('../account/member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const Targets = dynamic(() => import('../account/targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) {
            return;
        }

        if (!user) {
            router.replace('/signin?redirect=/adminaccount');
        } else if (user.email !== 'beyondtransport@gmail.com') {
            router.replace('/account'); 
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || user.email !== 'beyondtransport@gmail.com') {
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
  const initialView = searchParams.get('view') || 'pitch';
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
      case 'pitch':
        return <PitchContent />;
      case 'financial-setup':
        return <FinancialSetup />;
      case 'sales-roadmap':
        return <SalesRoadmap />;
      case 'targets':
        return <Targets />;
      case 'member-projection':
        return <MemberProjection />;
      case 'budget':
        return <BudgetPage />;
      case 'forecast':
        return <ForecastPage />;
      default:
        return <PitchContent />;
    }
  }, [activeView]);
  
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

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Presentation className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Business Hub
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="ISA Pitch" isActive={activeView === 'pitch'} onClick={() => router.push('/adminaccount?view=pitch', { scroll: false })}>
                <Presentation />
                <span>ISA Pitch</span>
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
                         <Sheet />
                        <span>Targets</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'member-projection'} onClick={() => router.push('/adminaccount?view=member-projection', { scroll: false })}>
                        <Users />
                        <span>Member Projection</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => router.push('/adminaccount?view=budget', { scroll: false })}>
                        <Sheet />
                        <span>Budget</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'forecast'} onClick={() => router.push('/adminaccount?view=forecast', { scroll: false })}>
                        <TrendingUp />
                        <span>Forecast</span>
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
  );
}


export default function AdminAccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
       <AdminAuthGuard>
            <AdminAccountContent />
       </AdminAuthGuard>
    </Suspense>
  );
}
