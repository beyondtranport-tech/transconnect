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
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { imageEditFlow } from '@/ai/flows/image-edit-flow';
import { Textarea } from '@/components/ui/textarea';

const defaultEditPrompt = `Place the truck on a winding mountain pass at sunset.

Examples of other good prompts:
- Change the color of the truck to a metallic blue.
- Add a logo for 'TransConnect' on the side of the trailer.
- Make the background a busy city street at night.`;

export default function ImageEditorCard({ promptTemplate }: { promptTemplate?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || defaultEditPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setEditedImage(null); // Clear previous edit
    };
    reader.readAsDataURL(file);
  };
  
  const clearOriginalImage = () => {
    setOriginalImage(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  const handleEdit = async () => {
    if (!originalImage || !prompt) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please upload an image and provide an edit prompt.',
      });
      return;
    }

    setIsLoading(true);
    setEditedImage(null);

    try {
      const result = await imageEditFlow({
        photoDataUri: originalImage,
        prompt: prompt,
      });

      setEditedImage(result.enhancedImageDataUri);
      toast({
        title: 'Image Edited!',
        description: 'Your enhanced image is ready.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Editing Failed',
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
          <Wand2 /> AI Image Editor
        </CardTitle>
        <CardDescription>
          Edit an existing image with a text prompt using Gemini (Nano Banana).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Start Editing</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[725px] flex h-full max-h-[90vh] flex-col">
            <DialogHeader>
              <DialogTitle>AI Image Editor (Image-to-Image)</DialogTitle>
              <DialogDescription>
                Upload an image and describe the changes you want to make.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-upload">1. Upload Original Image</Label>
                  <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
                </div>
                {originalImage && (
                    <div className="relative aspect-square w-full">
                        <Image src={originalImage} alt="Original" fill className="rounded-md object-contain" />
                        <Button variant="destructive" size="sm" onClick={clearOriginalImage} className="absolute top-2 right-2">Change</Button>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="prompt">2. Describe Your Edit</Label>
                    <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., place this truck in a forest" rows={7} />
                 </div>
              </div>
              <div className="space-y-4">
                <Label>3. Edited Image</Label>
                <div className="relative aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                    {isLoading ? (
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="mt-2 text-sm text-muted-foreground">Editing...</p>
                        </div>
                    ) : editedImage ? (
                         <Image src={editedImage} alt="Edited" fill className="rounded-md object-contain" />
                    ) : (
                        <p className="text-sm text-muted-foreground">Your result will appear here.</p>
                    )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-auto flex-shrink-0 pt-4">
              <Button onClick={handleEdit} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
