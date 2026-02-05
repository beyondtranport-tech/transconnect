'use client';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function salesRoadmapLogic(settings: any, roadmapInputs: any) {
    if (!roadmapInputs || !roadmapInputs.monthlyAssumptions || !settings) {
        return {
            powerPartnerProjection: [],
            isaProjection: [],
            totalProjection: [],
        };
    }

    const { monthlyAssumptions } = roadmapInputs;
    const { forecastMonths, startYear, startMonth } = settings;

    // --- Power Partner Projections ---
    const powerPartnerProjection: any[] = [];
    const initialPartners = Number(monthlyAssumptions.numberOfPowerPartners?.[0] || 0); // Use the initial value as a constant number of partners
    let cumulativePartnerOpps = 0;
    let cumulativePartnerMembers = 0;

    for (let i = 0; i < forecastMonths; i++) {
        const date = new Date(startYear, startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        const oppsPerPartner = Number(monthlyAssumptions.opportunitiesPerPartner?.[i] || 0);
        const conversionRate = Number(monthlyAssumptions.powerPartnerConversion?.[i] || 0) / 100;
        
        // Correct logic: The constant number of partners generates new opportunities each month.
        const newOpportunities = initialPartners * oppsPerPartner;
        cumulativePartnerOpps += newOpportunities;
        
        // New members are converted from this month's new opportunities.
        const newMembers = Math.round(newOpportunities * conversionRate);
        cumulativePartnerMembers += newMembers;

        powerPartnerProjection.push({
            month: `${month} ${year}`,
            partners: initialPartners,
            oppsPerPartner,
            newOpportunities,
            cumulativeOpportunities: cumulativePartnerOpps,
            conversionRate: conversionRate * 100, // Display as percentage
            newMembers,
            cumulativeMembers: cumulativePartnerMembers,
        });
    }

    // --- ISA Projections ---
    const isaProjection: any[] = [];
    const initialIsas = Number(monthlyAssumptions.initialMembersIsaAgents?.[0] || 0); // Use the initial value as a constant number of ISAs
    let cumulativeIsaReferrals = 0;
    let cumulativeIsaMembers = 0;

    for (let i = 0; i < forecastMonths; i++) {
        const date = new Date(startYear, startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        const referralsPerIsa = Number(monthlyAssumptions.referralsPerMemberIsaAgents?.[i] || 0);
        const conversionRate = Number(monthlyAssumptions.conversionToMemberIsaAgents?.[i] || 0) / 100;
        
        // Correct logic: The constant number of ISAs generates new referrals each month.
        const newReferrals = initialIsas * referralsPerIsa;
        cumulativeIsaReferrals += newReferrals;

        // New members are converted from this month's new referrals.
        const newMembers = Math.round(newReferrals * conversionRate);
        cumulativeIsaMembers += newMembers;

        isaProjection.push({
            month: `${month} ${year}`,
            isas: initialIsas,
            referralsPerIsa,
            newReferrals,
            cumulativeReferrals: cumulativeIsaReferrals,
            conversionRate: conversionRate * 100,
            newMembers,
            cumulativeMembers: cumulativeIsaMembers,
        });
    }
    
    // --- Total Member Projection (combined) ---
    const totalProjection: any[] = [];
    let cumulativeTotalMembers = 0;
    for (let i=0; i<forecastMonths; i++) {
        const ppNew = powerPartnerProjection[i]?.newMembers || 0;
        const isaNew = isaProjection[i]?.newMembers || 0;
        
        const totalNewThisMonth = ppNew + isaNew;
        cumulativeTotalMembers += totalNewThisMonth;

        totalProjection.push({
            month: powerPartnerProjection[i].month,
            year: new Date(startYear, startMonth + i, 1).getFullYear(),
            powerPartnerNewMembers: ppNew,
            isaNewMembers: isaNew,
            totalNewMembers: totalNewThisMonth,
            cumulativeMembers: cumulativeTotalMembers
        });
    }


    return {
        powerPartnerProjection,
        isaProjection,
        totalProjection,
    };
}


export function budgetLogic(roadmapData: any[], budgetData: any, targets: any) {
    if (!roadmapData || roadmapData.length === 0 || !budgetData || !budgetData.budgetInputs || !targets || !targets.monthlyTargets) return [];
    
    const { budgetInputs } = budgetData;
    const { monthlyTargets } = targets;
    const forecastData = [];

    const loyaltyTierShares = { bronze: 0.10, silver: 0.15, gold: 0.20 };
    
    const forecastMonths = roadmapData.length;

    for (let i = 0; i < forecastMonths; i++) {
        const { month, year } = roadmapData[i];
        
        const members = roadmapData[i]?.cumulativeMembers || 0;

        const rewardsAdoptionCount = monthlyTargets.rewardsPlans?.[i] || 0;
        const loyaltyAdoptionCount = monthlyTargets.loyaltyPlans?.[i] || 0;
        const actionsAdoptionCount = monthlyTargets.actionPlans?.[i] || 0;

        const rewardsPrice = budgetInputs.revenue.avgConnectPlanFee[i];
        const loyaltyPrice = budgetInputs.revenue.avgConnectPlanFee[i];
        const actionsPrice = budgetInputs.revenue.avgConnectPlanFee[i];
        const membershipFee = budgetInputs.revenue.membershipFees[i];
        const mallSpend = budgetInputs.revenue.avgMallSpendPerMember[i];
        const mallCommissionRate = budgetInputs.revenue.mallCommissionRate[i] / 100;
        const techAdoption = budgetInputs.revenue.techServicesAdoptionRate[i] / 100;
        const techSpend = budgetInputs.revenue.avgTechSpendPerMember[i];
        
        const rewardsRevenue = rewardsAdoptionCount * rewardsPrice;
        const loyaltyRevenue = loyaltyAdoptionCount * loyaltyPrice;
        const actionsRevenue = actionsAdoptionCount * actionsPrice;
        const connectPlanRevenue = rewardsRevenue + loyaltyRevenue + actionsRevenue;
        
        const membershipRevenue = members * membershipFee;
        const mallRevenue = members * mallSpend * mallCommissionRate;
        const techRevenue = members * techAdoption * techSpend;
        const totalRevenue = membershipRevenue + connectPlanRevenue + mallRevenue + techRevenue;

        const memberDistribution = { bronze: members * 0.6, silver: members * 0.3, gold: members * 0.1 };
        const weightedCommissionShare = 
            (memberDistribution.bronze * loyaltyTierShares.bronze) +
            (memberDistribution.silver * loyaltyTierShares.silver) +
            (memberDistribution.gold * loyaltyTierShares.gold);
            
        const memberCommission = mallRevenue * (members > 0 ? (weightedCommissionShare / members) : 0);
        const isaCommission = totalRevenue * (budgetInputs.cogs.isaCommissionRate[i] / 100);
        const totalCogs = memberCommission + isaCommission;

        const grossProfit = totalRevenue - totalCogs;
        
        const opexSalaries = budgetData.opexSalaries.reduce((sum: number, role: any) => {
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
            month,
            year,
            members,
            
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
