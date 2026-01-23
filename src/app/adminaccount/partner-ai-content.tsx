
'use client';

import CampaignContent from "./campaign-content";

const partnerGeneratorPrompt = `An image representing a strong business partnership in the logistics industry. Two professionals, one representing Logistics Flow and another a potential partner, are shaking hands in front of a fleet of modern trucks. The scene should look professional, trustworthy, and suggest mutual growth and opportunity. Use natural lighting and a clean, industrial background.`;

const partnerEditorPrompt = `Take this image of a truck and add our partner's logo to the side of it.

Examples of other good prompts:
- Place our two company logos side-by-side with a handshake icon between them.
- Change the background to a busy, modern warehouse to represent a logistics partnership.
- Create a banner that says 'Logistics Flow & [Partner Name] - Driving the Future Together'.`;

const partnerVideoPrompt = `Create a video explaining the Logistics Flow partnership program. Start by showing the challenges transporters face (e.g., high costs, finding work). Introduce the solution by showing the platform's features (Malls, Funding, Tech). Animate how a partner earns recurring revenue and transactional commission. End with a call to action: "Partner with us and build your business." Use an energetic and optimistic tone.`;


export default function PartnerAiContent() {
    return (
        <CampaignContent
            title="Partner Pitch AI Content Studio"
            description="Use these tools to generate images and content for your partner outreach materials."
            imageGeneratorPrompt={partnerGeneratorPrompt}
            imageEditorPrompt={partnerEditorPrompt}
            videoGeneratorPrompt={partnerVideoPrompt}
        />
    );
}
