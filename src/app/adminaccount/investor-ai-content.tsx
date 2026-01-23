
'use client';

import CampaignContent from "./campaign-content";

const investorGeneratorPrompt = `A futuristic, abstract image representing financial growth and logistics technology for an investor presentation. The image should blend themes of data streams, network graphs, and subtle truck motifs. Use a professional color palette of forest green, charcoal, and light gray, with upward-trending lines to signify growth and profitability.`;

const investorEditorPrompt = `Take this graph of our financial projections and make it look more professional.

Examples of other good prompts:
- Overlay our company logo onto this image of a high-tech dashboard.
- Change the color scheme of this chart to match our brand colors (forest green, charcoal).
- Add the text 'Projected Y1 Revenue: R12M' to the top right of the image.`;

const investorVideoPrompt = `Create a short, dynamic video for an investor pitch. Start with a problem statement: show fragmented and inefficient logistics (e.g., empty trucks, manual paperwork). Transition to the solution: show the Logistics Flow platform UI, data streams connecting trucks, and graphs showing growth. End with a powerful shot of a fleet of modern trucks driving into the sunset, symbolizing success. Use a professional, confident voiceover and an inspiring corporate soundtrack.`;


export default function InvestorAiContent() {
    return (
        <CampaignContent
            title="Investor Pitch AI Content Studio"
            description="Use these tools to generate images and content for your investor presentations and documents."
            imageGeneratorPrompt={investorGeneratorPrompt}
            imageEditorPrompt={investorEditorPrompt}
            videoGeneratorPrompt={investorVideoPrompt}
        />
    );
}
