
import { db } from '../db';
import { transactionsTable, invoicesTable } from '../db/schema';
import { eq, and, sum } from 'drizzle-orm';

export interface FinancialSummary {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    pendingInvoices: number;
    overdueInvoices: number;
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
    try {
        // Get total income from transactions
        const incomeResult = await db.select({
            total: sum(transactionsTable.amount)
        })
        .from(transactionsTable)
        .where(eq(transactionsTable.type, 'income'))
        .execute();

        // Get total expenses from transactions
        const expenseResult = await db.select({
            total: sum(transactionsTable.amount)
        })
        .from(transactionsTable)
        .where(eq(transactionsTable.type, 'expense'))
        .execute();

        // Get pending invoices total
        const pendingInvoicesResult = await db.select({
            total: sum(invoicesTable.total_amount)
        })
        .from(invoicesTable)
        .where(eq(invoicesTable.payment_status, 'pending'))
        .execute();

        // Get overdue invoices total
        const overdueInvoicesResult = await db.select({
            total: sum(invoicesTable.total_amount)
        })
        .from(invoicesTable)
        .where(eq(invoicesTable.payment_status, 'overdue'))
        .execute();

        // Convert numeric results to numbers (handling null cases)
        const totalIncome = incomeResult[0]?.total ? parseFloat(incomeResult[0].total) : 0;
        const totalExpenses = expenseResult[0]?.total ? parseFloat(expenseResult[0].total) : 0;
        const pendingInvoices = pendingInvoicesResult[0]?.total ? parseFloat(pendingInvoicesResult[0].total) : 0;
        const overdueInvoices = overdueInvoicesResult[0]?.total ? parseFloat(overdueInvoicesResult[0].total) : 0;

        return {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            pendingInvoices,
            overdueInvoices
        };
    } catch (error) {
        console.error('Financial summary calculation failed:', error);
        throw error;
    }
}
