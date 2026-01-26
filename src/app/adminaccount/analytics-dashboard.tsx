
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AnalyticsDashboard() {
  const gaTrackingId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const isConfigured = gaTrackingId && gaTrackingId !== 'YOUR_GA_TRACKING_ID';

  return (
    <div className="space-y-8">
        <CardHeader className="px-0">
            <div className="flex items-center gap-4">
                <LineChart className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Platform Analytics</CardTitle>
                    <CardDescription>
                       View and analyze user behavior and event data from across the application.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        
        {!isConfigured ? (
             <Alert variant="destructive">
                <AlertTitle>Analytics Not Configured</AlertTitle>
                <AlertDescription>
                   The Google Analytics Tracking ID has not been set up yet. Please follow the setup guide to enable analytics.
                   <Button asChild variant="link" className="p-0 h-auto ml-2">
                       <Link href="/docs/google-analytics-setup.md" target="_blank">View Setup Guide</Link>
                   </Button>
                </AlertDescription>
            </Alert>
        ) : (
            <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Analytics is Active!</AlertTitle>
                <AlertDescription>
                   Your Google Analytics Tracking ID is configured. Events are being sent from your application.
                </AlertDescription>
            </Alert>
        )}
       
        <Card>
            <CardHeader>
                <CardTitle>Viewing Your Data</CardTitle>
                <CardDescription>
                    All analytics events are sent directly to your Google Analytics 4 property. Use the official dashboard to view real-time data, create reports, and analyze user journeys.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                    To see your data, click the button below to go to the Google Analytics Realtime report. Make sure you are logged in to the Google account associated with your tracking ID.
                </p>
                <Button asChild disabled={!isConfigured}>
                    <a href="https://analytics.google.com/analytics/web/#/realtime/rt-overview" target="_blank" rel="noopener noreferrer">
                        Open Google Analytics <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>Key Events We Track</CardTitle>
                <CardDescription>
                    Here are some of the custom events you can look for in your analytics reports:
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li><span className="font-semibold text-foreground">`intent_capture`</span>: Fires when a user chooses "I want to Buy" or "I want to Sell" in a mall. The label will tell you which mall and which choice (e.g., `supplier_primary`).</li>
                    <li><span className="font-semibold text-foreground">`view_supplier_profile`</span>: Tracks when a user views a specific supplier's page.</li>
                    <li><span className="font-semibold text-foreground">`view_transporter_profile`</span>: Tracks when a user views a specific transporter's profile.</li>
                    <li><span className="font-semibold text-foreground">`view_auction_item`</span>: Logs a view of a specific item in the SA Auction Mall.</li>
                    <li><span className="font-semibold text-foreground">`join_from_incentives`</span>: Fires when a user clicks the "Join" button from the Incentives page.</li>
                </ul>
            </CardContent>
        </Card>

    </div>
  );
}
