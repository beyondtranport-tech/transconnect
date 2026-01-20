
import type { Division, MarketplaceItem } from '@/lib/types';
import data from '@/lib/placeholder-images.json';

const { placeholderImages } = data;

const fundingImage = placeholderImages.find(p => p.id === 'funding-division')!;
const mallImage = placeholderImages.find(p => p.id === 'mall-division')!;
const marketplaceImage = placeholderImages.find(p => p.id === 'marketplace-division')!;
const techImage = placeholderImages.find(p => p.id === 'tech-division')!;

export const divisions: Division[] = [
  {
    id: 'funding',
    title: 'Funding',
    icon: 'DollarSign',
    description: "Breaking the constraints of traditional lending. We restore the flow of capital to your business by connecting you with funders who understand the transport industry.",
    longDescription: 'We have dared to challenge the status quo. We are able to fund where banks are not able to',
    image: fundingImage,
  },
  {
    id: 'mall',
    title: 'Mall',
    icon: 'ShoppingBasket',
    description: "Breaking the constraints of high operating costs. We create a flow of savings by leveraging our community's collective buying power for better deals on parts, services, and assets.",
    longDescription: "Join each of our malls are set up to break specific business constraints that you have.",
    image: mallImage,
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: 'Store',
    description: "Breaking the constraints of a limited network. We create a flow of new opportunities by enabling you to buy from, sell to, and collaborate with trusted partners.",
    longDescription: 'Access unique products from our partner partners and earn by sharing discounts from them.',
    image: marketplaceImage,
  },
  {
    id: 'tech',
    title: 'Tech',
    icon: 'Cpu',
    description: "Breaking the constraints of inefficiency. We restore the flow of information and opportunity with AI-powered tools that reduce empty miles and optimize your operations.",
    longDescription: 'Gain a competitive edge with Logistics Flow Tech. Our suite of digital tools is designed to optimize your operations. Key features include our AI-powered freight matching service to eliminate deadhead miles, route optimization software to save on fuel, and a digital document vault for compliance management. We handle the tech, so you can focus on the road.',
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
