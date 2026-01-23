
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
import { Loader2, Sparkles, Video, Download, Save, Copy } from 'lucide-react';
import { generateVideo } from '@/ai/flows/video-generation-flow';
import { Textarea } from '@/components/ui/textarea';
import { useStorage, useUser } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

const defaultPrompt = `Create a short, professional marketing video that showcases how easy it is to create an online shop on the Logistics Flow platform. The video should visually represent these steps: 1. Sign up for a free account. 2. Use the simple Shop Wizard to add your business name, description, and products. 3. Publish your professional-looking online shop to the network. The video should be modern, clean, and use a color palette of green and charcoal.`;

export default function VideoGeneratorCard({ promptTemplate }: { promptTemplate?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const storage = useStorage();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null);

  const handleClear = () => {
    setGeneratedVideo(null);
    setSavedVideoUrl(null);
    setUploadProgress(0);
    setIsSaving(false);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target?.result as string);
      handleClear();
    };
    reader.readAsDataURL(file);
  };


  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt is required',
        description: 'Please describe the video you want to create.',
      });
      return;
    }

    setIsLoading(true);
    handleClear();

    try {
      const result = await generateVideo({ prompt, imageDataUri: sourceImage, durationSeconds: 8 });
      setGeneratedVideo(result.videoDataUri);
      toast({
        title: 'Video Generated!',
        description: 'Your new video is ready to be previewed.',
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
    if (!generatedVideo) return;
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `generated-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Video Downloaded',
      description: 'The video has been saved to your downloads folder.',
    });
  };

  const handleSaveToCloud = async () => {
    if (!generatedVideo || !user || !storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'No video, user, or storage service available.' });
        return;
    }

    setIsSaving(true);
    setUploadProgress(0);

    try {
        const response = await fetch(generatedVideo);
        const blob = await response.blob();
        const fileName = `video-${Date.now()}.mp4`;
        const storageRef = ref(storage, `generated-images/${user.uid}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: 'video/mp4' });

        await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed:", error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        setSavedVideoUrl(downloadURL);
                        toast({ title: 'Video Saved!', description: 'Your video is now stored in the cloud.' });
                        resolve();
                    } catch (getUrlError) {
                        console.error("Failed to get download URL:", getUrlError);
                        reject(getUrlError);
                    }
                }
            );
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };


  const copyUrlToClipboard = () => {
    if (savedVideoUrl) {
        navigator.clipboard.writeText(savedVideoUrl);
        toast({ title: 'URL Copied!', description: 'The permanent video URL is on your clipboard.' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video /> AI Video Generator
        </CardTitle>
        <CardDescription>
          Create short marketing videos from a text prompt and an optional starting image using Veo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Start Generating</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl flex h-full max-h-[90vh] flex-col">
            <DialogHeader>
              <DialogTitle>AI Video Generator (Text/Image-to-Video)</DialogTitle>
              <DialogDescription>
                Provide a prompt and an optional starting image (like a screenshot). Video generation may take a minute or two.
              </DialogDescription>
            </DialogHeader>
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto py-4 pr-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Starting Image (Optional)</Label>
                    <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  {sourceImage && (
                    <div className="relative aspect-video w-full">
                        <Image src={sourceImage} alt="Source" fill className="rounded-md object-contain border" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="generate-prompt">Your Prompt</Label>
                    <Textarea id="generate-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={sourceImage ? 8 : 16} />
                  </div>
                   <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Video
                  </Button>
                </div>
                <div className="space-y-4">
                    <Label>Generated Video</Label>
                    <div className="relative aspect-video w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                        {isLoading ? (
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                <p className="mt-2 text-sm text-muted-foreground">Generating video...</p>
                            </div>
                        ) : generatedVideo ? (
                            <video src={generatedVideo} controls autoPlay className="w-full h-full rounded-md" />
                        ) : (
                            <p className="text-sm text-muted-foreground">Your generated video will appear here.</p>
                        )}
                    </div>
                     {isSaving && (
                        <Progress value={uploadProgress} className="w-full" />
                    )}
                    {savedVideoUrl && (
                        <div className="space-y-2">
                            <Label>Permanent URL</Label>
                            <div className="flex items-center gap-2">
                                <Input value={savedVideoUrl} readOnly />
                                <Button variant="outline" size="icon" onClick={copyUrlToClipboard}>
                                    <Copy className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter className="mt-auto flex-shrink-0 pt-4 sm:justify-between">
              {generatedVideo && (
                <div className="flex w-full items-center justify-between gap-2">
                   <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleDownload} disabled={isSaving}>
                            <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                        <Button variant="outline" onClick={handleSaveToCloud} disabled={isSaving || !!savedVideoUrl}>
                            <Save className="mr-2 h-4 w-4" /> {savedVideoUrl ? 'Saved' : 'Save to Cloud'}
                        </Button>
                   </div>
                   <Button variant="ghost" onClick={handleClear}>Clear Video</Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
