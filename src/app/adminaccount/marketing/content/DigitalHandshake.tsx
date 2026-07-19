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
    
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 'bold', color: '#228B22', fontSize: '14pt', marginBottom: '10pt' }}>
                REGISTRATION IS 100% FREE
            </p>
            <p>Good day {firstName},</p>
            <p>Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs and information fragmentation for companies like <strong>{companyName}</strong>.</p>
            <p>We are establishing a secure communication bridge between our industrial matching engine and the market leadership. Before we can deliver verified matches or community savings to your dashboard, we require a formal digital handshake.</p>
            <p style={{ margin: '20pt 0' }}>
                <strong>Establish your free standing in the industrial brain here:</strong><br />
                <a href={optInLink} target="_blank" style={{ color: '#228B22', fontWeight: 'bold', textDecoration: 'underline' }}>{optInLink}</a>
            </p>
            <p>By establishing this handshake, you unlock:</p>
            <ul style={{ paddingLeft: '20pt' }}>
                <li><strong>Absolute Transparency:</strong> Unlimited registry search for 22,000+ verified records.</li>
                <li><strong>Direct Commercial Flow:</strong> Connect with 5,400+ hauliers and 85+ specialized lenders.</li>
                <li><strong>Syndicate Power:</strong> Buy spares, tires, and fuel at community-negotiated discounts.</li>
            </ul>
            <p style={{ marginTop: '20pt' }}>Regards,</p>
            <p><strong>The Logistics Flow Team</strong></p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
