import Image from "next/image";
import { divisions } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DivisionsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">The TransConnect Ecosystem</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                Four interconnected divisions working together to power your business.
            </p>
        </div>

        <div className="space-y-16">
            {divisions.map((division, index) => (
                <div key={division.id} id={division.id} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                         {division.image && (
                            <Image
                                src={division.image.imageUrl}
                                alt={division.image.description}
                                fill
                                className="object-cover"
                                data-ai-hint={division.image.imageHint}
                            />
                         )}
                    </div>
                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                        <div className="flex items-center gap-4">
                            {division.icon}
                            <h2 className="text-3xl font-bold font-headline">{division.title}</h2>
                        </div>
                        <p className="mt-4 text-lg text-muted-foreground">
                            {division.longDescription}
                        </p>
                        <Button asChild className="mt-6">
                            <Link href={division.id === 'marketplace' || division.id === 'tech' ? `/${division.id}` : '#!'}>
                                Explore {division.title.split(' ')[1]} <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
