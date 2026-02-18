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
import { Loader2, Sparkles, Image as ImageIcon, Download, Save, Copy } from 'lucide-react';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getClientSideAuthToken } from '@/firebase';

const defaultPrompt = `// A simple logo design prompt for a logistics company.
// Edit the details below to customize your logo.

A modern, minimalist logo for a company named 'Logistics Flow'.

// NEW: Add a tagline if you have one.
// The AI will try to incorporate it into the logo design.
// Example: with the tagline "Your Partner in Motion".
with the tagline "Building Networks, Creating Flow".

// Describe the main symbol or icon.
// Examples: a stylized truck, an abstract arrow, a compass.
The design should feature an abstract representation of a truck and a forward-pointing arrow, conveying movement and efficiency.

// Describe the color palette.
// Examples: 'blue and white', 'green and charcoal gray', 'orange and black'.
Use a clean color palette of forest green and charcoal gray.

// Add any other details.
// Examples: 'The logo should be on a clean white background', 'It should be simple and memorable'.
The logo should be suitable for use on a website and company documents.`;

export default function ImageGeneratorCard({ promptTemplate }: { promptTemplate?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);

  const handleClear = () => {
    setGeneratedImage(null);
    setSavedImageUrl(null);
    setIsSaving(false);
    setUploadProgress(0);
  };


  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt is required',
        description: 'Please describe the image you want to create.',
      });
      return;
    }

    setIsLoading(true);
    handleClear();

    try {
      const result = await generateImage({ prompt });
      setGeneratedImage(result.imageDataUri);
      toast({
        title: 'Image Generated!',
        description: 'Your new image is ready.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Image Downloaded',
      description: 'The image has been saved to your downloads folder.',
    });
  };

  const handleSaveToCloud = async () => {
    if (!generatedImage || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'No image generated or user not found.' });
        return;
    }
    
    setIsSaving(true);
    setUploadProgress(10);
    setSavedImageUrl(null);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

      const folder = `user-assets/${user.uid}/generated-images`;
      const fileName = `generated_${Date.now()}.png`;
      setUploadProgress(30);

      const response = await fetch('/api/uploadImageAsset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileDataUri: generatedImage, folder, fileName }),
      });
      
      setUploadProgress(80);
      const result = await response.json();
      if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to upload image.');
      }
      
      setSavedImageUrl(result.url);
      setUploadProgress(100);
      toast({ title: 'Image Saved!', description: 'Your image is now stored in the asset gallery.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };


  const copyUrlToClipboard = () => {
    if (savedImageUrl) {
        navigator.clipboard.writeText(savedImageUrl);
        toast({ title: 'URL Copied!', description: 'The permanent image URL is on your clipboard.' });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon /> AI Logo & Image Generator
          </CardTitle>
          <CardDescription>
            Create professional logos and marketing images from a text description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Start Generating</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px] flex h-full max-h-[90vh] flex-col">
              <DialogHeader>
                <DialogTitle>AI Logo Generator (Text-to-Logo)</DialogTitle>
                <DialogDescription>
                  Use the template below or write your own detailed prompt to create a logo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto py-4 pr-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="generate-prompt">Your Prompt</Label>
                      <Textarea id="generate-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={20} />
                    </div>
                     <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generate Logo
                    </Button>
                  </div>
                  <div className="space-y-4">
                      <Label>Generated Logo</Label>
                      <div className="relative aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                          {isLoading ? (
                              <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                  <p className="mt-2 text-sm text-muted-foreground">Generating...</p>
                              </div>
                          ) : generatedImage ? (
                              <Image src={generatedImage} alt="Generated" fill className="rounded-md object-contain" />
                          ) : (
                              <p className="text-sm text-muted-foreground">Your generated logo will appear here.</p>
                          )}
                      </div>
                      {isSaving && (
                        <div className="space-y-2">
                            <Label className="text-xs">Saving to Cloud...</Label>
                            <Progress value={uploadProgress} />
                        </div>
                      )}
                      {savedImageUrl && (
                          <div className="space-y-2">
                              <Label>Permanent URL</Label>
                              <div className="flex items-center gap-2">
                                  <Input value={savedImageUrl} readOnly />
                                  <Button variant="outline" size="icon" onClick={copyUrlToClipboard}>
                                      <Copy className="h-4 w-4"/>
                                  </Button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
              <DialogFooter className="mt-auto flex-shrink-0 pt-4 sm:justify-between">
                {generatedImage && (
                  <div className="flex w-full items-center justify-between gap-2">
                     <div className="flex items-center gap-2">
                          <Button variant="secondary" onClick={handleDownload} disabled={isSaving}>
                              <Download className="mr-2 h-4 w-4" /> Download
                          </Button>
                          <Button variant="outline" onClick={handleSaveToCloud} disabled={isSaving || !!savedImageUrl}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                             {savedImageUrl ? 'Saved' : 'Save to Cloud'}
                          </Button>
                     </div>
                     <Button variant="ghost" onClick={handleClear}>Clear Image</Button>
                  </div>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
}
