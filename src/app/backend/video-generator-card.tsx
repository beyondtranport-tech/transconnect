
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
import { Loader2, Sparkles, Video, Download, PlayCircle, Zap } from 'lucide-react';
import { generateVideo } from '@/ai/flows/video-generation-flow';
import type { VideoGenerateInput } from '@/ai/schemas';
import Link from 'next/link';
import React from 'react';

const PRESETS = [
    { 
        id: 'overview', 
        label: '60s Ecosystem Overview', 
        prompt: 'A cinematic high-tech map of South Africa with glowing trade routes connecting major hubs like JHB, CPT, and Durban. Camera zooms into a modern logistics control center.' 
    },
    { 
        id: 'intelligence', 
        label: 'Intelligence Briefing', 
        prompt: 'Macro shot of a high-speed digital registry being scanned. Thousands of verified company names and direct contact details scroll past at high velocity.' 
    },
];

export default function VideoGeneratorCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt) {
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
      const result = await generateVideo({ prompt: finalPrompt });
      setGeneratedVideo(result.videoDataUri);
      toast({
        title: 'Video Generated!',
        description: 'Your new asset is ready for your pitch sequences.',
      });
    } catch (e: any) {
      let description: React.ReactNode = e.message;
      if (e.message?.includes('403 Forbidden') || e.message?.includes('API is not enabled')) {
          description = (
              <>
                  The AI API is not enabled for your project.
                  <Button asChild variant="link" className="p-0 h-auto ml-1 text-xs">
                      <Link href="/docs/enable-gemini-api.md" target="_blank">View Guide</Link>
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
    if (!generatedVideo) return;
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = `lf-showcase-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video /> AI Video Studio
        </CardTitle>
        <CardDescription>
          Create high-impact industrial overviews using Gemini Veo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Open Video Studio</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px] flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>AI Video Studio (Text-to-Video)</DialogTitle>
              <DialogDescription>
                Use presets for your pitch library or write a custom prompt.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Forensic Presets</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PRESETS.map(preset => (
                            <Button 
                                key={preset.id} 
                                variant="outline" 
                                className="justify-start gap-2 h-auto py-3 px-4 border-dashed"
                                onClick={() => { setPrompt(preset.prompt); handleGenerate(preset.prompt); }}
                                disabled={isLoading}
                            >
                                <Zap className="h-4 w-4 text-amber-500" />
                                <div className="text-left">
                                    <p className="text-xs font-bold">{preset.label}</p>
                                    <p className="text-[10px] text-muted-foreground">Pre-tuned prompt</p>
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generate-prompt" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Industrial Command</Label>
                  <Input 
                    id="generate-prompt" 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="e.g. Cinematic overhead shot of a truck fleet on the N3 highway..." 
                    className="h-10 bg-slate-50"
                  />
                </div>
                
                <div className="relative aspect-video w-full rounded-xl border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden shadow-inner">
                     {isLoading ? (
                        <div className="text-center space-y-2">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rendering Video...</p>
                        </div>
                    ) : generatedVideo ? (
                        <video src={generatedVideo} controls autoPlay className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center opacity-20">
                            <PlayCircle className="h-16 w-16 mx-auto mb-2" />
                            <p className="text-sm font-bold uppercase tracking-widest">Asset Preview</p>
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter className="mt-auto pt-4 border-t justify-between">
              {generatedVideo && (
                <Button variant="secondary" onClick={handleDownload} disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" /> Download Asset
                </Button>
              )}
              <Button onClick={() => handleGenerate()} disabled={isLoading} className={!generatedVideo ? 'w-full' : 'ml-auto'}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {generatedVideo ? 'Generate Different Angle' : 'Generate Custom Video'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
