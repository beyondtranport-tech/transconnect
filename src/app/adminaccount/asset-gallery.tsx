
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStorage, useUser } from '@/firebase';
import { ref, listAll, getDownloadURL, getMetadata, type StorageReference } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Image as ImageIcon, Video } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface ImageAsset {
    url: string;
    name: string;
    contentType: string;
}

export default function AssetGallery() {
    const { user } = useUser();
    const storage = useStorage();
    const { toast } = useToast();
    const [assets, setAssets] = useState<ImageAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAssets = useCallback(async () => {
        if (!storage || !user) return;
        setIsLoading(true);

        try {
            const userFolderRef = ref(storage, `generated-images/${user.uid}`);
            const res = await listAll(userFolderRef);
            
            const urls = await Promise.all(
                res.items.map(async (itemRef: StorageReference) => {
                    const url = await getDownloadURL(itemRef);
                    const metadata = await getMetadata(itemRef);
                    return { url, name: itemRef.name, contentType: metadata.contentType || 'application/octet-stream' };
                })
            );
            
            urls.sort((a, b) => b.name.localeCompare(a.name));
            setAssets(urls);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error loading assets',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [storage, user, toast]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const copyUrlToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({ title: 'URL Copied!' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Asset Gallery</CardTitle>
                <CardDescription>A gallery of all images and videos you have generated and saved to the cloud.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : assets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {assets.map((asset) => (
                            <Card key={asset.url} className="overflow-hidden">
                                <div className="relative aspect-square bg-muted">
                                    {asset.contentType.startsWith('image/') ? (
                                        <Image src={asset.url} alt={asset.name} fill className="object-cover" />
                                    ) : asset.contentType.startsWith('video/') ? (
                                        <video src={asset.url} controls className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                           <ImageIcon className="h-12 w-12" />
                                        </div>
                                    )}
                                </div>
                                <CardFooter className="p-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => copyUrlToClipboard(asset.url)}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy URL
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">No Saved Assets</h3>
                        <p className="mt-2 text-muted-foreground">Generated images that you "Save to Cloud" will appear here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
