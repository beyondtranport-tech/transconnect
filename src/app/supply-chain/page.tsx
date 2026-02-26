
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
  User,
  Shield,
  Truck,
  Package,
  Building,
  BarChart3,
  Network
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

// Dynamically import content components
const DashboardContent = dynamic(() => import('./dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SuppliersContent = dynamic(() => import('./suppliers'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ProcurementContent = dynamic(() => import('./procurement'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InventoryContent = dynamic(() => import('./inventory'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LogisticsContent = dynamic(() => import('./logistics'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AnalyticsContent = dynamic(() => import('./analytics'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/signin?redirect=/supply-chain');
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

function SupplyChainPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
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
      case 'dashboard': return <DashboardContent />;
      case 'suppliers': return <SuppliersContent />;
      case 'procurement': return <ProcurementContent />;
      case 'inventory': return <InventoryContent />;
      case 'logistics': return <LogisticsContent />;
      case 'analytics': return <AnalyticsContent />;
      default: return <DashboardContent />;
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

  const navigate = (view: string) => router.push(`/supply-chain?view=${view}`, { scroll: false });

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Supply Chain
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
                    <SidebarMenuButton tooltip="Suppliers" isActive={activeView === 'suppliers'} onClick={() => navigate('suppliers')}>
                        <Building /><span>Suppliers</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Procurement" isActive={activeView === 'procurement'} onClick={() => navigate('procurement')}>
                        <ShoppingCart /><span>Procurement</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Inventory" isActive={activeView === 'inventory'} onClick={() => navigate('inventory')}>
                        <Package /><span>Inventory</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Logistics" isActive={activeView === 'logistics'} onClick={() => navigate('logistics')}>
                        <Truck /><span>Logistics</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Analytics" isActive={activeView === 'analytics'} onClick={() => navigate('analytics')}>
                        <BarChart3 /><span>Analytics</span>
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

export default function SupplyChainPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <SupplyChainPortalContent />
    </Suspense>
  );
}
