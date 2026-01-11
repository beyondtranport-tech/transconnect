
'use client';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function salesRoadmapLogic(settings: any, salesInputs: any) {
    if (!settings || !salesInputs) return [];
    
    const data = [];
    let cumulativeMembers = 0;

    for (let i = 0; i < settings.forecastMonths; i++) {
        const date = new Date(settings.startYear, settings.startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        const monthlyInitialTransporters = salesInputs.initialTransporters?.[i] || 0;
        const monthlyInitialSuppliers = salesInputs.initialSuppliers?.[i] || 0;
        const monthlyPowerPartners = salesInputs.numberOfPowerPartners?.[i] || 0;
        const monthlyOppsPerPartner = salesInputs.opportunitiesPerPartner?.[i] || 0;
        const monthlyCampaignConversion = (salesInputs.campaignConversionRate?.[i] || 0) / 100;
        const monthlyCampaignDuration = salesInputs.campaignDuration?.[i] || 0;

        const totalPowerPartnerProspects = monthlyPowerPartners * monthlyOppsPerPartner;
        const totalInitialProspects = monthlyInitialTransporters + monthlyInitialSuppliers + totalPowerPartnerProspects;
        
        const currentCampaignConversionRate = i < monthlyCampaignDuration ? monthlyCampaignConversion : 0;
        const campaignNewMembers = Math.floor(totalInitialProspects * currentCampaignConversionRate);

        let networkNewMembers = 0;
        const lag = salesInputs.customerConversionLag?.[i] || 3;
        if (i >= lag) {
            const membersAtLag = data[i - lag]?.cumulativeMembers || 0;
            const avgCustomers = salesInputs.avgCustomersPerMember?.[i] || 0;
            const potentialNetworkPool = membersAtLag * avgCustomers;
            const customerConversion = (salesInputs.customerConversionRate?.[i] || 0) / 100;
            networkNewMembers = Math.floor(potentialNetworkPool * customerConversion / 12);
        }

        const monthlyIsas = salesInputs.numberOfIsas?.[i] || 0;
        const monthlyReferralsPerIsa = salesInputs.referralsPerIsa?.[i] || 0;
        const monthlyIsaConversion = (salesInputs.isaConversionRate?.[i] || 0) / 100;
        const isaNewMembers = Math.floor(monthlyIsas * monthlyReferralsPerIsa * monthlyIsaConversion);
        
        const totalNewMembers = campaignNewMembers + networkNewMembers + isaNewMembers;
        cumulativeMembers += totalNewMembers;

        data.push({ month: `${month} ${year}`, year, totalNewMembers, cumulativeMembers });
    }
    return data;
}

export function budgetLogic(roadmapData: any[], budgetInputs: any) {
    const forecastData = [];

    const monthlyOpexSalaries = budgetInputs.opexSalaries.reduce((sum: number, role: any) => sum + (role.count * role.salary), 0);
    const monthlyOpexOther = Object.values(budgetInputs.opexOther).reduce((sum: number, value: any) => sum + Number(value), 0);
    const totalMonthlyOpex = monthlyOpexSalaries + monthlyOpexOther;

    for (const row of roadmapData) {
        const members = row.cumulativeMembers;

        // Revenue Calculation
        const membershipRevenue = members * budgetInputs.revenue.membershipFees;
        const connectPlanRevenue = members * (budgetInputs.revenue.connectPlanAdoptionRate / 100) * budgetInputs.revenue.avgConnectPlanFee;
        const mallRevenue = members * budgetInputs.revenue.avgMallSpendPerMember * (budgetInputs.revenue.mallCommissionRate / 100);
        const techRevenue = members * (budgetInputs.revenue.techServicesAdoptionRate / 100) * budgetInputs.revenue.avgTechSpendPerMember;
        const totalRevenue = membershipRevenue + connectPlanRevenue + mallRevenue + techRevenue;

        // COGS Calculation
        const memberCommission = mallRevenue * (budgetInputs.cogs.memberCommissionShare / 100);
        const isaCommission = totalRevenue * (budgetInputs.cogs.isaCommissionRate / 100); // Assuming ISA commission is on all revenue
        const totalCogs = memberCommission + isaCommission;

        const grossProfit = totalRevenue - totalCogs;
        
        // OPEX Calculation
        const opexSalaries = monthlyOpexSalaries;
        const opexOther = budgetInputs.opexOther; // This is already an object of monthly costs
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
            ...opexOther, // Spread the individual other opex items
            totalOpex,

            netProfit,
        });
    }

    return forecastData;
}
