'use client';

import React, { useMemo } from "react";

export default function CompanyProfile({ audience, partner }: { audience: string; partner?: any }) {
    const isValid = (val: any) => !!val && val !== 'N/A' && val !== 'null' && val !== 'None';

    const resolvedName = useMemo(() => {
        if (partner?.marketingManager?.name && isValid(partner.marketingManager.name)) return partner.marketingManager.name;
        if (partner?.ceo?.name && isValid(partner.ceo.name)) return partner.ceo.name;
        return partner?.firstName || partner?.contactPerson || 'Member';
    }, [partner]);

    const firstName = resolvedName.split(' ')[0];
    const email = partner?.email || '';
    const companyName = partner?.companyName || 'your business';
    const aud = (audience || '').toLowerCase();

    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const signupLink = `${baseUrl}/join?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&ref=${partner?.id || 'SYSTEM'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    const introText = useMemo(() => {
        if (aud === 'supplier' || aud === 'vendor') {
            return (
                <>
                    As a supplier to the South African transport industry, the primary benefit of Logistics Flow for <strong>{companyName}</strong> is our ability to connect your business with high-intent buyers, automate your sales outreach, and ensure you get paid on time.
                </>
            );
        }
        if (aud === 'transporter' || aud === 'haulier') {
            return (
                <>
                    As a transporter, the primary benefits of <strong>{companyName}</strong> joining Logistics Flow will be your immediate access to community-negotiated spare parts discounts, verified haulier deal-flow, and specialized asset finance.
                </>
            );
        }
        return (
            <>
                Logistics Flow is a Data-as-a-Service (DaaS) ecosystem designed to optimize the South African transport industry for companies like <strong>{companyName}</strong>. We provide the map and the tools to break the information constraints that prevent industrial growth.
            </>
        );
    }, [aud, companyName]);

    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 'bold', color: '#228B22', fontSize: '14pt', marginBottom: '5pt' }}>
                REGISTRATION IS 100% FREE
            </p>
            <p style={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000000', paddingBottom: '4pt', marginBottom: '15pt' }}>
                INDUSTRIAL MEMO: THE DIGITALIZATION OF LOGISTICS FLOW
            </p>
            
            <p>Good day {firstName}, we write to formally introduce the Logistics Flow ecosystem to your business.</p>
            
            <p>{introText}</p>
            
            <p style={{ margin: '15pt 0', fontWeight: 'bold' }}>Our Pillars for Your Success:</p>
            <ul style={{ paddingLeft: '20pt' }}>
                <li style={{ marginBottom: '8pt' }}>
                    <strong>The Registry:</strong> A forensic database of 22,000+ verified transport and supply entities. Bypass gatekeepers and reach the MD/CEO directly.
                </li>
                <li style={{ marginBottom: '8pt' }}>
                    <strong>The Mall:</strong> Specialized marketplaces where you can list your digital branch or buy parts at "Syndicate" rates.
                </li>
                <li style={{ marginBottom: '8pt' }}>
                    <strong>The Capital:</strong> Real-world operational data from platform activity allows our funding division to finance your business where banks fail.
                </li>
            </ul>
            
            <p>You can activate your digital node for free and explore the grid via the link below:</p>
            <p style={{ marginTop: '10pt', padding: '10pt', backgroundColor: '#f0f0f0', borderRadius: '5pt' }}>
                <a href={signupLink} target="_blank" style={{ color: '#228B22', fontWeight: 'bold', textDecoration: 'none' }}>{signupLink}</a>
            </p>
            
            <p style={{ marginTop: '20pt' }}>Regards,</p>
            <p><strong>The Logistics Flow Team</strong></p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
