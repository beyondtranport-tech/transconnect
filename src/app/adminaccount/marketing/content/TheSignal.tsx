'use client';

import React from "react";

/**
 * THE SIGNAL: Signal-Based Selling & Psychopathic Mapping
 * High-Greed/Growth trigger focused on active inbound demand.
 */
export default function TheSignal({ partner }: { partner?: any }) {
    const companyName = partner?.companyName || 'your business';
    const pixelUrl = `https://studio--ecosystem-hub.us-central1.hosted.app/api/trackEmailOpen/${partner?.id || 'anonymous'}`;
    const optInLink = `https://studio--ecosystem-hub.us-central1.hosted.app/opt-in/${partner?.id || 'TEST'}`;

    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 'bold', color: '#228B22', fontSize: '14pt', marginBottom: '5pt' }}>
                LIVE SIGNAL: INBOUND INTEREST LOGGED
            </p>
            
            <p>Good day,</p>
            
            <p>This is an automated notification from the Logistics Flow <strong>Inbound Interest Ledger</strong>. Our system has just recorded a "Select to Engage" action on the forensic profile for <strong>{companyName}</strong>.</p>
            
            <p style={{ margin: '15pt 0' }}>
                A verified Decision Maker (MD/Owner) in our community has explicitly selected your business to initiate a handshake. 
            </p>
            
            <p style={{ fontWeight: 'bold', color: '#1e293b', backgroundColor: '#f1f5f9', padding: '10pt', borderRadius: '4pt' }}>
                STATUS: Handshake Blocked (Tier Restriction)
            </p>
            
            <p style={{ marginTop: '15pt' }}>
                Because you have not yet established your digital node, this lead is currently held as a "Blind Lead." We cannot release the contact name, email, or direct mobile number until your node is active.
            </p>
            
            <p>Do you want to receive this specific handshake, or should we route the next signal to a verified competitor in your region?</p>
            
            <p style={{ marginTop: '20pt', textAlign: 'center' }}>
                <a href={optInLink} target="_blank" style={{ display: 'inline-block', backgroundColor: '#228B22', color: '#ffffff', padding: '12pt 24pt', borderRadius: '5pt', fontWeight: 'bold', textDecoration: 'none' }}>
                    Reveal My Sales Leads &rarr;
                </a>
            </p>
            
            <p style={{ marginTop: '20pt' }}>
                Regards,<br />
                <strong>Logistics Flow intelligence Division</strong>
            </p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
