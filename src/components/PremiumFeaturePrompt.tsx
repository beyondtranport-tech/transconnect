'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import * as React from "react";

interface PremiumFeaturePromptProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

export function PremiumFeaturePrompt({ icon: Icon, title, description }: PremiumFeaturePromptProps) {
    return (
        <Card className="w-full max-w-lg text-center mx-auto mt-10">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-amber-500" />
                    Upgrade to Access {title}
                </CardTitle>
                <CardDescription>
                    {description} This is an exclusive benefit for members on a paid plan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Please upgrade your membership to gain access to this powerful tool.</p>
                <Button asChild className="mt-6">
                    <Link href="/pricing">View Membership Plans</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
