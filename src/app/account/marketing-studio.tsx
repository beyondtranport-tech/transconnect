'use client';

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MarketingStudio() {
  return (
    <div className="space-y-8">
      <CardHeader className="px-0">
          <div className="flex items-center gap-4">
              <Sparkles className="h-8 w-8 text-primary"/>
              <div>
                  <CardTitle>AI Marketing Studio</CardTitle>
                  <CardDescription>
                      Create professional marketing assets for your shop and social media using powerful AI tools.
                  </CardDescription>
              </div>
          </div>
      </CardHeader>
      
      <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Tools Temporarily Disabled</AlertTitle>
          <AlertDescription>
              The AI marketing tools are currently undergoing maintenance to resolve a build issue and will be restored shortly.
          </AlertDescription>
      </Alert>

    </div>
  );
}
