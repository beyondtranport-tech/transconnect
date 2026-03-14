'use server';

/**
 * @fileOverview Alias for the lead research flow.
 * This file exists to resolve a build error from a component referencing a non-existent module.
 * It simply re-exports the correct flow under the expected name.
 */
import {
  leadResearchFlow,
  type LeadResearchInput,
  type LeadResearchOutput,
} from './lead-research-flow';
import {
  LeadResearchInputSchema,
  LeadResearchOutputSchema,
} from '@/ai/schemas';

// Re-export types
export {
  type LeadResearchInput as LeadGenerationInput,
  type LeadResearchOutput as LeadGenerationOutput,
  LeadResearchInputSchema as LeadGenerationInputSchema,
  LeadResearchOutputSchema as LeadGenerationOutputSchema,
};

// Export the flow function under the expected alias
export const leadGenerationFlow = leadResearchFlow;
