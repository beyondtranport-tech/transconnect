// This file is no longer used and will be removed.
// The functionality has been moved to dedicated, secure API routes.
// Keeping it temporarily to avoid breaking imports, but it should be deleted.
'use server';

export async function getMembers() {
  return { success: false, error: 'This function is deprecated.' };
}
export async function getMemberById(memberId: string) {
    return { success: false, error: 'This function is deprecated.' };
}
export async function getFinanceApplications() {
    return { success: false, error: 'This function is deprecated.' };
}
export async function deleteFinanceApplication(memberId: string, applicationId: string, type: 'quote' | 'enquiry' | 'walletPayment') {
    return { success: false, error: 'This function is deprecated.' };
}
export async function getContributions() {
    return { success: false, error: 'This function is deprecated.' };
}
export async function getShops() {
    return { success: false, error: 'This function is deprecated.' };
}
export async function approveShop(shopId: string, ownerId: string) {
    return { success: false, error: 'This function is deprecated.' };
}
export async function getAllTransactions() {
    return { success: false, error: 'This function is deprecated.' };
}
export async function deleteTransaction(memberId: string, transactionId: string) {
    return { success: false, error: 'This function is deprecated.' };
}
export async function getMemberFundingRecords(memberId: string) {
    return { success: false, error: 'This function is deprecated.' };
}
export async function getMemberWalletPayments(memberId: string) {
    return { success: false, error: 'This function is deprecated.' };
}