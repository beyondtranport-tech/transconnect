'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { handleGenerateCampaign } from './actions';
import type { MarketingCampaignOutput } from '@/ai/flows/marketing-campaign-flow';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MarketingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MarketingCampaignOutput | null>(null);
  const [productName, setProductName] = useState('TransConnect');
  const { toast } = useToast();

  const generateContent = async () => {
    if (!productName) {
      toast({
        variant: 'destructive',
        title: 'Product Name Required',
        description: 'Please enter a product name to generate a tagline.',
      });
      return;
    }
    setIsLoading(true);
    setResult(null);
    const response = await handleGenerateCampaign({ productName: productName });
    if (response.success && response.data) {
      setResult(response.data);
      toast({
        title: 'Diagnostic Successful',
        description: 'AI text generation is working.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: response.error,
      });
    }
    setIsLoading(false);
  };

  // Auto-generate on page load for initial diagnostic
  useEffect(() => {
    generateContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="text-center">
          <div className="inline-block bg-primary/10 p-4 rounded-full mb-4 w-fit mx-auto">
            <Wand2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold font-headline">
            AI Text Generation Diagnostic
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            This page serves as a diagnostic tool for AI text generation. Enter a
            product name to generate a tagline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Heavy-Duty Brakes"
              />
            </div>
            <Button
              onClick={generateContent}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Tagline
            </Button>
          </div>

          {isLoading && (
            <div className="text-center py-10 mt-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">
                Generating diagnostic content...
              </p>
            </div>
          )}

          {result && (
            <div className="mt-10">
              <Card className="bg-background">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">
                    Generated Tagline
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center text-center">
                  <p className="text-3xl font-bold font-headline">
                    &ldquo;{result.tagline}&rdquo;
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}