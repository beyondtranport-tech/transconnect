
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
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    if (!generatedVideo || !user || !storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'No video or user/storage not available.' });
        return;
    }

    setIsSaving(true);
    setSavedVideoUrl(null);
    setStorageError(null);

    try {
        const folder = 'videos';
        const fileName = `generated_${Date.now()}.mp4`;
        const filePath = `user-assets/${user.uid}/${folder}/${fileName}`;
        const videoRef = storageRef(storage, filePath);
        
        const base64Data = generatedVideo.split(',')[1];
        await uploadString(videoRef, base64Data, 'base64', { contentType: 'video/mp4' });
        const publicUrl = await getDownloadURL(videoRef);
        
        setSavedVideoUrl(publicUrl);
        toast({ title: 'Video Saved!', description: 'Your video has been saved to your asset gallery.' });
    } catch (error: any) {
        if (error.message.includes('bucket')) {
            setStorageError("Firebase Storage not enabled. Please follow the setup guide.");
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
                              <AlertTitle>Firebase Storage Not Enabled</AlertTitle>
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
    </>
  );
}
