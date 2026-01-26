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
import { Loader2, Sparkles, Video, Download, Save, Copy, ShieldAlert } from 'lucide-react';
import { generateVideo } from '@/ai/flows/video-generation-flow';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useStorage } from '@/firebase';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getClientSideAuthToken } from '@/firebase/errors';

const defaultPrompt = `Create a short, professional marketing video that showcases how easy it is to create an online shop on the Logistics Flow platform. The video should visually represent these steps: 1. Sign up for a free account. 2. Use the simple Shop Wizard to add your business name, description, and products. 3. Publish your professional-looking online shop to the network. The video should be modern, clean, and use a color palette of green and charcoal.`;

export default function VideoGeneratorCard({ promptTemplate }: { promptTemplate?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || defaultPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const storage = useStorage();

  const [isSaving, setIsSaving] = useState(false);
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  const handleClear = () => {
    setGeneratedVideo(null);
    setSavedVideoUrl(null);
    setIsSaving(false);
    setStorageError(null);
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
      const result = await generateVideo({ prompt, durationSeconds: 8 });
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
        toast({ variant: 'destructive', title: 'Error', description: 'No video generated to save or user not found.' });
        return;
    }

    setIsSaving(true);
    setSavedVideoUrl(null);
    setStorageError(null);

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        const fileName = `generated_${Date.now()}.mp4`;

        const response = await fetch('/api/uploadImageAsset', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file: generatedVideo,
                folder: 'videos',
                fileName: fileName,
            }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to save video.');
        }

        const publicUrl = result.url;
        setSavedVideoUrl(publicUrl);
        toast({ title: 'Video Saved!', description: 'Your video has been saved to your asset gallery.' });
    } catch (error: any) {
        console.error("Save AI video error:", error);
        if (error.message.includes('permission') || error.message.includes('bucket')) {
            setStorageError(error.message);
        } else {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
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
            <Video /> AI Video Generator
          </CardTitle>
          <CardDescription>
            Create short marketing videos from a text prompt using Veo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Start Generating</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl flex h-full max-h-[90vh] flex-col">
              <DialogHeader>
                <DialogTitle>AI Video Generator (Text-to-Video)</DialogTitle>
                <DialogDescription>
                  Provide a detailed prompt to create your video. Generation may take a minute or two.
                </DialogDescription>
              </DialogHeader>
              <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto py-4 pr-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="generate-prompt-video">Your Prompt</Label>
                      <Textarea id="generate-prompt-video" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={16} />
                    </div>
                     <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generate Video
                    </Button>
                  </div>
                  <div className="space-y-4">
                      <Label>Generated Video</Label>
                      {storageError && (
                          <Alert variant="destructive">
                              <ShieldAlert className="h-4 w-4" />
                              <AlertTitle>Storage Access Error</AlertTitle>
                              <AlertDescription>
                                  {storageError}
                                  <Button variant="link" className="p-0 h-auto ml-1 font-semibold" onClick={() => setIsSetupGuideOpen(true)}>View the setup guide.</Button>
                              </AlertDescription>
                          </Alert>
                      )}
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
                          <Progress value={0} className="w-full" />
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
              <DialogFooter className="mt-auto flex-shrink-0 pt-4">
                <div className="flex w-full items-center justify-between gap-2">
                  {generatedVideo ? (
                      <div className="flex items-center gap-2">
                          <Button variant="secondary" onClick={handleDownload} disabled={isSaving}>
                              <Download className="mr-2 h-4 w-4" /> Download
                          </Button>
                          <Button variant="outline" onClick={handleSaveToCloud} disabled={isSaving || !!savedVideoUrl}>
                              <Save className="mr-2 h-4 w-4" /> {savedVideoUrl ? 'Saved' : 'Save to Cloud'}
                          </Button>
                      </div>
                  ) : <div />}
                   <Button variant="ghost" onClick={handleClear} disabled={!generatedVideo}>Clear Video</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      <Dialog open={isSetupGuideOpen} onOpenChange={setIsSetupGuideOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Enabling Firebase Storage</DialogTitle>
                <DialogDescription>
                    Follow these steps in the Firebase Console to enable file uploads.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-4" dangerouslySetInnerHTML={{ __html: `
                <p>The application uses Firebase Storage to save and manage user-uploaded assets. For this to work, you must first enable the Storage service in your Firebase project and ensure the backend service account has the necessary permissions.</p>
                
                <h3 class="font-bold text-lg pt-2">Step 1: Enable Firebase Storage</h3>
                <ol class="list-decimal list-inside space-y-1 pl-4">
                    <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" class="text-primary underline">Firebase Console</a> and select your project.</li>
                    <li>In the left-hand navigation, under **Build**, click on **Storage**.</li>
                    <li>If it's not enabled, click **"Get started"**.</li>
                    <li>Choose **Production mode** for security rules and click **Next**.</li>
                    <li>Choose your bucket location (the default is usually fine) and click **Done**.</li>
                </ol>

                <h3 class="font-bold text-lg pt-4">Step 2: Grant Backend Permissions (Troubleshooting)</h3>
                <p>If you still see errors after Step 1, you must grant permissions to the backend service account.</p>
                <ol class="list-decimal list-inside space-y-1 pl-4">
                    <li>Go to the <a href="https://console.cloud.google.com/iam-admin/iam" target="_blank" rel="noopener noreferrer" class="text-primary underline">Google Cloud IAM page</a> for your project.</li>
                    <li>Find the principal with the name **"Firebase Admin SDK Administrator Service Agent"**.</li>
                    <li>Copy its email address (it will end in <code class="bg-muted p-1 rounded font-mono text-xs">.iam.gserviceaccount.com</code>).</li>
                    <li>Click the **+ GRANT ACCESS** button at the top of the page.</li>
                    <li>In the **"New principals"** field, paste the service account email.</li>
                    <li>In the **"Select a role"** dropdown, search for and select **"Storage Object Admin"**.</li>
                    <li>Click **Save**.</li>
                </ol>
            `}} />
        </DialogContent>
      </Dialog>
    </>
  );
}

    