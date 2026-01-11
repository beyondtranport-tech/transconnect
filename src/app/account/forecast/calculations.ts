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

export function budgetLogic(roadmapData: any[], budgetData: any, targets: any) {
    if (!budgetData || !budgetData.budgetInputs) return [];
    
    const { budgetInputs } = budgetData;
    const forecastData = [];

    // Simplified Loyalty Tier Commission Shares
    const loyaltyTierShares = { bronze: 0.10, silver: 0.15, gold: 0.20 };

    for (let i = 0; i < roadmapData.length; i++) {
        const row = roadmapData[i];
        const members = row.cumulativeMembers;

        // Get adoption rates for the current month
        const rewardsAdoption = (targets?.monthlyTargets?.rewardsPlans?.[i] || 0) / 100;
        const loyaltyAdoption = (targets?.monthlyTargets?.loyaltyPlans?.[i] || 0) / 100;
        const actionsAdoption = (targets?.monthlyTargets?.actionPlans?.[i] || 0) / 100;

        // Get monthly plan prices and other revenue inputs
        const rewardsPrice = budgetInputs.revenue.avgConnectPlanFee[i];
        const loyaltyPrice = budgetInputs.revenue.avgConnectPlanFee[i];
        const actionsPrice = budgetInputs.revenue.avgConnectPlanFee[i];
        const membershipFee = budgetInputs.revenue.membershipFees[i];
        const mallSpend = budgetInputs.revenue.avgMallSpendPerMember[i];
        const mallCommissionRate = budgetInputs.revenue.mallCommissionRate[i] / 100;
        const techAdoption = budgetInputs.revenue.techServicesAdoptionRate[i] / 100;
        const techSpend = budgetInputs.revenue.avgTechSpendPerMember[i];
        
        // Calculate revenue from each Connect Plan
        const rewardsRevenue = members * rewardsAdoption * rewardsPrice;
        const loyaltyRevenue = members * loyaltyAdoption * loyaltyPrice;
        const actionsRevenue = members * actionsAdoption * actionsPrice;
        const connectPlanRevenue = rewardsRevenue + loyaltyRevenue + actionsRevenue;
        
        // Total Revenue Calculation
        const membershipRevenue = members * membershipFee;
        const mallRevenue = members * mallSpend * mallCommissionRate;
        const techRevenue = members * techAdoption * techSpend;
        const totalRevenue = membershipRevenue + connectPlanRevenue + mallRevenue + techRevenue;

        // --- COGS Calculation with Loyalty Tiers ---
        const memberDistribution = { bronze: members * 0.6, silver: members * 0.3, gold: members * 0.1 };
        const weightedCommissionShare = 
            (memberDistribution.bronze * loyaltyTierShares.bronze) +
            (memberDistribution.silver * loyaltyTierShares.silver) +
            (memberDistribution.gold * loyaltyTierShares.gold);
            
        const memberCommission = mallRevenue * (members > 0 ? (weightedCommissionShare / members) : 0);
        const isaCommission = totalRevenue * (budgetInputs.cogs.isaCommissionRate[i] / 100);
        const totalCogs = memberCommission + isaCommission;

        const grossProfit = totalRevenue - totalCogs;
        
        // OPEX Calculation
        const opexSalaries = budgetInputs.opexSalaries.reduce((sum: number, role: any) => {
            const countForMonth = role.monthlyHeadcount?.[i] || 0;
            const salaryForMonth = role.monthlySalary?.[i] || 0;
            return sum + (countForMonth * salaryForMonth);
        }, 0);
        
        const opexOtherThisMonth: {[key: string]: number} = {};
        Object.keys(budgetInputs.opexOther).forEach(key => {
            opexOtherThisMonth[key] = budgetInputs.opexOther[key][i];
        });
        const totalOpexOther = Object.values(opexOtherThisMonth).reduce((sum: number, value: any) => sum + Number(value), 0);
        const totalOpex = opexSalaries + totalOpexOther;
        
        const netProfit = grossProfit - totalOpex;

        forecastData.push({
            month: row.month,
            year: row.year,
            members: members,
            
            membershipRevenue,
            connectPlanRevenue,
            mallRevenue,
            techRevenue,
            totalRevenue,

            memberCommission,
            isaCommission,
            totalCogs,

            grossProfit,

            opexSalaries,
            ...opexOtherThisMonth,
            totalOpex,

            netProfit,
        });
    }

    return forecastData;
}
