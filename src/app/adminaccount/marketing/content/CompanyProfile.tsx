'use client';

import React from "react";

/**
 * STRATEGIC COMPANY PROFILE
 * Normalized to public hosted origin for deliverability.
 */
export default function CompanyProfile({ audience, partner }: { audience: string; partner?: any }) {
    const isValid = (val: any) => !!val && val !== 'N/A' && val !== 'null' && val !== 'None';

    const resolvedName = (partner?.marketingManager?.name && isValid(partner.marketingManager.name)) 
        ? partner.marketingManager.name 
        : (partner?.ceo?.name && isValid(partner.ceo.name))
        ? partner.ceo.name
        : partner?.firstName || partner?.contactPerson || 'Member';

    const firstName = resolvedName.split(' ')[0];

    const email = isValid(partner?.marketingManager?.email) 
        ? partner.marketingManager.email 
        : isValid(partner?.ceo?.email)
        ? partner.ceo.email
        : partner?.email || '';

    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;
    const signupLink = `${baseUrl}/join?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&ref=${partner?.id || 'SYSTEM'}`;

    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.2' }}>
            <p style={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000000' }}>
                INDUSTRIAL MEMO: THE DIGITALIZATION OF LOGISTICS FLOW
            </p>
            <p>Good day {firstName}, we write to introduce the Logistics Flow ecosystem to your business.</p>
            <p>Logistics Flow is a <strong>Data-as-a-Service (DaaS)</strong> ecosystem designed to break the constraints of the South African transport industry.</p>
            <p>You can explore our forensic registries and set up your own digital branch via the link below:</p>
            <p><a href={signupLink} target="_blank" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>{signupLink}</a></p>
            <p>Regards,</p>
            <p><strong>The Logistics Flow Team</strong></p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}