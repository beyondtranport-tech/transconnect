import type { Division, MarketplaceItem } from '@/lib/types';
import { DollarSign, ShoppingBasket, Store, Cpu } from 'lucide-react';
import { placeholderImages } from '@/lib/placeholder-images.json';

const fundingImage = placeholderImages.find(p => p.id === 'funding-division')!;
const mallImage = placeholderImages.find(p => p.id === 'mall-division')!;
const marketplaceImage = placeholderImages.find(p => p.id === 'marketplace-division')!;
const techImage = placeholderImages.find(p => p.id === 'tech-division')!;

export const divisions: Division[] = [
  {
    id: 'funding',
    title: 'TransConnect Funding',
    icon: <DollarSign className="h-10 w-10 text-primary" />,
    description: 'Fueling your growth with flexible financial solutions.',
    longDescription: 'In a capital-intensive industry, access to funding is crucial. TransConnect Funding provides members with a range of financial products, from equipment financing and invoice factoring to business loans and lines of credit. We partner with financial institutions that understand the transport sector, ensuring you get competitive rates and terms that work for your cash flow.',
    image: fundingImage,
  },
  {
    id: 'mall',
    title: 'TransConnect Mall',
    icon: <ShoppingBasket className="h-10 w-10 text-primary" />,
    description: 'Your one-stop shop for parts, gear, and essentials.',
    longDescription: 'Keep your fleet running with our member-exclusive mall. We\'ve negotiated bulk discounts with top-tier suppliers for everything from tires and engine oil to logbooks and safety gear. Enjoy streamlined purchasing, fast shipping, and a loyalty program that gives back on every dollar spent. It\'s the convenience you need with savings you can count on.',
    image: mallImage,
  },
  {
    id: 'marketplace',
    title: 'TransConnect Marketplace',
    icon: <Store className="h-10 w-10 text-primary" />,
    description: 'The trusted community to buy, sell, and trade.',
    longDescription: 'The TransConnect Marketplace is a secure and transparent platform for members to buy and sell vehicles, trailers, and heavy equipment. With verified member profiles and integrated escrow services, you can transact with confidence. Whether you\'re upgrading your rig or selling surplus assets, our marketplace connects you with a network of serious buyers and sellers.',
    image: marketplaceImage,
  },
  {
    id: 'tech',
    title: 'TransConnect Tech',
    icon: <Cpu className="h-10 w-10 text-primary" />,
    description: 'Smart tools for a more efficient business.',
    longDescription: 'Gain a competitive edge with TransConnect Tech. Our suite of digital tools is designed to optimize your operations. Key features include our AI-powered freight matching service to eliminate deadhead miles, route optimization software to save on fuel, and a digital document vault for compliance management. We handle the tech, so you can focus on the road.',
    image: techImage,
  },
];

const tiresImage = placeholderImages.find(p => p.id === 'product-tires')!;
const oilImage = placeholderImages.find(p => p.id === 'product-engine-oil')!;
const gpsImage = placeholderImages.find(p => p.id === 'product-gps')!;
const seatImage = placeholderImages.find(p => p.id === 'product-truck-seat')!;

export const marketplaceItems: MarketplaceItem[] = [
    {
        id: '1',
        name: 'All-Weather Commercial Tires',
        description: 'Set of 4 durable tires designed for long-haul performance and all-weather conditions.',
        price: 28000,
        category: 'Parts',
        image: tiresImage,
    },
    {
        id: '2',
        name: 'Heavy-Duty Synthetic Engine Oil (20L)',
        description: 'Premium synthetic blend for superior engine protection and extended drain intervals.',
        price: 2500,
        category: 'Consumables',
        image: oilImage,
    },
    {
        id: '3',
        name: 'Pro-Nav Fleet GPS System',
        description: 'Advanced GPS with real-time traffic, route optimization, and compliance logging.',
        price: 8500,
        category: 'Electronics',
        image: gpsImage,
    },
    {
        id: '4',
        name: 'Ergo-Comfort Air-Ride Seat',
        description: 'Ergonomic captain\'s chair with air suspension to reduce driver fatigue.',
        price: 12500,
        category: 'Accessories',
        image: seatImage,
    },
    {
        id: '5',
        name: '2018 Freightliner Cascadia',
        description: 'Well-maintained sleeper cab with 450,000 miles. Full service records available.',
        price: 950000,
        category: 'Vehicles',
        image: placeholderImages.find(p => p.id === 'marketplace-division')!,
    },
    {
        id: '6',
        name: 'LED Headlight Conversion Kit',
        description: 'Upgrade your visibility with this high-intensity, low-consumption LED light kit.',
        price: 3500,
        category: 'Parts',
        image: placeholderImages.find(p => p.id === 'mall-division')!,
    },
];
