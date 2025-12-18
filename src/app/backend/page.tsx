'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  Truck,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MembersList from './members-list';
import Link from 'next/link';

function DashboardContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Welcome to the admin backend.</p>
        </div>
    )
}

export default function BackendPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');

  const onLogout = async () => {
    // This is a client-side only action, we can just clear the cookie and redirect.
    document.cookie = "__session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/signin');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'members':
        return <MembersList />;
      case 'dashboard':
      default:
        return <DashboardContent />;
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Admin Backend
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members" isActive={activeView === 'members'} onClick={() => setActiveView('members')}>
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Marketplace" disabled>
                  <ShoppingBag />
                  <span>Marketplace</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild variant="ghost" className="w-full justify-start pl-2">
                    <Link href="/backend/secure">
                        <ShieldCheck />
                        <span>Secure Area</span>
                    </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" disabled>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
              <AvatarFallback>SA</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                Super Admin
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                beyondtransport@gmail.com
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-6">
          <div className="flex items-center justify-between">
            {renderContent()}
            <SidebarTrigger className="md:hidden" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
