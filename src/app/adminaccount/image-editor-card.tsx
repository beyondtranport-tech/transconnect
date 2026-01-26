
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getClientSideAuthToken } from '@/firebase/errors';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
  const [uploadProgress, setUploadProgress] = useState(0);


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
    setUploadProgress(0);
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
        toast({ variant: 'destructive', title: 'Error', description: 'No image generated, user not found, or storage not available.' });
        return;
    }

    setIsSaving(true);
    setSavedImageUrl(null);
    setStorageError(null);
    setUploadProgress(0);

    try {
        const fileName = `edited_${Date.now()}.png`;
        const imageRef = storageRef(storage, `user-assets/${user.uid}/edited-images/${fileName}`);

        const response = await fetch(editedImage);
        const blob = await response.blob();
        
        const uploadTask = uploadBytesResumable(imageRef, blob);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Save AI image error:", error);
                if (error.code === 'storage/unauthorized') {
                    setStorageError("Permission Denied: You may need to enable Firebase Storage and configure its security rules. Please check the setup guide.");
                } else {
                    toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
                }
                setIsSaving(false);
            },
            async () => {
                const publicUrl = await getDownloadURL(uploadTask.snapshot.ref);
                setSavedImageUrl(publicUrl);
                toast({ title: 'Image Saved!', description: 'Your image is now stored in the asset gallery.' });
                setIsSaving(false);
            }
        );
    } catch (error: any) {
        console.error("Save AI image error:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
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
                        <AlertTitle>Storage Access Error</AlertTitle>
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
                {isSaving && <Progress value={uploadProgress} className="w-full" />}
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

    