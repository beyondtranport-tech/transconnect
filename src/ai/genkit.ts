// This file is temporarily modified to resolve dependency conflicts.
// AI functionality will be disabled until dependencies are updated.
export const ai: any = {
    defineFlow: () => () => { throw new Error("AI functionality is temporarily disabled."); },
    definePrompt: () => () => { throw new Error("AI functionality is temporarily disabled."); },
    defineTool: () => () => { throw new Error("AI functionality is temporarily disabled."); },
    generate: async () => { throw new Error("AI functionality is temporarily disabled."); },
};
