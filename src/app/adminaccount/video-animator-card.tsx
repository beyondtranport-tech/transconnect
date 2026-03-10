
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
import { Loader2, Sparkles, Video, Download, Save, Copy, Film, AlertTriangle } from 'lucide-react';
import { generateVideo } from '../../ai/flows/video-generation-flow';
import { Textarea } from '@/components/ui/textarea';
import { useUser, getClientSideAuthToken } from '@/firebase';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const defaultPrompt = `Animate this image. If it contains a vehicle, make its wheels spin and have it drive down the road. Add some subtle lens flare and a cinematic feel.`;

export default function VideoAnimatorCard({ promptTemplate }: { promptTemplate?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null);

  const handleClear = () => {
    setGeneratedVideo(null);
    setSavedVideoUrl(null);
    setIsSaving(false);
    setUploadProgress(0);
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
    if (!prompt || !sourceImage) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please upload a starting image and provide a prompt.',
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
    if (!generatedVideo || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'No video generated or user not found.' });
        return;
    }

    setIsSaving(true);
    setUploadProgress(10);
    setSavedVideoUrl(null);

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        const folder = `user-assets/${user.uid}/animated-videos`;
        const fileName = `animated_${Date.now()}.mp4`;
        setUploadProgress(30);

        const response = await fetch('/api/uploadImageAsset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileDataUri: generatedVideo, folder, fileName, contentType: 'video/mp4' }),
        });
        
        setUploadProgress(80);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to upload video.');
        }

        setSavedVideoUrl(result.url);
        setUploadProgress(100);
        toast({ title: 'Video Saved!', description: 'Your video has been saved to your asset gallery.' });
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film /> AI Video Animator
          </CardTitle>
          <CardDescription>
            Bring static images and screenshots to life with a text prompt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Start Animating</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl flex h-full max-h-[90vh] flex-col">
              <DialogHeader>
                <DialogTitle>AI Video Animator (Image-to-Video)</DialogTitle>
                <DialogDescription>
                  Upload a starting image and describe how you want to animate it. Video generation may take a minute or two.
                </DialogDescription>
              </DialogHeader>
              <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto py-4 pr-4 md:grid-cols-2">
                <fieldset disabled={true} className="space-y-4">
                  <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Feature Temporarily Disabled</AlertTitle>
                      <AlertDescription>
                          Video generation is currently unavailable due to a necessary package downgrade. This feature will be re-enabled after a future platform upgrade.
                      </AlertDescription>
                  </Alert>
                    <div className="space-y-2">
                      <Label htmlFor="image-upload-animator">1. Upload Starting Image</Label>
                      <Input id="image-upload-animator" type="file" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    {sourceImage && (
                      <div className="relative aspect-video w-full">
                          <Image src={sourceImage} alt="Source" fill className="rounded-md object-contain border" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="animate-prompt">2. Describe Your Animation</Label>
                      <Textarea id="animate-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={sourceImage ? 8 : 16} />
                    </div>
                </fieldset>
                  <div className="space-y-4">
                      <Label>3. Generated Video</Label>
                      <div className="relative aspect-video w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                          {isLoading ? (
                              <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                  <p className="mt-2 text-sm text-muted-foreground">Generating video...</p>
                              </div>
                          ) : generatedVideo ? (
                              <video src={generatedVideo} controls autoPlay className="w-full h-full rounded-md" />
                          ) : (
                              <p className="text-sm text-muted-foreground">Your animated video will appear here.</p>
                          )}
                      </div>
                  </div>
              </div>
              <DialogFooter className="mt-auto flex-shrink-0 pt-4 sm:justify-between">
                <div className="flex w-full items-center justify-between gap-2">
                   <Button onClick={handleGenerate} disabled={true}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generate Video
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
}
