
'use client';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function salesRoadmapLogic(inputs: any) {
    const data = [];
    let cumulativeMembers = 0;
    const totalPowerPartnerProspects = inputs.numberOfPowerPartners * inputs.opportunitiesPerPartner;
    const totalInitialProspects = inputs.initialTransporters + inputs.initialSuppliers + totalPowerPartnerProspects;
    const monthlyProspectsReached = Math.floor(totalInitialProspects / inputs.forecastMonths);

    for (let i = 0; i < inputs.forecastMonths; i++) {
        const date = new Date(inputs.startYear, inputs.startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        const currentCampaignConversionRate = i < inputs.campaignDuration ? inputs.campaignConversionRate / 100 : 0;
        const campaignNewMembers = Math.floor(monthlyProspectsReached * currentCampaignConversionRate);

        let networkNewMembers = 0;
        if (i >= inputs.customerConversionLag) {
            const membersAtLag = data[i - inputs.customerConversionLag]?.cumulativeMembers || 0;
            const potentialNetworkPool = membersAtLag * inputs.avgCustomersPerMember;
            networkNewMembers = Math.floor(potentialNetworkPool * (inputs.customerConversionRate / 100) / 12);
        }

        const isaNewMembers = Math.floor(inputs.numberOfIsas * inputs.referralsPerIsa * (inputs.isaConversionRate / 100));
        const totalNewMembers = campaignNewMembers + networkNewMembers + isaNewMembers;
        cumulativeMembers += totalNewMembers;

        data.push({ month: `${month} ${year}`, year, campaignNewMembers, isaNewMembers, networkNewMembers, totalNewMembers, cumulativeMembers });
    }
    return data;
}

export function budgetLogic(roadmapData: any[], budgetInputs: any) {
    const forecastData = [];

    for (let i = 0; i < roadmapData.length; i++) {
        const row = roadmapData[i];
        const members = row.cumulativeMembers;

        // Revenue Calculation
        const membershipRevenue = row.totalNewMembers * budgetInputs.revenue.membershipFees;
        const connectPlanRevenue = members * (budgetInputs.revenue.connectPlanAdoptionRate / 100) * budgetInputs.revenue.avgConnectPlanFee;
        const mallRevenue = members * budgetInputs.revenue.avgMallSpendPerMember * (budgetInputs.revenue.mallCommissionRate / 100);
        const techRevenue = members * (budgetInputs.revenue.techServicesAdoptionRate / 100) * budgetInputs.revenue.avgTechSpendPerMember;
        const totalRevenue = membershipRevenue + connectPlanRevenue + mallRevenue + techRevenue;

        // COGS Calculation
        const memberCommission = mallRevenue * (budgetInputs.cogs.memberCommissionShare / 100);
        const isaCommission = totalRevenue * (budgetInputs.cogs.isaCommissionRate / 100);
        const totalCogs = memberCommission + isaCommission;

        const grossProfit = totalRevenue - totalCogs;
        
        // OPEX Calculation
        const opexSalaries = budgetInputs.opexSalaries.reduce((sum: number, role: any) => {
            const countForMonth = role.monthlyHeadcount?.[i] || 0;
            return sum + (countForMonth * role.salary);
        }, 0);
        
        const opexOther = budgetInputs.opexOther;
        const totalOpex = opexSalaries + Object.values(opexOther).reduce((sum: number, value: any) => sum + Number(value), 0);
        
        const netProfit = grossProfit - totalOpex;

        forecastData.push({
            month: row.month,
            year: row.year,
            members: members,
            
            // Revenue Breakdown
            membershipRevenue,
            connectPlanRevenue,
            mallRevenue,
            techRevenue,
            totalRevenue,

            // COGS Breakdown
            memberCommission,
            isaCommission,
            totalCogs,

            grossProfit,

            // OPEX Breakdown
            opexSalaries,
            ...opexOther,
            totalOpex,

            netProfit,
        });
    }

    return forecastData;
}
