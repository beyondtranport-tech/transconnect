
'use client';

export interface MonthlyPayment {
    month: number;
    date: Date;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
    capitalPaid: number;
    interestPaid: number;
    totalPaid: number;
    totalBalanceOwed: number;
}

/**
 * Generates an amortization schedule for a standard loan.
 * @param principal The initial loan amount.
 * @param annualRate The annual interest rate (as a percentage, e.g., 15 for 15%).
 * @param termInMonths The total number of months for the loan.
 * @param firstInstallmentDateStr The date of the first payment as a string.
 * @param paymentsInAdvance Whether payments are made at the beginning (advance) or end (arrears) of the period.
 * @returns An array of monthly payment details.
 */
export function generateAmortizationSchedule(
    principal: number, 
    annualRate: number, 
    termInMonths: number,
    firstInstallmentDateStr?: string,
    paymentsInAdvance?: boolean
): MonthlyPayment[] {
    if (principal <= 0 || termInMonths <= 0) {
        return [];
    }
    
    // Use a default date if the string is invalid or empty
    const firstPaymentDate = new Date(firstInstallmentDateStr || new Date());
    if (isNaN(firstPaymentDate.getTime())) {
        return [];
    }

    const monthlyRate = annualRate / 100 / 12;
    const schedule: MonthlyPayment[] = [];
    let remainingBalance = principal;

    let pmt = 0;
    if (monthlyRate > 0) {
        // Standard formula for payments in arrears
        pmt = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termInMonths));
        if (paymentsInAdvance) {
            // Adjust payment if in advance
            pmt = pmt / (1 + monthlyRate);
        }
    } else {
        pmt = principal / termInMonths;
    }

    const totalRepayment = pmt * termInMonths;
    const totalInterest = totalRepayment - principal;
    
    let cumulativeCapitalPaid = 0;
    let cumulativeInterestPaid = 0;

    for (let i = 1; i <= termInMonths; i++) {
        // The date for this installment
        const paymentDate = new Date(firstPaymentDate);
        paymentDate.setMonth(paymentDate.getMonth() + (i - 1));

        // Interest calculation depends on advance/arrears
        const interestPayment = paymentsInAdvance && i === 1 
            ? 0 // No interest on the first payment if in advance
            : remainingBalance * monthlyRate;

        const principalPayment = pmt - interestPayment;
        remainingBalance -= principalPayment;
        
        cumulativeCapitalPaid += principalPayment;
        cumulativeInterestPaid += interestPayment;

        const totalPaid = cumulativeCapitalPaid + cumulativeInterestPaid;
        const remainingInterest = totalInterest - cumulativeInterestPaid;
        const totalBalanceOwed = remainingBalance + remainingInterest;

        schedule.push({
            month: i,
            date: paymentDate,
            payment: pmt,
            principal: principalPayment,
            interest: interestPayment,
            remainingBalance: remainingBalance < 0.01 ? 0 : remainingBalance,
            capitalPaid: cumulativeCapitalPaid,
            interestPaid: cumulativeInterestPaid,
            totalPaid: totalPaid,
            totalBalanceOwed: totalBalanceOwed < 0.01 ? 0 : totalBalanceOwed,
        });
    }

    return schedule;
}

    