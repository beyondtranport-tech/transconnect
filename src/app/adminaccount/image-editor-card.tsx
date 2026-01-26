
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
import { Loader2, Sparkles, Wand2, Download, Save, Copy, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { imageEdit } from '@/ai/flows/image-edit-flow';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useStorage } from '@/firebase';
import { Progress } from '@/components/ui/progress';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const { user } = useUser();
  const storage = useStorage();

  const [isSaving, setIsSaving] = useState(false);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setEditedImage(null); // Clear previous edit
      setSavedImageUrl(null); // Clear saved URL
    };
    reader.readAsDataURL(file);
  };
  
  const handleClear = () => {
    setEditedImage(null);
    setSavedImageUrl(null);
    setIsSaving(false);
    setStorageError(null);
  }

  const clearOriginalImage = () => {
    setOriginalImage(null);
    handleClear();
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
    handleClear();

    try {
      const result = await imageEdit({
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

  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `edited-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Image Downloaded',
      description: 'The image has been saved to your downloads folder.',
    });
  };

  const handleSaveToCloud = async () => {
    if (!editedImage || !user || !storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'No image or user/storage service available.' });
        return;
    }

    setIsSaving(true);
    setStorageError(null);

    try {
        const folder = 'edited-images';
        const fileName = `edited_${Date.now()}.png`;
        const filePath = `user-assets/${user.uid}/${folder}/${fileName}`;
        const imageRef = storageRef(storage, filePath);
        
        const base64Data = editedImage.split(',')[1];
        await uploadString(imageRef, base64Data, 'base64', { contentType: 'image/png' });
        const publicUrl = await getDownloadURL(imageRef);

        setSavedImageUrl(publicUrl);
        toast({ title: 'Image Saved!', description: 'Your image is now stored in the asset gallery.' });
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
    if (savedImageUrl) {
        navigator.clipboard.writeText(savedImageUrl);
        toast({ title: 'URL Copied!', description: 'The permanent image URL is on your clipboard.' });
    }
  }


  return (
    <>
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
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto py-4 pr-4 md:grid-cols-2">
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
                {isSaving && (
                    <Progress value={0} className="w-full" /> // Progress bar is not implemented for this simpler uploader
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
              <div>
                {editedImage && (
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleDownload} disabled={isSaving}>
                        <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                     <Button variant="outline" onClick={handleSaveToCloud} disabled={isSaving || !!savedImageUrl}>
                        <Save className="mr-2 h-4 w-4" /> {savedImageUrl ? 'Saved' : 'Save to Cloud'}
                    </Button>
                  </div>
                )}
              </div>
              <Button onClick={handleEdit} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Edit
              </Button>
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
