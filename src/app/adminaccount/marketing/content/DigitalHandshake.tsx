'use client';

import React, { useMemo } from "react";

export default function DigitalHandshake({ partner, audience }: { partner?: any, audience?: string }) {
    const isValid = (val: any) => !!val && val !== 'N/A' && val !== 'null' && val !== 'None';

    const resolvedName = useMemo(() => {
        if (partner?.marketingManager?.name && isValid(partner.marketingManager.name)) return partner.marketingManager.name;
        if (partner?.ceo?.name && isValid(partner.ceo.name)) return partner.ceo.name;
        return partner?.firstName || partner?.contactPerson || 'Partner';
    }, [partner]);

    const firstName = resolvedName.split(' ')[0];
    const companyName = partner?.companyName || 'your business';
    const aud = (audience || '').toLowerCase();
    
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    const renderBenefits = () => {
        if (aud === 'supplier' || aud === 'vendor') {
            return (
                <ul style={{ paddingLeft: '20pt' }}>
                    <li><strong>Sales Velocity:</strong> Gain direct access to 5,420+ verified transport decision-makers.</li>
                    <li><strong>Simplified RFQs:</strong> Receive high-intent enquiries from members matching your trade.</li>
                    <li><strong>Get Paid Upfront:</strong> We finance your customers so you get settled in full, immediately.</li>
                </ul>
            );
        }
        if (aud === 'transporter' || aud === 'haulier') {
            return (
                <ul style={{ paddingLeft: '20pt' }}>
                    <li><strong>Operational Savings:</strong> Buy tires, spares, and fuel at community-negotiated "Syndicate" discounts.</li>
                    <li><strong>Direct Capital:</strong> Access our in-house finance division for asset growth and working capital.</li>
                    <li><strong>Capacity Matching:</strong> Use AI to find loads and eliminate empty return miles.</li>
                </ul>
            );
        }
        // Default / Partner / ISA
        return (
            <ul style={{ paddingLeft: '20pt' }}>
                <li><strong>Network Monetization:</strong> Turn your existing industry contacts into a recurring revenue engine.</li>
                <li><strong>Absolute Transparency:</strong> Unlimited registry search for 22,000+ verified records.</li>
                <li><strong>ISA Pathway:</strong> Graduate to an elite earning tier with performance bonuses.</li>
            </ul>
        );
    };

    const introText = useMemo(() => {
        if (aud === 'supplier' || aud === 'vendor') {
            return `Logistics Flow is a unified digital ecosystem designed to help suppliers to the transport industry like <strong>${companyName}</strong> sell more products, find more customers, and simplify the sales process.`;
        }
        if (aud === 'transporter' || aud === 'haulier') {
            return `Logistics Flow is a unified digital ecosystem designed to help transporters like <strong>${companyName}</strong> find reliable suppliers, buy at deep discounts, and access the finance needed to scale your fleet.`;
        }
        return `Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs and information fragmentation for companies like <strong>${companyName}</strong>.`;
    }, [aud, companyName]);

    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 'bold', color: '#228B22', fontSize: '16pt', marginBottom: '5pt', textTransform: 'uppercase' }}>
                REGISTRATION IS 100% FREE
            </p>
            <p style={{ color: '#666666', fontSize: '10pt', marginBottom: '15pt' }}>
                INDUSTRIAL CORRESPONDENCE | LOGISTICS FLOW
            </p>
            
            <p>Good day {firstName},</p>
            
            <p>{introText}</p>
            
            <p>We are currently establishing a secure communication bridge between our industrial matching engine and the market leadership. Before we can deliver verified matches, RFQs, or community savings to your dashboard, we require a formal digital handshake.</p>
            
            <p style={{ margin: '20pt 0', padding: '15pt', border: '2px dashed #228B22', borderRadius: '10pt', backgroundColor: '#f9fff9', textAlign: 'center' }}>
                <strong>Establish your FREE standing in the industrial brain here:</strong><br />
                <a href={optInLink} target="_blank" style={{ color: '#228B22', fontWeight: 'bold', fontSize: '14pt', textDecoration: 'underline' }}>{optInLink}</a>
            </p>
            
            <p>By establishing this handshake, you unlock:</p>
            {renderBenefits()}
            
            <p style={{ marginTop: '20pt' }}>We look forward to working with you to optimize the South African logistics landscape.</p>
            
            <p style={{ marginTop: '20pt' }}>Regards,</p>
            <p><strong>The Logistics Flow Team</strong></p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
