'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Award, Bot, Briefcase, Code, Handshake, Search, ShieldCheck, ShoppingCart, Sparkles, Truck, UserPlus, Users, Video, Wand2, Warehouse } from 'lucide-react';

const rewardActions = [
    { category: 'Vendors', icon: ShoppingCart, actions: [
        { id: 'shopCreationPoints', name: 'Shop Creation' },
        { id: 'productAddPoints', name: 'Product Add' },
        { id: 'supplierContributionPoints', name: 'Supplier Contribution' },
        { id: 'debtorContributionPoints', name: 'Debtor Contribution' },
    ]},
    { category: 'Transporters (Buyers)', icon: Truck, actions: [
        { id: 'truckContributionPoints', name: 'Truck Contribution' },
        { id: 'trailerContributionPoints', name: 'Trailer Contribution' },
    ]},
    { category: 'Partners & Referrals', icon: Handshake, actions: [
        { id: 'partnerReferralPoints', name: 'Member Referral' },
        { id: 'isaSaleCommissionPoints', name: 'ISA Sale' },
    ]},
    { category: 'Associates', icon: Briefcase, actions: [
        { id: 'associateServiceListingPoints', name: 'Service Listing' },
    ]},
    { category: 'Drivers', icon: Users, actions: [
        { id: 'driverSafetyRecordPoints', name: 'Safety Record Submission' },
    ]},
    { category: 'Developers', icon: Code, actions: [
        { id: 'developerApiIntegrationPoints', name: 'API Integration' },
    ]},
    { category: 'General & AI Actions', icon: Sparkles, actions: [
        { id: 'userSignupPoints', name: 'User Sign-up' },
        { id: 'seoBoosterPoints', name: 'AI SEO Booster Use' },
        { id: 'aiImageGeneratorPoints', name: 'AI Image Generation' },
        { id: 'imageEnhancerPoints', name: 'AI Image Enhancement' },
        { id: 'aiVideoGeneratorPoints', name: 'AI Video Generation' },
    ]},
];

export default function RewardStatus() {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Award className="h-6 w-6" />Reward Status Framework</CardTitle>
        <CardDescription>
          This dashboard outlines the structure for tracking member rewards. It shows each action, the points required per tier to unlock benefits from that action, the member's actual earned points, and the resulting financial savings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Action</TableHead>
                <TableHead className="text-center">Target (Bronze)</TableHead>
                <TableHead className="text-center">Target (Silver)</TableHead>
                <TableHead className="text-center">Target (Gold)</TableHead>
                <TableHead className="text-center">Actual Points</TableHead>
                <TableHead className="text-right">Result (Savings)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewardActions.map(section => (
                <React.Fragment key={section.category}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={6}>
                      <h3 className="font-semibold text-primary flex items-center gap-2">
                        <section.icon className="h-5 w-5" />
                        {section.category}
                      </h3>
                    </TableCell>
                  </TableRow>
                  {section.actions.map(action => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium pl-8">{action.name}</TableCell>
                      <TableCell><Input type="number" defaultValue="0" className="text-center" /></TableCell>
                      <TableCell><Input type="number" defaultValue="100" className="text-center" /></TableCell>
                      <TableCell><Input type="number" defaultValue="500" className="text-center" /></TableCell>
                      <TableCell><Input type="number" placeholder="-" className="text-center" disabled /></TableCell>
                      <TableCell className="text-right"><Input type="text" placeholder="R 0.00" className="text-right font-mono" disabled /></TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
