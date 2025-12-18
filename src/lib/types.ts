import type { LucideIcon } from "lucide-react";

export interface Division {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: React.ReactElement<LucideIcon | any>;
  image: {
    id: string;
    description: string;
    imageUrl: string;
    imageHint: string;
  }
}

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: {
    id: string;
    description: string;
    imageUrl: string;
    imageHint: string;
  }
}
