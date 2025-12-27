
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// This is a placeholder for the full multi-step wizard.
// We'll build out each step in subsequent requests.

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

export default function ShopWizard({ shop }: { shop: any }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <div>Step 1: Core Identity Form will go here.</div>;
      case 2:
        return <div>Step 2: Location & Contact Form will go here.</div>;
      case 3:
        return <div>Step 3: Branding & Appearance (Templates/Themes) will go here.</div>;
      case 4:
        return <div>Step 4: SEO & Metadata Form will go here.</div>;
      case 5:
        return <div>Step 5: Product & Catalogue Management (with Image Upload) will go here.</div>;
      case 6:
        return <div>Step 6: Final Preview & Submit for Review will go here.</div>;
      default:
        return <div>Step 1: Core Identity</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Shop Setup Progress</h3>
        <Badge variant={statusColors[shop.status] || 'secondary'} className="capitalize">
            Status: {shop.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Progress Bar Placeholder */}
      <div className="relative h-2 w-full bg-muted rounded-full">
        <div 
          className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {currentStep}: {['Core Identity', 'Location & Contact', 'Branding', 'SEO', 'Products', 'Preview'][currentStep - 1]}</CardTitle>
          <CardDescription>Fill out the details for this step.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="min-h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
                 {renderStepContent()}
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={() => setCurrentStep(s => Math.max(1, s - 1))} disabled={currentStep === 1}>
          Previous
        </Button>
        <Button onClick={() => setCurrentStep(s => Math.min(totalSteps, s + 1))} disabled={currentStep === totalSteps}>
          Next
        </Button>
      </div>

       {shop.status === 'approved' && (
           <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg">
                <p className="font-semibold text-green-800 dark:text-green-200">Your shop is live! Any changes you save will be visible to the public immediately.</p>
           </div>
       )}
    </div>
  );
}

    