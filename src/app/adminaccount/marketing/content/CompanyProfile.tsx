
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

    // PRODUCTION HOSTED ORIGIN
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const signupLink = `${baseUrl}/join?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&ref=${partner?.id || 'SYSTEM'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000000', paddingBottom: '4pt' }}>
                INDUSTRIAL MEMO: THE DIGITALIZATION OF LOGISTICS FLOW
            </p>
            <p>Good day {firstName}, we write to formally introduce the Logistics Flow ecosystem to your business.</p>
            <p>Logistics Flow is a <strong>Data-as-a-Service (DaaS)</strong> platform designed to optimize the South African transport industry. We provide the map and the tools to break the information constraints that prevent industrial growth.</p>
            <p style={{ margin: '15pt 0', fontWeight: 'bold' }}>Our Pillars:</p>
            <ul style={{ paddingLeft: '20pt' }}>
                <li style={{ marginBottom: '5pt' }}><strong>The Registry:</strong> A forensic database of 22,000+ verified transport and supply entities.</li>
                <li style={{ marginBottom: '5pt' }}><strong>The Mall:</strong> Specialized marketplaces for parts, tires, and excess storage capacity.</li>
                <li style={{ marginBottom: '5pt' }}><strong>The Tech:</strong> AI-powered freight matching to eliminate empty miles.</li>
            </ul>
            <p>You can activate your digital node and explore the grid via the link below:</p>
            <p style={{ marginTop: '10pt' }}>
                <a href={signupLink} target="_blank" style={{ color: '#228B22', fontWeight: 'bold' }}>{signupLink}</a>
            </p>
            <p style={{ marginTop: '20pt' }}>Regards,</p>
            <p><strong>The Logistics Flow Team</strong></p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
