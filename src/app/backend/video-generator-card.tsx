
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Video } from 'lucide-react';
import { generateVideo } from '@/ai/flows/video-generation-flow';
import type { VideoGenerateInput } from '@/ai/schemas';

export default function VideoGeneratorCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const { toast } = useToast();

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
    setGeneratedVideo(null);

    try {
      const result = await generateVideo({ prompt });
      setGeneratedVideo(result.videoDataUri);
      toast({
        title: 'Video Generated!',
        description: 'Your new video is ready.',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video /> AI Video Generator
        </CardTitle>
        <CardDescription>
          Create a short video from a text description using Veo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Start Generating</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px]">
            <DialogHeader>
              <DialogTitle>AI Video Generator (Text-to-Video)</DialogTitle>
              <DialogDescription>
                Describe the video you want to create in detail. Note: Video generation can take a minute or more.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="generate-prompt">Your Prompt</Label>
                  <Input id="generate-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A cinematic shot of a truck on a highway at sunrise" />
                </div>
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
            </div>
            <DialogFooter>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
