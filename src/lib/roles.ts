
import { ShoppingCart, Truck, Handshake, Briefcase, Bot, Users, Code } from "lucide-react";
import * as React from "react";
import data from '@/lib/placeholder-images.json';

const { placeholderImages } = data;

const roleImages = {
    vendor: placeholderImages.find(p => p.id === 'mall-division')!,
    buyer: placeholderImages.find(p => p.id === 'marketplace-division')!,
    partner: placeholderImages.find(p => p.id === 'funding-division')!,
    associate: placeholderImages.find(p => p.id === 'value-integrity')!,
    'isa-agent': placeholderImages.find(p => p.id === 'tech-home')!,
    driver: placeholderImages.find(p => p.id === 'value-community')!,
    developer: placeholderImages.find(p => p.id === 'tech-division')!,
};


export const roles = [
    {
        id: "vendor",
        icon: ShoppingCart,
        title: "Vendors",
        description: "Sell parts, equipment, and services directly to a targeted market of transport professionals.",
        cta: "Become a Vendor",
        longDescription: "As a vendor, you gain direct access to a dedicated marketplace of transport businesses actively seeking parts, equipment, and essential services. Showcase your products, reach qualified buyers, and grow your business by becoming a trusted supplier within the TransConnect ecosystem.",
        image: roleImages.vendor
    },
    {
        id: "buyer",
        icon: Truck,
        title: "Buyers",
        description: "Find vehicles, source parts, and secure transport services from a trusted community network.",
        cta: "Become a Buyer",
        longDescription: "As a buyer, you can efficiently source high-quality vehicles, parts, and services from a network of vetted vendors and fellow transporters. Leverage our marketplace to find competitive pricing and reliable partners, ensuring your fleet stays on the road and operates efficiently.",
        image: roleImages.buyer
    },
    {
        id: "partner",
        icon: Handshake,
        title: "Partners",
        description: "Collaborate with us as a strategic partner to enable growth and provide value-added services.",
        cta: "Become a Partner",
        longDescription: "Strategic partners are the enablers of our ecosystem. Whether you're in finance, insurance, or another value-added service, partnering with TransConnect allows you to offer your solutions to a captive audience of transport professionals, creating synergistic growth opportunities.",
        image: roleImages.partner
    },
    {
        id: "associate",
        icon: Briefcase,
        title: "Associates",
        description: "Join as a professional offering specialized services like accounting, legal, or consulting.",
        cta: "Become an Associate",
        longDescription: "Associates are independent professionals who provide essential services to our members. If you are an accountant, lawyer, consultant, or offer another specialized service for the transport industry, join our network to connect with clients who need your expertise.",
        image: roleImages.associate
    },
    {
        id: "isa-agent",
        icon: Bot,
        title: "ISA Agents (Elite)",
        description: "Top-performing referrers can achieve ISA status, unlocking higher commission tiers and exclusive bonuses.",
        cta: "Become an ISA Agent",
        longDescription: "The Independent Sales Agent (ISA) program is an elite tier for our most active and successful referrers. By consistently bringing new members and facilitating service sales, you can be invited to the ISA program, which grants access to higher commissions, performance bonuses, and a closer working relationship with the TransConnect team. It's the ultimate level for those who want to turn referrals into a significant revenue stream.",
        image: roleImages['isa-agent']
    },
    {
        id: "driver",
        icon: Users,
        title: "Drivers",
        description: "Find job opportunities, access resources, and connect with other professional drivers.",
        cta: "Become a Driver",
        longDescription: "Professional drivers are the backbone of the industry. As a driver member, you can find job opportunities, access training resources, and connect with a community of your peers. Whether you're an owner-operator or looking for your next role, TransConnect is your partner on the road.",
        image: roleImages.driver
    },
    {
        id: "developer",
        icon: Code,
        title: "Developers",
        description: "Integrate with our APIs and build innovative applications on top of the TransConnect platform.",
        cta: "Become a Developer",
        longDescription: "Innovate with us. As a developer, you can access TransConnect's powerful APIs to build new applications and integrations that serve the transport industry. Join our developer community to create the next generation of logistics technology.",
        image: roleImages.developer
    }
]
