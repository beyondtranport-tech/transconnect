
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
import { Loader2, Sparkles, Image as ImageIcon, Download, Save, Copy, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { getClientSideAuthToken } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const defaultPrompt = `A cinematic, professional photograph of a futuristic, gleaming white and green Scania truck driving on a high-tech highway at dusk. The road is illuminated with glowing data lines, and the sky has a vibrant sunset. The image should look modern, professional, and convey a sense of speed and efficiency.`;

export default function ImageGeneratorCard({ promptTemplate }: { promptTemplate?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const [isSaving, setIsSaving] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const handleClear = () => {
    setGeneratedImage(null);
    setSavedImageUrl(null);
    setIsSaving(false);
    setStorageError(null);
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
        toast({ variant: 'destructive', title: 'Error', description: 'No image or user available.' });
        return;
    }

    setIsSaving(true);
    setStorageError(null);

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const response = await fetch('/api/uploadImageAsset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageDataUri: generatedImage,
                folder: 'generated-images',
                fileName: `generated_${Date.now()}.png`
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setSavedImageUrl(result.url);
        toast({ title: 'Image Saved!', description: 'Your image is now stored in the asset gallery.' });
    } catch (error: any) {
        if (error.message.includes('bucket was not found')) {
            setStorageError(error.message);
        } else {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon /> AI Image Generator
        </CardTitle>
        <CardDescription>
          Create a new image from a text description using Imagen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Start Generating</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px] flex h-full max-h-[90vh] flex-col">
            <DialogHeader>
              <DialogTitle>AI Image Generator (Text-to-Image)</DialogTitle>
              <DialogDescription>
                Use the template below or write your own detailed prompt to create an image.
              </DialogDescription>
            </DialogHeader>
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto py-4 pr-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="generate-prompt">Your Prompt</Label>
                    <Textarea id="generate-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={12} />
                  </div>
                   <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Image
                  </Button>
                </div>
                <div className="space-y-4">
                    <Label>Generated Image</Label>
                    {storageError && (
                        <Dialog>
                            <Alert variant="destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Firebase Storage Not Enabled</AlertTitle>
                                <AlertDescription>
                                    Before you can upload images, you must enable Firebase Storage.
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto ml-1 font-semibold">View the setup guide.</Button>
                                    </DialogTrigger>
                                </AlertDescription>
                            </Alert>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Enabling Firebase Storage</DialogTitle>
                                    <DialogDescription>
                                        Follow these steps in the Firebase Console to enable file uploads.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-4">
                                    <p>The application uses Firebase Storage to save and manage user-uploaded assets like shop images, product photos, and AI-generated content. For the upload functionality to work, you must first enable the Storage service in your Firebase project.</p>
                                    <p className="font-semibold text-destructive">The error "The specified bucket does not exist" is a strong indicator that this step has not been completed.</p>
                                    <h3 className="font-bold text-lg pt-2">Step 1: Go to the Firebase Console</h3>
                                    <ol className="list-decimal list-inside space-y-1 pl-4">
                                        <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a>.</li>
                                        <li>Select your project: <code className="bg-muted p-1 rounded font-mono text-xs">transconnect-v1-39578841-2a857</code>.</li>
                                    </ol>
                                    <h3 className="font-bold text-lg pt-2">Step 2: Navigate to Storage</h3>
                                    <ol className="list-decimal list-inside space-y-1 pl-4">
                                        <li>In the left-hand navigation menu, under the <strong>Build</strong> section, click on <strong>Storage</strong>.</li>
                                    </ol>
                                    <h3 className="font-bold text-lg pt-2">Step 3: Get Started with Storage</h3>
                                    <ol className="list-decimal list-inside space-y-1 pl-4">
                                        <li>If Storage is not enabled, you will see a "Get started" button. Click it.</li>
                                        <li>A dialog will appear to guide you through setting up security rules. It is recommended to start in <strong>Production mode</strong>. Click <strong>Next</strong>.</li>
                                        <li className="pl-4 text-xs text-muted-foreground"><em>Production mode starts with all reads and writes disallowed, which is a secure default. The application's own security rules will grant the necessary permissions.</em></li>
                                        <li>You will then be asked to choose a location for your Storage bucket. The default location selected for you is usually the best choice. Click <strong>Done</strong>.</li>
                                    </ol>
                                    <p className="pt-4 font-semibold">Once this process is complete, the file upload functionality within your application should work correctly without any further changes.</p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    <div className="relative aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                        {isLoading ? (
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                <p className="mt-2 text-sm text-muted-foreground">Generating...</p>
                            </div>
                        ) : generatedImage ? (
                            <Image src={generatedImage} alt="Generated" fill className="rounded-md object-contain" />
                        ) : (
                            <p className="text-sm text-muted-foreground">Your generated image will appear here.</p>
                        )}
                    </div>
                     {isSaving && (
                        <Progress value={0} className="w-full" />
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
                            <Save className="mr-2 h-4 w-4" /> {savedImageUrl ? 'Saved' : 'Save to Cloud'}
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
  );
}
