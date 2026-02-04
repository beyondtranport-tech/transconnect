
'use client';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// This function is corrected to use the right logic for sales projections.
export function salesRoadmapLogic(settings: any, roadmapInputs: any) {
    if (!roadmapInputs || !roadmapInputs.monthlyAssumptions || !settings) {
        return [];
    }

    const monthlyAssumptions = roadmapInputs.monthlyAssumptions;
    const { forecastMonths, startYear, startMonth } = settings;
    
    const memberRoleGroups = [
        { role: 'Vendors', id: 'Vendors' },
        { role: 'Buyers', id: 'Buyers' },
        { role: 'Associates', id: 'Associates' },
        { role: 'ISA Agents', id: 'IsaAgents' },
        { role: 'Drivers', id: 'Drivers' },
        { role: 'Developers', id: 'Developers' }
    ];

    let byRoleProjections: { [key: string]: any[] } = {};

    memberRoleGroups.forEach(group => {
        const roleKey = group.role;
        const roleId = group.id;
        byRoleProjections[roleKey] = [];
        
        const initialMembers = Number(monthlyAssumptions[`initialMembers${roleId}`]?.[0]) || 0;
        let cumulativeForRole = initialMembers;
        
        const referralsArray = monthlyAssumptions[`referralsPerMember${roleId}`] || [];
        const conversionArray = monthlyAssumptions[`conversionToMember${roleId}`] || [];

        for (let i = 0; i < forecastMonths; i++) {
            const date = new Date(startYear, startMonth + i, 1);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            const referralsPerMember = Number(referralsArray[i]) || 0;
            const conversionToMember = (Number(conversionArray[i]) || 0) / 100;
            const newMembersThisMonth = Math.round(cumulativeForRole * referralsPerMember * conversionToMember);
            cumulativeForRole += newMembersThisMonth;
            byRoleProjections[roleKey].push({
                month: `${month} ${year}`,
                newMembers: newMembersThisMonth,
                cumulativeMembers: cumulativeForRole,
            });
        }
    });

    let totalProjection: any[] = [];
    const initialTotalMembers = memberRoleGroups.reduce((acc, group) => {
        const roleId = group.id;
        return acc + (Number(monthlyAssumptions[`initialMembers${roleId}`]?.[0]) || 0);
    }, 0);
    
    let cumulativeTotal = initialTotalMembers;

    for (let i = 0; i < forecastMonths; i++) {
        const date = new Date(startYear, startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        let newMembersFromRoles = 0;
        memberRoleGroups.forEach(group => {
            const roleKey = group.role;
            const projectionForMonth = byRoleProjections[roleKey][i];
            if (projectionForMonth) {
                newMembersFromRoles += projectionForMonth.newMembers;
            }
        });
        
        const powerPartnerConversionForMonth = (Number(monthlyAssumptions.powerPartnerConversion?.[i]) || 0) / 100;
        const powerPartnerNewMembers = Math.round(
            (Number(monthlyAssumptions.numberOfPowerPartners?.[i]) || 0) *
            (Number(monthlyAssumptions.opportunitiesPerPartner?.[i]) || 0) *
            powerPartnerConversionForMonth
        );

        const totalNewThisMonth = newMembersFromRoles + powerPartnerNewMembers;
        cumulativeTotal += totalNewThisMonth;
        
        totalProjection.push({
            month: `${month} ${year}`,
            year,
            powerPartnerNewMembers: powerPartnerNewMembers,
            referralNewMembers: newMembersFromRoles,
            totalNewMembers: totalNewThisMonth,
            cumulativeMembers: cumulativeTotal,
        });
    }

    return totalProjection;
};


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
