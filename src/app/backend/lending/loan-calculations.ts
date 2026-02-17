
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
 * Generates an amortization schedule for a standard loan with an optional balloon/residual payment.
 * @param principal The initial loan amount.
 * @param annualRate The annual interest rate (as a percentage, e.g., 15 for 15%).
 * @param termInMonths The total number of months for the loan.
 * @param firstInstallmentDateStr The date of the first payment as a string.
 * @param paymentsInAdvance Whether payments are made at the beginning (advance) or end (arrears) of the period.
 * @param residualValue The final balloon payment amount.
 * @returns An array of monthly payment details.
 */
export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    termInMonths: number,
    firstInstallmentDateStr?: string,
    paymentsInAdvance?: boolean,
    residualValue?: number
): MonthlyPayment[] {
    if (principal <= 0 || termInMonths <= 0) {
        return [];
    }
    
    const firstPaymentDate = new Date(firstInstallmentDateStr || new Date());
    if (isNaN(firstPaymentDate.getTime())) {
        return [];
    }

    const monthlyRate = annualRate / 100 / 12;
    const schedule: MonthlyPayment[] = [];
    let remainingBalance = principal;
    const balloon = residualValue || 0;

    let pmt = 0;
    if (monthlyRate > 0) {
        const factor = Math.pow(1 + monthlyRate, termInMonths);
        if (factor !== 1) {
            // Standard formula for a loan with a balloon payment
            pmt = (principal * monthlyRate - (balloon * monthlyRate) / factor) / (1 - (1 / factor));
        } else {
             pmt = (principal - balloon) / termInMonths;
        }
    } else {
        pmt = (principal - balloon) / termInMonths;
    }
    
    let cumulativeCapitalPaid = 0;
    let cumulativeInterestPaid = 0;

    for (let i = 1; i <= termInMonths; i++) {
        const paymentDate = new Date(firstPaymentDate);
        paymentDate.setMonth(paymentDate.getMonth() + (i - 1));
        
        const interestPayment = remainingBalance * monthlyRate;
        
        let principalPayment;
        let actualPayment;

        if (i === termInMonths) {
            // The final payment must clear the remaining balance to zero.
            principalPayment = remainingBalance;
            actualPayment = principalPayment + interestPayment;
        } else {
            principalPayment = pmt - interestPayment;
            actualPayment = pmt;
        }

        remainingBalance -= principalPayment;
        
        cumulativeCapitalPaid += principalPayment;
        cumulativeInterestPaid += interestPayment;

        schedule.push({
            month: i,
            date: paymentDate,
            payment: actualPayment,
            principal: principalPayment,
            interest: interestPayment,
            remainingBalance: remainingBalance < 0.01 ? 0 : remainingBalance,
            capitalPaid: cumulativeCapitalPaid,
            interestPaid: cumulativeInterestPaid,
            totalPaid: cumulativeCapitalPaid + cumulativeInterestPaid,
            totalBalanceOwed: remainingBalance, // Simplified.
        });
    }

    return schedule;
}
