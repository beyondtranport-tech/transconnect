'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ImageIcon, Download } from 'lucide-react';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/image-generation-flow';
import Link from 'next/link';
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

export default function IconGeneratorCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(
    'A modern, minimalist icon representing logistics and transport. The design should be a clean, vector-style graphic on a white background, suitable for a logo. Use a simple color palette, primarily green and charcoal. The icon could feature a stylized truck, an arrow indicating movement, or an abstract representation of a network or flow.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt is required',
        description: 'Please describe the icon you want to create.',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const result = await generateImage({ prompt });
      setGeneratedImage(result.imageDataUri);
      toast({
        title: 'Icon Generated!',
        description: 'Your new icon is ready to be downloaded.',
      });
    } catch (e: any) {
      let description: React.ReactNode = e.message;
      if (e.message?.includes('403 Forbidden') || e.message?.includes('API is not enabled')) {
          description = (
              <>
                  The AI API is not enabled for your project, or billing is not set up.
                  <Button asChild variant="link" className="p-0 h-auto ml-1 text-xs -translate-y-px">
                      <Link href="/docs/enable-gemini-api.md" target="_blank">View Setup Guide</Link>
                  </Button>
              </>
          );
      }
      toast({ variant: 'destructive', title: 'Generation Failed', description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `icon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon /> AI Icon Generator
        </CardTitle>
        <CardDescription>
          Create custom icons for your app or member shops using a descriptive prompt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Create Icon</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>AI Icon Generator</DialogTitle>
              <DialogDescription>
                Describe the icon you want to create. Be specific for best results.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="generate-prompt">Your Prompt</Label>
                  <Textarea
                    id="generate-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A minimalist, flat vector icon of a truck..."
                    rows={5}
                  />
                </div>
                <div className="relative aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                     {isLoading ? (
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="mt-2 text-sm text-muted-foreground">Generating...</p>
                        </div>
                    ) : generatedImage ? (
                         <Image src={generatedImage} alt="Generated Icon" fill className="rounded-md object-contain" />
                    ) : (
                        <p className="text-sm text-muted-foreground">Your generated icon will appear here.</p>
                    )}
                </div>
            </div>
            <DialogFooter className="mt-auto pt-4 border-t justify-between">
              {generatedImage && (
                <Button variant="secondary" onClick={handleDownload} disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" /> Download Icon
                </Button>
              )}
              <Button onClick={handleGenerate} disabled={isLoading} className="ml-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Icon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
