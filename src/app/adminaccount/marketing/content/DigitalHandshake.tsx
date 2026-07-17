'use client';

import React, { useMemo } from "react";

/**
 * AUTHORITATIVE DIGITAL HANDSHAKE
 * Normalised to verified hosted origin to prevent firewall blocks.
 */
export default function DigitalHandshake({ partner, audience, version = 'v1' }: { partner?: any, audience?: string, version?: string }) {
    const isValid = (val: any) => !!val && val !== 'N/A' && val !== 'null' && val !== 'None';

    // RESOLVE SALUTATION NAME VIA CONTACT HIERARCHY
    const resolvedName = useMemo(() => {
        if (partner?.marketingManager?.name && isValid(partner.marketingManager.name)) return partner.marketingManager.name;
        if (partner?.ceo?.name && isValid(partner.ceo.name)) return partner.ceo.name;
        return partner?.firstName || partner?.contactPerson || 'Partner';
    }, [partner]);

    const firstName = resolvedName.split(' ')[0];
    const companyName = partner?.companyName || 'your business';
    
    // VERIFIED HOSTED ORIGIN: Prevents authentication redirects and security blocks.
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    const isSupplier = audience === 'suppliers';
    const isAssociate = audience === 'associates' || audience === 'isa';
    const isFinance = audience === 'finance' || audience === 'investors';
    
    // 1. FINANCE PARTNER / LENDER VERSION
    if (isFinance) {
        return (
            <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.2' }}>
                <p>Good day {firstName},</p>
                <p>Inefficient origination is a silent cost for funding institutions. Logistics Flow is a unified digital ecosystem built to bridge the data gap between the South African transport industry and institutional capital.</p>
                <p><strong>"We have catalogued the national transport grid into a forensic registry of over 22,000 records. Within our Finance Mall, we provide specialized lenders with an automated matching tool—exposing your institution only to verified applications that meet your exact credit and asset criteria."</strong></p>
                <p>Establish the handshake to secure your standing in the industrial funding pipeline:</p>
                <p><a href={optInLink} target="_blank" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>{optInLink}</a></p>
                <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
            </div>
        );
    }

    // 2. DIGITAL PARTNER / ASSOCIATE VERSION
    if (isAssociate) {
        return (
            <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.2' }}>
                <p>Good day {firstName},</p>
                <p>The South African transport industry is moving from fragmented physical networks to a unified digital ecosystem. We want to propose a strategic partnership that turns your industry influence into a recurring revenue engine.</p>
                <p>Establish the handshake to activate your creative studio and tracking node:</p>
                <p><a href={optInLink} target="_blank" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>{optInLink}</a></p>
                <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
            </div>
        );
    }

    // 3. SUPPLIER VERSION
    if (isSupplier) {
        return (
            <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.2' }}>
                <p>Good day {firstName},</p>
                <p>The opportunity to scale your supply business has never been more immediate. With over 5,400+ verified transport companies active in our ecosystem, we are opening a direct sales channel for providers like {companyName}.</p>
                <p>Establish the handshake to secure your direct line to the community below:</p>
                <p><a href={optInLink} target="_blank" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>{optInLink}</a></p>
                <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
            </div>
        );
    }

    // 4. TRANSPORTER VERSION (Default)
    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.2' }}>
            <p>Good day {firstName},</p>
            <p>Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs and empty miles for companies like {companyName}.</p>
            <p>Establish the handshake to secure your standing in the industrial brain:</p>
            <p><a href={optInLink} target="_blank" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>{optInLink}</a></p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
