'use client';

import { useState, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  prompt: z.string().min(1, 'A prompt is required.'),
  image: z.any().refine(file => file instanceof File, 'An image file is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ImageEditor() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!originalImage) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload an image to edit.' });
        return;
    }
    
    setIsLoading(true);
    setGeneratedImage(null);

    try {
        const response = await fetch('/api/editImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                photoDataUri: originalImage,
                prompt: values.prompt,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate image.');
        }

        const result = await response.json();
        setGeneratedImage(result.enhancedImageDataUri);
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

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">1. Upload Original Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Choose Image
                          </Button>
                         {originalImage && (
                            <div className="mt-4 relative aspect-square w-full rounded-md border overflow-hidden">
                                <Image src={originalImage} alt="Original image preview" fill className="object-contain" />
                            </div>
                         )}
                    </CardContent>
                </Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <Card>
                             <CardHeader>
                                 <CardTitle className="text-base">2. Describe Your Edit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="prompt"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                        <Input placeholder="e.g., place this on a white background" {...field} />
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
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">3. Generated Image</CardTitle>
                </CardHeader>
                 <CardContent>
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
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
                         <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Your new image will appear here.</p>
                        </div>
                    )}
                 </CardContent>
            </Card>
        </div>
  );
}
