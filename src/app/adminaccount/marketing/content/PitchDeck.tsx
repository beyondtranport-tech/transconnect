'use client';

import React from "react";

export default function PitchDeck({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';

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
                Strategic Proposal for {companyName.toUpperCase()}
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                We have identified {companyName} as a potential foundational stakeholder in the Logistics Flow ecosystem. This proposal outlines the personalized roadmap for {recipientName} to achieve exponential growth through collaboration.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Executive Summary:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>The Foundation:</strong> Granting {companyName} a Free Lifetime Premium Membership to ensure full, unrestricted access to all platform tools.</li>
                <li style={{ marginBottom: '7pt' }}><strong>The Strategy:</strong> Digitalizing your existing haulier and supplier contacts to create a high-velocity commercial network.</li>
                <li style={{ marginBottom: '7pt' }}><strong>The Upside:</strong> Unlocking multiple recurring and transactional revenue streams that scale with your network&apos;s activity.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0' }}>
                We believe that {companyName} is uniquely positioned to benefit from this transition, turning your current operational footprint into a powerful digital asset.
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Regards,
            </p>
            <p style={{ margin: '0' }}>
                The Logistics Flow Growth Strategy Team
            </p>
        </div>
    );
}
