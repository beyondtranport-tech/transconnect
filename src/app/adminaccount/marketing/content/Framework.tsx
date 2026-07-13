
'use client';

import React, { useMemo } from "react";

/**
 * Partnership Framework Content
 * Implements Contact Hierarchy for salutations.
 */
export default function Framework({ partner }: { partner?: any }) {
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
                Partnership Framework: {companyName.toUpperCase()}
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                The following framework defines the strategic objective and commercial parameters for our partnership with {companyName}.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Our Objective for {firstName}:</p>
            <p style={{ margin: '0 0 14pt 0' }}>
                To provide {companyName} with the tools and incentives to digitize your existing network, leveraging collective data to unlock funding, savings, and new revenue streams for every participant.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Commercial Structure:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}>Annuity Membership Share (Stream A): Recurring participation in referral fees.</li>
                <li style={{ marginBottom: '7pt' }}>Mall Transactional Share (Stream B): Participation in Mall commissions (Supplier, Finance, etc.).</li>
                <li style={{ marginBottom: '7pt' }}>Marketplace Product Splits (Stream C): Revenue share from resold partner services.</li>
                <li style={{ marginBottom: '7pt' }}>Data & Origination Credits (Stream D): Rewards for high-quality registry contributions.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0' }}>
                This framework is designed for long-term alignment, ensuring that our success is directly tied to the growth and efficiency of {companyName}.
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Regards,
            </p>
            <p style={{ margin: '0 0 14pt 0' }}>
                The Logistics Flow Management Team
            </p>

            {/* Forensic Tracking Pixel */}
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
