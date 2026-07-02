'use client';

import React from "react";

/**
 * AUTHORITATIVE DIGITAL HANDSHAKE
 * Tailored for four primary audiences: Suppliers, Transporters, Finance Partners, and Digital Partners.
 */
export default function DigitalHandshake({ partner, audience, version = 'v1' }: { partner?: any, audience?: string, version?: string }) {
    const firstName = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Partner');
    const companyName = partner?.companyName || 'your business';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    const isSupplier = audience === 'suppliers';
    const isAssociate = audience === 'associates' || audience === 'isa';
    const isFinance = audience === 'finance' || audience === 'investors';
    
    // 1. FINANCE PARTNER / LENDER VERSION
    if (isFinance) {
        return (
            <div style={{ 
                fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
                fontSize: '12pt', 
                color: '#000000', 
                lineHeight: '1.2',
                backgroundColor: '#ffffff',
                padding: '0'
            }}>
                <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName},</p>

                <p style={{ margin: '0 0 14pt 0' }}>
                    Inefficient origination is a silent cost for funding institutions. Logistics Flow is a unified digital ecosystem built to bridge the data gap between the South African transport industry and institutional capital.
                </p>

                <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                    "We have cataloged the national transport grid into a forensic registry of over 22,000 records. Within our Finance Mall, we provide specialized lenders with an automated matching tool—exposing your institution only to verified applications that meet your exact credit and asset criteria."
                </p>

                <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Finance Partner Advantage:</p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                    <li style={{ marginBottom: '7pt' }}><strong>Automated Deal-Flow:</strong> Receive high-intent enquiries pre-filtered to match your lending mandate.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Forensic Verification:</strong> Every application includes verified RC1 fleet data and human identity confirmation.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Market Transparency:</strong> Access direct leadership contacts for over 5,400+ transport companies.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Digital Credit Scoring:</strong> Utilize platform-native performance data to de-risk your deployment.</li>
                </ul>

                <p style={{ margin: '0 0 14pt 0' }}>
                    Establish the handshake to secure your standing in the industrial funding pipeline:
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    <a href={optInLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                        {optInLink}
                    </a>
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    By establishing this handshake, you confirm your standing in our secure industrial communication network.
                </p>

                <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                    <p style={{ fontSize: '9pt', color: '#999999', margin: '0', fontWeight: 'bold' }}>
                        LOGISTICS FLOW SECURE NETWORK | AUTHORIZED CAPITAL SESSION | ALL RIGHTS RESERVED
                    </p>
                </div>

                <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Tracking" />
            </div>
        );
    }

    // 2. DIGITAL PARTNER / ASSOCIATE VERSION
    if (isAssociate) {
        return (
            <div style={{ 
                fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
                fontSize: '12pt', 
                color: '#000000', 
                lineHeight: '1.2',
                backgroundColor: '#ffffff',
                padding: '0'
            }}>
                <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName},</p>

                <p style={{ margin: '0 0 14pt 0' }}>
                    The South African transport industry is moving from fragmented physical networks to a unified digital ecosystem. We have identified your standing as a digital creator and are writing to propose a strategic partnership that turns your industry influence into a recurring revenue engine.
                </p>

                <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                    "We want to empower you to lead this digitalization. To connect your creative skills and influence to our platform, we have built a dedicated AI Marketing Studio—allowing you to generate 4K industrial narratives and high-fidelity brand assets instantly to monetize your network."
                </p>

                <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>What we want from our Digital Partners:</p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                    <li style={{ marginBottom: '7pt' }}><strong>Network Integration:</strong> Use your influence to digitalize your existing haulier and supplier contacts into our community.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Content Leadership:</strong> Utilize our AI tools to broadcast high-value industrial insights to your audience.</li>
                </ul>

                <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Associate Advantage:</p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                    <li style={{ marginBottom: '7pt' }}><strong>AI Content Studio:</strong> Free access to 4K video, image, and copy generators tailored for transport.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Recurring Annuity:</strong> Earn a lifetime percentage of every membership and transaction generated by your node.</li>
                </ul>

                <p style={{ margin: '0 0 14pt 0' }}>
                    Establish the handshake to activate your creative studio and tracking node:
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    <a href={optInLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                        {optInLink}
                    </a>
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    By establishing this handshake, you confirm your standing as a strategic partner in our industrial communication pipeline.
                </p>

                <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                    <p style={{ fontSize: '9pt', color: '#999999', margin: '0', fontWeight: 'bold' }}>
                        LOGISTICS FLOW SECURE NETWORK | ASSOCIATE PARTNER SESSION | ALL RIGHTS RESERVED
                    </p>
                </div>

                <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Tracking" />
            </div>
        );
    }

    // 3. SUPPLIER VERSION
    if (isSupplier) {
        return (
            <div style={{ 
                fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
                fontSize: '12pt', 
                color: '#000000', 
                lineHeight: '1.2',
                backgroundColor: '#ffffff',
                padding: '0'
            }}>
                <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName},</p>

                <p style={{ margin: '0 0 14pt 0' }}>
                    The opportunity to scale your supply business has never been more immediate. With over 5,400+ verified transport companies already active in our ecosystem, we are opening a direct sales channel for established providers like {companyName}.
                </p>

                <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                    "This is more than a registry, it is a high-velocity growth engine. We provide you with the forensic data to find your most profitable customers and the embedded finance to ensure they have the capital to buy from you upfront and in full."
                </p>

                <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Supplier Advantage:</p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                    <li style={{ marginBottom: '7pt' }}><strong>Direct Market Access:</strong> Instantly reach 5,400+ fleet owners actively searching for parts and services.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Forensic Sales Tools:</strong> Access direct mobile numbers and emails for MDs/Owners to bypass generic switchboards.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Embedded Finance:</strong> We fund your customers so you can close more deals without cash flow constraints.</li>
                </ul>

                <p style={{ margin: '0 0 14pt 0' }}>
                    Establish the handshake to secure your direct line to the community below:
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    <a href={optInLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                        {optInLink}
                    </a>
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    By establishing this handshake, you confirm your standing in our secure industrial communication pipeline.
                </p>

                <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                    <p style={{ fontSize: '9pt', color: '#999999', margin: '0', fontWeight: 'bold' }}>
                        LOGISTICS FLOW SECURE NETWORK | AUTHORIZED INDUSTRIAL SESSION | ALL RIGHTS RESERVED
                    </p>
                </div>

                <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Tracking" />
            </div>
        );
    }

    // 4. TRANSPORTER VERSION (Default)
    return (
        <div style={{ 
            fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
            fontSize: '12pt', 
            color: '#000000', 
            lineHeight: '1.2',
            backgroundColor: '#ffffff',
            padding: '0'
        }}>
            <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName},</p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Inefficiency is a silent tax on your transport business. Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs and empty miles for companies like {companyName}.
            </p>

            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                "This is more than a registry, it is a high-velocity growth engine. We provide you with the forensic data to find your most profitable customers and the embedded finance to ensure they have the capital to buy from you upfront and in full."
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Transporter Advantage:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Capacity Matching:</strong> Proactive AI alerts for loads that match your empty leg routes.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Group Buying Power:</strong> Access community-negotiated rates for tires, fuel, and parts.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Validated Standing:</strong> Build a digital track record to unlock asset finance from our 85+ lenders.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0' }}>
                Establish the handshake to secure your standing in the industrial brain:
            </p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                <a href={optInLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                    {optInLink}
                </a>
            </p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                By establishing this handshake, you confirm your standing in our secure industrial communication pipeline.
            </p>

            <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                <p style={{ fontSize: '9pt', color: '#999999', margin: '0', fontWeight: 'bold' }}>
                    LOGISTICS FLOW SECURE NETWORK | AUTHORIZED INDUSTRIAL SESSION | ALL RIGHTS RESERVED
                </p>
            </div>

            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Tracking" />
        </div>
    );
}
