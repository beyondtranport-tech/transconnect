
'use client';

import React, { useMemo } from "react";

/**
 * Revenue Model Content
 * Implements Contact Hierarchy for salutations.
 */
export default function RevenueModel({ partner }: { partner?: any }) {
    const isValid = (val: any) => !!val && val !== 'N/A' && val !== 'null' && val !== 'None';

    // RESOLVE SALUTATION NAME VIA CONTACT HIERARCHY
    const resolvedName = useMemo(() => {
        if (partner?.marketingManager?.name && isValid(partner.marketingManager.name)) return partner.marketingManager.name;
        if (partner?.ceo?.name && isValid(partner.ceo.name)) return partner.ceo.name;
        return partner?.firstName || partner?.contactPerson || 'Partner';
    }, [partner]);

    const firstName = resolvedName.split(' ')[0];
    const companyName = partner?.companyName || 'your business';
    const pixelUrl = `/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    return (
        <div style={{ 
            fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
            fontSize: '12pt', 
            color: '#000000', 
            lineHeight: '1.2',
            backgroundColor: '#ffffff',
            padding: '0'
        }}>
            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000000', paddingBottom: '4pt' }}>
                Revenue Generation & Network Monetization: {companyName.toUpperCase()}
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Your most valuable asset is the network you have built over years of operation. Logistics Flow provides the mechanism to turn those industry relationships into a passive revenue engine for {companyName}.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Primary Earning Streams:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Annuity Membership Share:</strong> Earn a recurring percentage share of every monthly membership fee paid by your referrals.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Transactional Commissions:</strong> Participate in the platform&apos;s revenue whenever your network members buy tires, parts, or access finance.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Value-Added Reselling:</strong> Offer high-demand services like RAF Assist or specialized liability cover directly to your contacts for immediate splits.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0' }}>
                This model ensures that as the ecosystem grows and your network engages, {companyName}&apos;s profitability increases without a corresponding increase in operational effort.
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Regards,
            </p>
            <p style={{ margin: '0 0 14pt 0' }}>
                The Logistics Flow Commercial Team
            </p>

            {/* Forensic Tracking Pixel */}
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
