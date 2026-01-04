
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface TechCardProps {
    name: string;
    description: string;
    price?: number;
    icon: LucideIcon;
    isPercentage?: boolean;
    per?: string;
    priceKey?: string; 
    toolId: 'image-generator' | 'video-generator' | 'seo-booster' | 'other';
}

const formatPrice = (price?: number, isPercentage?: boolean, per?: string) => {
    if (typeof price !== 'number') return 'Contact Us';
    if (price === 0) return 'Free';
    if (isPercentage) return `${price}%`;

    const hasDecimals = price % 1 !== 0;

    const formattedPrice = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(price);
    
    if (per) {
      return `${formattedPrice}/${per}`;
    }

    return `${formattedPrice}/mo`;
};

function GenerationDialog({ toolId, toolName, price, per, onOpenChange }: { toolId: 'image-generator' | 'video-generator', toolName: string, price?: number, per?: string, onOpenChange: (open: boolean) => void }) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resultUri, setResultUri] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useUser();

    const endpoint = toolId === 'image-generator' ? '/api/generateImage' : '/api/generateVideo';
    const isVideo = toolId === 'video-generator';

    const handleGenerate = async () => {
        if (!prompt) {
            toast({ variant: 'destructive', title: 'Prompt is required.' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'Please sign in to use this feature.' });
            return;
        }
        setIsLoading(true);
        setResultUri(null);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Failed to generate ${isVideo ? 'video' : 'image'}`);
            
            const dataUri = isVideo ? result.videoDataUri : result.imageDataUri;
            setResultUri(dataUri);
            toast({ title: `${isVideo ? 'Video' : 'Image'} Generated!`, description: "Review your new creation below." });

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{toolName}</DialogTitle>
                <DialogDescription>
                    Describe the {isVideo ? 'video' : 'image'} you want to create. Be descriptive!
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="prompt">Your Prompt</Label>
                    <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={isVideo ? "e.g., A cinematic fly-around of a heavy-duty truck engine..." : "e.g., A logo for a trucking company called 'Swift Haul'..."} />
                </div>
                {isLoading && (
                    <div className="text-center py-10">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-muted-foreground">Generating... This may take {isVideo ? 'a minute or two' : 'a few moments'}.</p>
                    </div>
                )}
                {resultUri && (
                    <div>
                        <h4 className="font-semibold mb-2">Generated Result:</h4>
                        {isVideo ? (
                            <video controls src={resultUri} className="w-full rounded-md" />
                        ) : (
                            <Image src={resultUri} alt="Generated image" width={512} height={512} className="rounded-md mx-auto" />
                        )}
                    </div>
                )}
            </div>
            <DialogFooter className="sm:justify-between">
                <p className="text-sm text-muted-foreground">Cost: <span className="font-bold">{formatPrice(price, false, per)}</span> per generation</p>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function TechCard({ name, description, price, icon: Icon, isPercentage, per, toolId }: TechCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Only render a dialog for generator tools
    if (toolId === 'image-generator' || toolId === 'video-generator') {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardDescription>{description}</CardDescription>
                    </CardContent>
                    <CardFooter className="flex-col items-start pt-4 border-t">
                        <p className="text-2xl font-bold text-primary mb-4">
                            {formatPrice(price, isPercentage, per)}
                        </p>
                        <DialogTrigger asChild>
                            <Button className="w-full">Generate</Button>
                        </DialogTrigger>
                    </CardFooter>
                </Card>
                <GenerationDialog toolId={toolId} toolName={name} price={price} per={per} onOpenChange={setIsOpen} />
            </Dialog>
        )
    }

    // Default card for other tools
    return (
        <Card className="flex flex-col">
            <CardHeader>
                 <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardDescription>{description}</CardDescription>
            </CardContent>
            <CardFooter className="flex-col items-start pt-4 border-t">
                 <p className="text-2xl font-bold text-primary mb-4">
                    {formatPrice(price, isPercentage, per)}
                </p>
                <Button asChild className="w-full">
                    <Link href="/account">Activate</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
