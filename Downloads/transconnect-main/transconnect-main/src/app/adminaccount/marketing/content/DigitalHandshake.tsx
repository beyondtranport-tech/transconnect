'use client';

import React, { useMemo, useState } from "react";
import { ShieldCheck, Phone, Loader2, CheckCircle } from "lucide-react";
import { getClientSideAuthToken } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DigitalHandshake({ partner, audience }: { partner?: any, audience?: string }) {
    const { toast } = useToast();
    const [isRequesting, setIsRequesting] = useState(false);
    const [pin, setPin] = useState<string | null>(null);

    const isValid = (val: any) => {
        if (!val) return false;
        const v = String(val).trim().toLowerCase();
        const forbidden = ['n/a', 'null', 'none', 'locked', 'undefined', '[locked]', 'no email', 'no phone', 'pending', 'h', 'x'];
        return v.length > 1 && !forbidden.includes(v);
    };

    const resolvedName = useMemo(() => {
        // --- V13 RESOLUTION: PRIORITIZE ACCOUNT LEAD ---
        const primaryRole = partner?.primaryContactRole;
        const primaryContact = primaryRole ? partner[primaryRole] : null;
        if (primaryContact?.name && isValid(primaryContact.name)) return primaryContact.name;

        if (partner?.marketingManager?.name && isValid(partner.marketingManager.name)) return partner.marketingManager.name;
        if (partner?.ceo?.name && isValid(partner.ceo.name)) return partner.ceo.name;
        if (partner?.contactPerson && isValid(partner.contactPerson)) return partner.contactPerson;
        if (partner?.contact_person && isValid(partner.contact_person)) return partner.contact_person;
        return (partner?.firstName && isValid(partner.firstName)) ? partner.firstName : 'Partner';
    }, [partner]);

    const firstName = resolvedName.split(' ')[0];
    const companyName = partner?.companyName || 'your business';
    const aud = (audience || '').toLowerCase();
    
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    const handleRequestVerification = async () => {
        setIsRequesting(true);
        try {
            const token = await getClientSideAuthToken();
            const response = await fetch('/api/requestVerification', {
                method: 'POST',
                headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId: partner?.id, collection: partner?.source === 'Lead' ? 'leads' : 'partners' }),
            });
            const result = await response.json();
            if (result.success) {
                setPin(result.pin);
                toast({ title: "Verification Requested", description: `Assigned PIN: ${result.pin}` });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: "Request Failed" });
        } finally {
            setIsRequesting(false);
        }
    };

    const renderBenefits = () => {
        if (aud === 'supplier' || aud === 'vendor') {
            return (
                <ul style={{ paddingLeft: '20pt' }}>
                    <li><strong>Sales Velocity:</strong> Gain direct access to 5,420+ verified transport decision-makers.</li>
                    <li><strong>Simplified RFQs:</strong> Receive high-intent enquiries from members matching your trade.</li>
                    <li><strong>Get Paid Upfront:</strong> We finance your customers so you get settled in full, immediately.</li>
                </ul>
            );
        }
        if (aud === 'transporter' || aud === 'haulier') {
            return (
                <ul style={{ paddingLeft: '20pt' }}>
                    <li><strong>Operational Savings:</strong> Buy tires, spares, and fuel at community-negotiated "Syndicate" discounts.</li>
                    <li><strong>Direct Capital:</strong> Access our in-house finance division for asset growth and working capital.</li>
                    <li><strong>Capacity Matching:</strong> Use AI to find loads and eliminate empty return miles.</li>
                </ul>
            );
        }
        return (
            <ul style={{ paddingLeft: '20pt' }}>
                <li><strong>Network Monetization:</strong> Turn your existing industry contacts into a recurring revenue engine.</li>
                <li><strong>Absolute Transparency:</strong> Unlimited registry search for 22,000+ verified records.</li>
                <li><strong>ISA Pathway:</strong> Graduate to an elite earning tier with performance bonuses.</li>
            </ul>
        );
    };

    return (
        <div style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000', lineHeight: '1.4' }}>
            <p style={{ fontWeight: 'bold', color: '#228B22', fontSize: '16pt', marginBottom: '5pt', textTransform: 'uppercase' }}>
                REGISTRATION IS 100% FREE
            </p>
            
            {/* TRUST SHIELD MODULE */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '15pt', borderRadius: '8pt', marginBottom: '15pt' }}>
                <p style={{ fontWeight: 'bold', fontSize: '10pt', color: '#64748b', textTransform: 'uppercase', marginBottom: '5pt' }}>
                    🛡️ THE TRUST SHIELD: SECURE GRID VERIFICATION
                </p>
                <p style={{ fontSize: '10pt', margin: '0' }}>
                    Logistics Flow is a <strong>closed industrial network</strong>. You are receiving this because <strong>{companyName}</strong> is already cataloged in our forensic registry. We do not sell data; we optimize connection.
                </p>
                {pin ? (
                    <div style={{ marginTop: '10pt', color: '#228B22', fontWeight: 'bold', fontSize: '11pt' }}>
                        ✅ Verification Active. Tracking PIN: {pin}. A platform agent will call you to verify this record.
                    </div>
                ) : (
                    <div style={{ marginTop: '10pt' }}>
                        <p style={{ fontSize: '9pt', color: '#64748b', fontStyle: 'italic', marginBottom: '5pt' }}>Hesitant to click the link? Request a human verification call instead.</p>
                        <button 
                            onClick={handleRequestVerification}
                            disabled={isRequesting}
                            style={{ backgroundColor: '#ffffff', border: '1px solid #228B22', color: '#228B22', padding: '6pt 12pt', borderRadius: '4pt', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            {isRequesting ? 'Requesting...' : 'Request Phone Verification'}
                        </button>
                    </div>
                )}
            </div>

            <p>Good day {firstName},</p>
            
            <p>We are currently establishing a secure communication bridge between our industrial matching engine and the market leadership. Before we can deliver verified matches, RFQs, or community savings to your dashboard, we require a formal digital handshake.</p>
            
            <p style={{ margin: '20pt 0', padding: '15pt', border: '2px dashed #228B22', borderRadius: '10pt', backgroundColor: '#f9fff9', textAlign: 'center' }}>
                <strong>Establish your FREE standing in the industrial brain here:</strong><br />
                <a href={optInLink} target="_blank" style={{ color: '#228B22', fontWeight: 'bold', fontSize: '14pt', textDecoration: 'underline' }}>{optInLink}</a>
            </p>
            
            <p>By establishing this handshake, you unlock:</p>
            {renderBenefits()}
            
            <p style={{ marginTop: '20pt' }}>Regards,</p>
            <p><strong>The Logistics Flow Team</strong></p>
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="" />
        </div>
    );
}
