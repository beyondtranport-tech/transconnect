
export interface MonthlyPayment {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
}

export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    termInMonths: number,
    startDateStr?: string,
    firstPaymentDateStr?: string,
    paymentsInAdvance: boolean = false
): MonthlyPayment[] {
    if (principal <= 0 || annualRate < 0 || termInMonths <= 0) {
        return [];
    }

    const monthlyRate = annualRate / 100 / 12;
    let balance = principal;
    const schedule: MonthlyPayment[] = [];

    if (monthlyRate === 0) {
        const payment = principal / termInMonths;
        for (let i = 1; i <= termInMonths; i++) {
            balance -= payment;
            schedule.push({
                month: i,
                payment: payment,
                principal: payment,
                interest: 0,
                remainingBalance: balance < 0.01 ? 0 : balance,
            });
        }
        return schedule;
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / (Math.pow(1 + monthlyRate, termInMonths) - 1);

    for (let i = 1; i <= termInMonths; i++) {
        const interest = balance * monthlyRate;
        const principalPaid = monthlyPayment - interest;
        balance -= principalPaid;

        schedule.push({
            month: i,
            payment: monthlyPayment,
            principal: principalPaid,
            interest: interest,
            remainingBalance: balance < 0.01 ? 0 : balance,
        });
    }

    return schedule;
}
