'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { handleGenerateCampaign } from './actions';
import type { GenerateImageOutput } from '@/ai/flows/image-generation-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function MarketingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<GenerateImageOutput | null>(null);
    const { toast } = useToast();

    const generateContent = async () => {
        setIsLoading(true);
        setResult(null);
        // Use a simple prompt for the image generation flow.
        const response = await handleGenerateCampaign({ prompt: 'A futuristic logo for a transport logistics company called TransConnect' });
        if (response.success && response.data) {
            setResult(response.data);
            toast({
              title: "Image Generated",
              description: "The diagnostic test to generate an image was successful."
            })
        } else {
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: response.error,
            });
        }
        setIsLoading(false);
    };

    // Auto-generate on page load
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
                    <CardTitle className="text-4xl font-bold font-headline">AI Marketing Diagnostic</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        This page now serves as a diagnostic tool for AI image generation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center mb-10">
                        <Button onClick={generateContent} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Run Diagnostic Again
                        </Button>
                    </div>

                     {isLoading && (
                        <div className="text-center py-10">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Generating diagnostic content...</p>
                        </div>
                    )}
                    
                    {result && result.imageDataUri && (
                        <div className="space-y-4">
                           <p className="text-center text-green-600 font-semibold">Diagnostic Test Successful: Image generation is working.</p>
                           <Card className="bg-background">
                             <CardHeader>
                               <CardTitle className="text-2xl text-primary">Generated Image</CardTitle>
                             </CardHeader>
                             <CardContent className="flex justify-center">
                                <Image src={result.imageDataUri} alt="Generated Diagnostic Image" width={512} height={512} className="rounded-lg shadow-md"/>
                             </CardContent>
                           </Card>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
