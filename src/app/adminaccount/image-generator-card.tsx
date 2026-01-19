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
import { useStorage, useUser } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

const defaultPrompt = `A cinematic, professional photograph of a futuristic, gleaming white and green Scania truck driving on a high-tech highway at dusk. The road is illuminated with glowing data lines, and the sky has a vibrant sunset. The image should look modern, professional, and convey a sense of speed and efficiency.`;

export default function ImageGeneratorCard({ promptTemplate }: { promptTemplate?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const storage = useStorage();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);

  const handleClear = () => {
    setGeneratedImage(null);
    setSavedImageUrl(null);
    setUploadProgress(0);
    setIsSaving(false);
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
    if (!generatedImage || !user || !storage) {
      toast({ variant: 'destructive', title: 'Error', description: 'No image, user, or storage service available.' });
      return;
    }

    setIsSaving(true);
    setUploadProgress(0);

    try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        
        const fileName = `generated-image-${Date.now()}.png`;
        const storageRef = ref(storage, `generated-images/${user.uid}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload Error:", error);
                toast({ variant: 'destructive', title: 'Save to Cloud Failed', description: error.message });
                setIsSaving(false);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setSavedImageUrl(downloadURL);
                    toast({ title: 'Image Saved!', description: 'Your image is now stored in the cloud.' });
                } catch (error: any) {
                    toast({ variant: 'destructive', title: 'Save Failed', description: `Could not get download URL: ${error.message}` });
                } finally {
                    setIsSaving(false);
                }
            }
        );
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
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
                        <Progress value={uploadProgress} className="w-full" />
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
