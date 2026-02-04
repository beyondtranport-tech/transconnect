
'use client';

interface ForecastInputs {
    membersPerMonth: number;
    projectionPeriod: number;
    membershipFee: number;
    avgSpendPerMember: number;
    platformDiscount: number;
    opexPerMonth: number;
}

interface MonthlyData {
    month: number;
    newMembers: number;
    cumulativeMembers: number;
    membershipRevenue: number;
    mallRevenue: number;
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
}

export function calculateInvestorForecast(inputs: ForecastInputs): MonthlyData[] {
    const forecast: MonthlyData[] = [];
    let cumulativeMembers = 0;

    for (let i = 1; i <= inputs.projectionPeriod; i++) {
        cumulativeMembers += inputs.membersPerMonth;

        const membershipRevenue = cumulativeMembers * inputs.membershipFee;
        const mallTurnover = cumulativeMembers * inputs.avgSpendPerMember;
        const mallRevenue = mallTurnover * (inputs.platformDiscount / 100);

        const totalRevenue = membershipRevenue + mallRevenue;
        const totalCosts = inputs.opexPerMonth; // Simplified for this model
        const netProfit = totalRevenue - totalCosts;
        
        forecast.push({
            month: i,
            newMembers: inputs.membersPerMonth,
            cumulativeMembers,
            membershipRevenue,
            mallRevenue,
            totalRevenue,
            totalCosts,
            netProfit,
        });
    }

    return forecast;
}
