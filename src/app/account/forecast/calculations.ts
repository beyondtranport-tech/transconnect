
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

export function budgetLogic(roadmapData: any[], budgetInputs: any, targets: any) {
    const forecastData = [];

    const monthlyOpexSalaries = budgetInputs.opexSalaries.reduce((sum: number, role: any) => sum + (role.count * role.salary), 0);
    const monthlyOpexOther = Object.values(budgetInputs.opexOther).reduce((sum: number, value: any) => sum + Number(value), 0);
    const totalMonthlyOpex = monthlyOpexSalaries + monthlyOpexOther;

    // Simplified Loyalty Tier Commission Shares - these would ideally be fetched from Firestore
    const loyaltyTierShares = {
        bronze: 0.10, // 10%
        silver: 0.15, // 15%
        gold: 0.20,   // 20%
    };

    for (let i = 0; i < roadmapData.length; i++) {
        const row = roadmapData[i];
        const members = row.cumulativeMembers;

        // Get adoption rates for the current month
        const rewardsAdoption = (targets?.monthlyTargets?.rewardsPlans?.[i] || 0) / 100;
        const loyaltyAdoption = (targets?.monthlyTargets?.loyaltyPlans?.[i] || 0) / 100;
        const actionsAdoption = (targets?.monthlyTargets?.actionPlans?.[i] || 0) / 100;

        // Get plan prices from budget inputs
        const rewardsPrice = budgetInputs.revenue.avgConnectPlanFee; // Assuming this is the price for all plans for now
        const loyaltyPrice = budgetInputs.revenue.avgConnectPlanFee;
        const actionsPrice = budgetInputs.revenue.avgConnectPlanFee;

        // Calculate revenue from each Connect Plan
        const rewardsRevenue = members * rewardsAdoption * rewardsPrice;
        const loyaltyRevenue = members * loyaltyAdoption * loyaltyPrice;
        const actionsRevenue = members * actionsAdoption * actionsPrice;
        const connectPlanRevenue = rewardsRevenue + loyaltyRevenue + actionsRevenue;
        
        // Revenue Calculation
        const membershipRevenue = members * budgetInputs.revenue.membershipFees;
        const mallRevenue = members * budgetInputs.revenue.avgMallSpendPerMember * (budgetInputs.revenue.mallCommissionRate / 100);
        const techRevenue = members * (budgetInputs.revenue.techServicesAdoptionRate / 100) * budgetInputs.revenue.avgTechSpendPerMember;
        const totalRevenue = membershipRevenue + connectPlanRevenue + mallRevenue + techRevenue;

        // --- COGS Calculation with Loyalty Tiers ---
        // Simplified assumption: 60% Bronze, 30% Silver, 10% Gold
        const memberDistribution = {
            bronze: members * 0.6,
            silver: members * 0.3,
            gold: members * 0.1,
        };

        const weightedCommissionShare = 
            (memberDistribution.bronze * loyaltyTierShares.bronze) +
            (memberDistribution.silver * loyaltyTierShares.silver) +
            (memberDistribution.gold * loyaltyTierShares.gold);
            
        const memberCommission = mallRevenue * (weightedCommissionShare / members);

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
