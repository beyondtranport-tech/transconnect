
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
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  Banknote,
  Combine,
  Truck,
  Building,
  TrendingUp,
  LineChart,
  Book,
  Loader2,
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
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

import { useUser, useAuth } from '@/firebase';
import { getClientSideAuthToken } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Using next/dynamic to lazy-load components
import dynamic from 'next/dynamic';
import MemberWallet from './wallet/[memberId]/member-wallet';

const DashboardContent = dynamic(() => import('./dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MembersList = dynamic(() => import('./members-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffList = dynamic(() => import('./staff-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopsList = dynamic(() => import('./shops-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ContributionsList = dynamic(() => import('./contributions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletTransactionsList = dynamic(() => import('./wallet-transactions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ReconciliationPage = dynamic(() => import('./reconciliation/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BankDetailsSettings = dynamic(() => import('./bank-details-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ChartOfAccountsSettings = dynamic(() => import('./chart-of-accounts-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LoyaltySettings = dynamic(() => import('./loyalty-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const RewardsManagement = dynamic(() => import('./rewards-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const RewardStatus = dynamic(() => import('./reward-status'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PricingManagement = dynamic(() => import('./revenue/pricing-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MallCommissions = dynamic(() => import('./revenue/mall-commissions'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MarketplaceFees = dynamic(() => import('./revenue/marketplace-fees'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ConnectPlanPricing = dynamic(() => import('./revenue/connect-plan-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TechPricing = dynamic(() => import('./revenue/tech-pricing'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PermissionsContent = dynamic(() => import('./permissions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ActivityFeed = dynamic(() => import('./activity-feed'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


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

// Stable helper function
async function fetchFromAdminAPI(action: string, payload?: any) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}


function FundingDivisionContent() {
    const [stats, setStats] = useState({ applications: 0, totalRequested: 0, totalFunded: 0 });
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchFromAdminAPI('getFinanceApplications');
            if (result.data) {
                const apps = result.data;
                const totalFunded = apps.filter((app: any) => app.status === 'funded').reduce((sum: number, app: any) => sum + (app.amountRequested || 0), 0);
                const totalRequested = apps.reduce((sum: number, app: any) => sum + (app.amountRequested || 0), 0);
                setStats({ applications: apps.length, totalRequested, totalFunded });
                setApplications(apps);
            } else {
                setError("Failed to load funding data.");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);


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
                    <CardTitle>All Funding Records (Quotes & Enquiries)</CardTitle>
                    <CardDescription>A list of all quotes and formal enquiries generated by members across the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow><TableCell>Date</TableCell><TableCell>Member</TableCell><TableCell>Record Type</TableCell><TableCell>Funding Type</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell></TableRow></TableHeader>
                            <TableBody>
                                {applications.length > 0 ? applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="text-xs">{formatDate(app.createdAt)}</TableCell>
                                        <TableCell className="font-mono text-xs max-w-[150px] truncate">
                                            <Link href={`/backend?view=wallet&memberId=${app.applicantId}`} className="hover:underline text-primary">{app.applicantId}</Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={app.recordType === 'Quote' ? 'outline' : 'default'} className="capitalize">
                                                {app.recordType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{app.fundingType?.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{formatPrice(app.amountRequested)}</TableCell>
                                        <TableCell><Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">{app.status?.replace(/_/g, ' ')}</Badge></TableCell>
                                        <TableCell>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/backend?view=wallet&memberId=${app.applicantId}`}>View Member</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No funding records found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
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

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchFromAdminAPI('getShops');
            if (result.data) {
                const allShops = result.data;
                setStats({
                    total: allShops.length,
                    pending: allShops.filter((s:any) => s.status === 'pending_review').length,
                    approved: allShops.filter((s:any) => s.status === 'approved').length,
                });
                setShops(allShops);
            } else {
                setError("Failed to load shop data.");
            }
        } catch(e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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

function PlatformTasksContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Platform Tasks</h1>
            <p className="mt-2 text-muted-foreground">Manage background jobs and scheduled processes.</p>
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

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardContent />;
      case 'members':
        return <MembersList />;
      case 'staff':
        return <StaffList />;
      case 'shops':
        return <ShopsList />;
      case 'wallet':
        if (memberId) {
            return <MemberWallet memberId={memberId} />;
        }
        return <WalletTransactionsList />; // Fallback if no memberId
      case 'activity-feed':
        return <ActivityFeed />;
      case 'platform-tasks':
        return <PlatformTasksContent />;
      case 'platform-settings':
        return <PlatformSettingsContent />;
      case 'permissions':
        return <PermissionsContent />;
      case 'loyalty-settings':
        return <LoyaltySettings />;
      case 'rewards':
        return <RewardsManagement />;
      case 'reward-status':
        return <RewardStatus />;
      case 'revenue-membership':
        return <PricingManagement />;
      case 'revenue-mall-commissions':
        return <MallCommissions />;
      case 'revenue-marketplace-fees':
        return <MarketplaceFees />;
      case 'revenue-connect-plans':
        return <ConnectPlanPricing />;
      case 'revenue-tech-pricing':
        return <TechPricing />;
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
  
  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
                 <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="w-full">
                    <SidebarMenuButton tooltip="Analytics">
                        <LineChart />
                        <span>Analytics</span>
                    </SidebarMenuButton>
                </a>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Members" isActive={activeView === 'members'} onClick={() => router.push('/backend?view=members', { scroll: false })}>
                  <Users />
                  <span>Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => router.push('/backend?view=staff', { scroll: false })}>
                  <Users />
                  <span>Staff</span>
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
                <SidebarMenuButton tooltip="Permissions" isActive={activeView === 'permissions'} onClick={() => router.push('/backend?view=permissions', { scroll: false })}>
                    <Lock />
                    <span>Permissions</span>
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
                            <span>Member Wallet Ledger</span>
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
                    <SidebarMenuButton tooltip="Rewards and Loyalty" isActive={activeView.includes('loyalty') || activeView.includes('reward')}>
                        <Star />
                        <span>Rewards and Loyalty</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubButton isActive={activeView === 'loyalty-settings'} onClick={() => router.push('/backend?view=loyalty-settings', { scroll: false })}>
                            <Settings />
                            <span>Tier & Point Settings</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'reward-status'} onClick={() => router.push('/backend?view=reward-status', { scroll: false })}>
                            <Award />
                            <span>Reward Status</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'rewards'} onClick={() => router.push('/backend?view=rewards', { scroll: false })}>
                            <Gift />
                            <span>Redeemable Rewards</span>
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
                        <SidebarMenuSubButton isActive={activeView === 'activity-feed'} onClick={() => router.push('/backend?view=activity-feed', { scroll: false })}>
                            <Activity />
                            <span>Activity Feed</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton isActive={activeView === 'platform-tasks'} onClick={() => router.push('/backend?view=platform-tasks', { scroll: false })}>
                            <ListTodo />
                            <span>Tasks</span>
                        </SidebarMenuSubButton>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Revenue" isActive={activeView.startsWith('revenue')}>
                        <DollarSign />
                        <span>Revenue</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubButton tooltip="Membership Plans" isActive={activeView === 'revenue-membership'} onClick={() => router.push('/backend?view=revenue-membership', { scroll: false })}>
                            <TrendingUp />
                            <span>Membership</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton tooltip="Mall Commissions" isActive={activeView === 'revenue-mall-commissions'} onClick={() => router.push('/backend?view=revenue-mall-commissions', { scroll: false })}>
                            <ShoppingBasket />
                            <span>Mall Commissions</span>
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton tooltip="Marketplace Fees" isActive={activeView === 'revenue-marketplace-fees'} onClick={() => router.push('/backend?view=revenue-marketplace-fees', { scroll: false })}>
                            <Store />
                            <span>Marketplace Fees</span>
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton tooltip="Connect Plan Pricing" isActive={activeView === 'revenue-connect-plans'} onClick={() => router.push('/backend?view=revenue-connect-plans', { scroll: false })}>
                            <HandCoins />
                            <span>Connect Plans</span>
                        </SidebarMenuSubButton>
                         <SidebarMenuSubButton tooltip="Tech Component Pricing" isActive={activeView === 'revenue-tech-pricing'} onClick={() => router.push('/backend?view=revenue-tech-pricing', { scroll: false })}>
                            <Cpu />
                            <span>Tech Pricing</span>
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
                title="Sign Out of Backend"
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
