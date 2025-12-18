import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Gem, User } from "lucide-react";

export default function AccountPage() {
    return (
        <div className="bg-background min-h-full">
            <div className="container mx-auto px-4 py-16">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <User className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-headline">My Account</h1>
                        <p className="text-lg text-muted-foreground">Welcome back, Member!</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Membership Tier</CardTitle>
                            <Gem className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">Gold</div>
                            <p className="text-xs text-muted-foreground">Next tier: Platinum</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">12,450</div>
                            <p className="text-xs text-muted-foreground">+200 points from last month</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Securely store and manage your important documents.</p>
                             <Button disabled>Upload Documents</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Manage your personal and company details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Placeholder for a profile form */}
                            <p className="text-muted-foreground">Profile editing form will be here.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
