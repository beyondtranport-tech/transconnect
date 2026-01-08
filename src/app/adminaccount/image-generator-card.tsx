
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Image as ImageIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const formSchema = z.object({
  prompt: z.string().min(1, 'A prompt is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function AIImageGeneratorCard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setGeneratedImage(null);

    try {
        const response = await fetch('/api/generateImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: values.prompt,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate image.');
        }

        const result = await response.json();
        setGeneratedImage(result.imageDataUri);
        toast({ title: 'Image Generated!', description: 'Your new image is ready.' });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'An unexpected error occurred',
            description: error.message || 'Please try again later.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
        form.reset();
        setGeneratedImage(null);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="h-6 w-6 text-primary"/>
            </div>
            <CardTitle>AI Image Generator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>
            Create entirely new images from a text description using Google's Imagen model. Perfect for marketing banners, product mockups, and more.
          </CardDescription>
        </CardContent>
        <CardFooter>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Launch Generator
                </Button>
            </DialogTrigger>
        </CardFooter>
      </Card>

      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>AI Image Generator (Text-to-Image)</DialogTitle>
          <DialogDescription>
            Describe the image you want to create and let AI bring it to life.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">1. Describe Your Image</CardTitle></CardHeader>
                        <CardContent>
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Input placeholder="e.g., A red Scania truck on a mountain pass at sunset" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </CardContent>
                    </Card>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Generate Image
                    </Button>
                    </form>
                </Form>
            </div>
            <div className="space-y-4">
                <Card className="h-full">
                    <CardHeader><CardTitle className="text-base">2. Generated Image</CardTitle></CardHeader>
                    <CardContent>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full aspect-square border-2 border-dashed rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">AI is creating your image...</p>
                        </div>
                    )}
                    {!isLoading && generatedImage && (
                        <div className="relative aspect-square w-full rounded-md border overflow-hidden">
                        <Image src={generatedImage} alt="Generated image" fill className="object-contain" />
                        </div>
                    )}
                    {!isLoading && !generatedImage && (
                        <div className="flex flex-col items-center justify-center h-full aspect-square border-2 border-dashed rounded-lg">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Your new image will appear here.</p>
                        </div>
                    )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
