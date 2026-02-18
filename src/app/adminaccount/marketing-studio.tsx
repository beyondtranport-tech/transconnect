
'use client';

import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sparkles, Handshake, Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";

const campaigns = [
    {
        title: "Investor Pitch Content",
        description: "Generate professional content tailored for investor presentations, reports, and outreach.",
        icon: Briefcase,
        view: "investor-studio",
    },
    {
        title: "Partner Outreach Content",
        description: "Create visuals and copy to attract and onboard new strategic and ISA partners.",
        icon: Handshake,
        view: "partner-studio",
    },
];

export default function MarketingStudio() {
  return (
    <div className="space-y-8">
      <CardHeader className="px-0">
          <div className="flex items-center gap-4">
              <Sparkles className="h-8 w-8 text-primary"/>
              <div>
                  <CardTitle>AI Content & Branding Studio</CardTitle>
                  <CardDescription>
                      Select a campaign to generate tailored marketing assets, logos, and branding materials using powerful AI tools.
                  </CardDescription>
              </div>
          </div>
      </CardHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {campaigns.map(campaign => {
            const Icon = campaign.icon;
            return (
                <Link key={campaign.view} href={`/adminaccount?view=${campaign.view}`} className="group block">
                    <Card className="h-full flex flex-col transition-all group-hover:border-primary group-hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Icon className="h-7 w-7 text-primary" />
                                <CardTitle>{campaign.title}</CardTitle>
                            </div>
                            <CardDescription>{campaign.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            {/* Can add more details here in the future */}
                        </CardContent>
                        <CardFooter>
                            <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                Open Studio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </p>
                        </CardFooter>
                    </Card>
                </Link>
            )
        })}
      </div>
    </div>
  );
}
