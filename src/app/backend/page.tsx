
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
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  Truck,
  LayoutDashboard,
  LogOut,
  Server,
  FileText,
  ListTodo,
  DollarSign,
  TrendingUp,
  Boxes,
  HeartHandshake,
  Wallet,
  Banknote,
  Book,
  Loader2,
  ShieldAlert,
  Combine,
  Store,
  Wrench,
  CheckCircle,
  XCircle,
  ShoppingBasket,
  Cpu,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useMemo } from 'react';
import MembersList from './members-list';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import ContributionsList from './contributions-list';
import WalletTransactionsList from './wallet-transactions-list';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import BankDetailsSettings from './bank-details-settings';
import ChartOfAccountsSettings from './chart-of-accounts-settings';
import ReconciliationPage from './reconciliation/page';
import DashboardContent from './dashboard-content';
import ShopsList from './shops-list';
import { checkAdminSdk, getFinanceApplications, getShops } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


// --- START: Division Specific Dashboards ---

const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  membership_payment: 'default',
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
};

function FundingDivisionContent() {
    const [stats, setStats] = useState({ applications: 0, totalRequested: 0, totalFunded: 0 });
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            const result = await getFinanceApplications();
            if (result.success && result.data) {
                const apps = result.data; // The action now pre-filters for us.
                const totalFunded = apps.filter(app => app.status === 'funded').reduce((sum, app) => sum + (app.amountRequested || 0), 0);
                const totalRequested = apps.reduce((sum, app) => sum + (app.amountRequested || 0), 0);
                setStats({ applications: apps.length, totalRequested, totalFunded });
                setApplications(apps);
            } else {
                setError(result.error || "Failed to load funding data.");
            }
            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    if (error) {
        return <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md"><h4 className="font-semibold">Error</h4><p>{error}</p></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Funding Division Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><CardTitle>Total Applications</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.applications}</div></CardContent></Card>
                <Card><CardHeader><CardTitle>Total Value Requested</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatPrice(stats.totalRequested)}</div></CardContent></Card>
                <Card><CardHeader><CardTitle>Total Value Funded</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatPrice(stats.totalFunded)}</div></CardContent></Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Recent Applications (Leads)</CardTitle>
                    <CardDescription>A list of all quotes and applications generated by members and visitors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableCell>Applicant ID</TableCell><TableCell>Type</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHeader>
                        <TableBody>
                            {applications.length > 0 ? applications.slice(0, 10).map(app => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-mono text-xs">{app.applicantId}</TableCell>
                                    <TableCell className="capitalize">{app.fundingType?.replace(/_/g, ' ')}</TableCell>
                                    <TableCell>{formatPrice(app.amountRequested)}</TableCell>
                                    <TableCell><Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">{app.status?.replace(/_/g, ' ')}</Badge></TableCell>
                                    <TableCell>{formatDate(app.createdAt)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No funding applications found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
function MallDivisionContent() {
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
    const [shops, setShops] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            const result = await getShops();
            if (result.success && result.data) {
                const allShops = result.data;
                setStats({
                    total: allShops.length,
                    pending: allShops.filter(s => s.status === 'pending_review').length,
                    approved: allShops.filter(s => s.status === 'approved').length,
                });
                setShops(allShops);
            } else {
                setError(result.error || "Failed to load shop data.");
            }
            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
     if (error) {
        return <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md"><h4 className="font-semibold">Error</h4><p>{error}</p></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Mall Division Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><CardTitle>Total Shops</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
                <Card><CardHeader><CardTitle>Pending Approval</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent></Card>
                <Card><CardHeader><CardTitle>Approved & Live</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.approved}</div></CardContent></Card>
            </div>
             <Card>
                <CardHeader><CardTitle>Recently Created/Updated Shops</CardTitle></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableCell>Shop Name</TableCell><TableCell>Owner ID</TableCell><TableCell>Category</TableCell><TableCell>Status</TableCell></TableRow></TableHeader>
                        <TableBody>
                            {shops.slice(0, 5).map(shop => (
                                <TableRow key={shop.id}>
                                    <TableCell className="font-medium">{shop.shopName}</TableCell>
                                    <TableCell className="font-mono text-xs">{shop.ownerId}</TableCell>
                                    <TableCell>{shop.category}</TableCell>
                                    <TableCell><Badge variant={statusColors[shop.status] || 'secondary'} className="capitalize">{shop.status?.replace(/_/g, ' ')}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function MarketplaceDivisionContent() {
    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Marketplace Division Dashboard</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Future Metrics</CardTitle>
                    <CardDescription>This dashboard will provide insights into the partner reseller network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">Key performance indicators will include:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Total number of active reseller partners.</li>
                        <li>Sales performance per partner service category (e.g., Digital Marketing, Data Services).</li>
                        <li>Commission revenue generated through the marketplace.</li>
                        <li>Most popular partner services.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
function TechDivisionContent() {
    return (
         <div className="space-y-8">
            <h1 className="text-2xl font-bold">Tech Division Dashboard</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Future Metrics</CardTitle>
                    <CardDescription>This dashboard will track the usage and performance of the technology suite.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">Key performance indicators will include:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>AI Freight Matcher: Number of searches per day, successful matches, and popular routes.</li>
                        <li>Adoption rate of new tech features.</li>
                        <li>API usage statistics for third-party developers.</li>
                        <li>Performance metrics for real-time analytics dashboards.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}

// --- END: Division Specific Dashboards ---

function PlatformSettingsContent() {
    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">Platform Settings</h1>
                <p className="mt-2 text-muted-foreground">Manage central configurations for the TransConnect platform.</p>
            </div>
            <BankDetailsSettings />
            <ChartOfAccountsSettings />
        </div>
    )
}

function DebugToolsContent() {
    const [sdkStatus, setSdkStatus] = useState<{ loading: boolean; success: boolean; error?: string }>({ loading: true, success: false });

    useEffect(() => {
        const checkStatus = async () => {
            setSdkStatus({ loading: true, success: false });
            const result = await checkAdminSdk();
            setSdkStatus({ loading: false, success: result.success, error: result.error });
        };
        checkStatus();
    }, []);

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">Debug Tools</h1>
                <p className="mt-2 text-muted-foreground">Tools for diagnosing the admin backend configuration.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Firebase Admin SDK Status</CardTitle>
                    <CardDescription>
                        This tool checks if the backend server has the correct credentials to perform admin actions like approving shops.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sdkStatus.loading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Checking status...</span>
                        </div>
                    ) : sdkStatus.success ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Admin SDK Initialized Successfully.</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 text-destructive">
                            <div className="flex items-center gap-2 font-semibold">
                                <XCircle className="h-5 w-5" />
                                <span>Admin SDK Initialization Failed.</span>
                            </div>
                            <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md">{sdkStatus.error}</p>
                            <p className="text-sm mt-2">
                                Please ensure the `FIREBASE_ADMIN_SDK_CONFIG_B64` environment variable is correctly set in your deployment environment.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


function PlatformLogsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Platform Logs</h1>
            <p className="mt-2 text-muted-foreground">Monitor system activity and errors.</p>
        </div>
    )
}

function PlatformTasksContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Platform Tasks</h1>
            <p className="mt-2 text-muted-foreground">Manage background jobs and scheduled processes.</p>
        </div>
    )
}

function RevenuePricingContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Revenue Pricing</h1>
            <p className="mt-2 text-muted-foreground">Define and manage membership tiers and prices.</p>
        </div>
    )
}

function DivisionsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Divisions Management</h1>
            <p className="mt-2 text-muted-foreground">Select a division from the sidebar to manage its settings, tasks, and logs.</p>
        </div>
    )
}

