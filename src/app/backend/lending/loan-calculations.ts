'use client';

export interface MonthlyPayment {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
}

/**
 * Generates an amortization schedule for a standard loan.
 * @param principal The initial loan amount.
 * @param annualRate The annual interest rate (as a percentage, e.g., 15 for 15%).
 * @param termInMonths The total number of months for the loan.
 * @returns An array of monthly payment details.
 */
export function generateAmortizationSchedule(principal: number, annualRate: number, termInMonths: number): MonthlyPayment[] {
    if (principal <= 0 || termInMonths <= 0) {
        return [];
    }

    const monthlyRate = annualRate / 100 / 12;
    const schedule: MonthlyPayment[] = [];
    let remainingBalance = principal;

    // Handle interest-only or zero-interest cases if monthlyRate is 0
    if (monthlyRate === 0) {
        const monthlyPayment = principal / termInMonths;
        for (let i = 1; i <= termInMonths; i++) {
            remainingBalance -= monthlyPayment;
            schedule.push({
                month: i,
                payment: monthlyPayment,
                principal: monthlyPayment,
                interest: 0,
                remainingBalance: remainingBalance < 0.01 ? 0 : remainingBalance, // handle floating point inaccuracies
            });
        }
        return schedule;
    }

    // Calculate monthly payment (PMT)
    const pmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / (Math.pow(1 + monthlyRate, termInMonths) - 1);
    
    for (let i = 1; i <= termInMonths; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = pmt - interestPayment;
        remainingBalance -= principalPayment;

        schedule.push({
            month: i,
            payment: pmt,
            principal: principalPayment,
            interest: interestPayment,
            remainingBalance: remainingBalance < 0.01 ? 0 : remainingBalance,
        });
    }

    return schedule;
}