function ContributionsContent() {
    return (
        <ContributionsList />
    )
}

function BackendPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user || user.email !== 'beyondtransport@gmail.com') {
        router.replace('/signin?redirect=/backend');
      } else {
        setIsAdmin(true);
      }
    }
  }, [user, isUserLoading, router]);


  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardContent />;
      case 'members':
        return <MembersList />;
      case 'shops':
        return <ShopsList />;
      case 'platform-logs':
        return <PlatformLogsContent />;
      case 'platform-tasks':
        return <PlatformTasksContent />;
      case 'platform-settings':
        return <PlatformSettingsContent />;
      case 'debug-tools':
        return <DebugToolsContent />;
      case 'revenue-pricing':
        return <RevenuePricingContent />;
      case 'wallet-transactions':
        return <WalletTransactionsList />;
      case 'divisions':
        return <DivisionsContent />;
      case 'divisions-funding':
        return <FundingDivisionContent />;
      case 'divisions-mall':
        return <MallDivisionContent />;
      case 'divisions-marketplace':
        return <MarketplaceDivisionContent />;
      case 'divisions-tech':
        return <TechDivisionContent />;
      case 'contributions':
        return <ContributionsContent />;
      case 'wallet-reconciliation':
        return <ReconciliationPage />;
      default:
        return <DashboardContent />;
    }
  }
  
  if (isUserLoading || !isAdmin) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
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
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/backend?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members" isActive={activeView === 'members'} onClick={() => router.push('/backend?view=members', { scroll: false })}>
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Shops" isActive={activeView === 'shops'} onClick={() => router.push('/backend?view=shops', { scroll: false })}>
                  <Store />
                  <span>Shops</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Contributions" isActive={activeView === 'contributions'} onClick={() => router.push('/backend?view=contributions', { scroll: false })}>
                  <HeartHandshake />
                  <span>Contributions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
               <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Wallet">
                        <Wallet />
                        <span>Wallet</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'wallet-transactions'} onClick={() => router.push('/backend?view=wallet-transactions', { scroll: false })}>
                            <DollarSign />
                            <span>Transactions</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'wallet-reconciliation'} onClick={() => router.push('/backend?view=wallet-reconciliation', { scroll: false })}>
                            <Combine />
                            <span>Reconciliation</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Divisions" isActive={activeView.startsWith('divisions')}>
                        <Boxes />
                        <span>Divisions</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'divisions-funding'} onClick={() => router.push('/backend?view=divisions-funding', { scroll: false })}>
                            <Landmark />
                            <span>Funding</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'divisions-mall'} onClick={() => router.push('/backend?view=divisions-mall', { scroll: false })}>
                            <ShoppingBasket />
                            <span>Mall</span>
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton isActive={activeView === 'divisions-marketplace'} onClick={() => router.push('/backend?view=divisions-marketplace', { scroll: false })}>
                            <Store />
                            <span>Marketplace</span>
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton isActive={activeView === 'divisions-tech'} onClick={() => router.push('/backend?view=divisions-tech', { scroll: false })}>
                            <Cpu />
                            <span>Tech</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Platform">
                        <Server />
                        <span>Platform</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'platform-settings'} onClick={() => router.push('/backend?view=platform-settings', { scroll: false })}>
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-logs'} onClick={() => router.push('/backend?view=platform-logs', { scroll: false })}>
                            <FileText />
                            <span>Logs</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-tasks'} onClick={() => router.push('/backend?view=platform-tasks', { scroll: false })}>
                            <ListTodo />
                            <span>Tasks</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Revenue">
                        <DollarSign />
                        <span>Revenue</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'revenue-pricing'} onClick={() => router.push('/backend?view=revenue-pricing', { scroll: false })}>
                            <TrendingUp />
                            <span>Pricing</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Debug Tools" isActive={activeView === 'debug-tools'} onClick={() => router.push('/backend?view=debug-tools', { scroll: false })}>
                  <Wrench />
                  <span>Debug Tools</span>
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
              title="Sign Out of Backend"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-6">
            {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function Backend() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <BackendPageContent />
        </Suspense>
    )
}
