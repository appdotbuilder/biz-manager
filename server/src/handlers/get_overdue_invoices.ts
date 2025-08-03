
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice } from '../schema';
import { and, lt, ne, sql } from 'drizzle-orm';

export async function getOverdueInvoices(): Promise<Invoice[]> {
  try {
    // Get current date for comparison
    const currentDate = new Date();
    
    // Query invoices that are past due date and not paid
    const results = await db.select()
      .from(invoicesTable)
      .where(
        and(
          lt(invoicesTable.due_date, currentDate), // Past due date
          ne(invoicesTable.payment_status, 'paid') // Not paid
        )
      )
      .execute();

    // Convert numeric fields back to numbers
    return results.map(invoice => ({
      ...invoice,
      amount: parseFloat(invoice.amount),
      tax_amount: parseFloat(invoice.tax_amount),
      total_amount: parseFloat(invoice.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch overdue invoices:', error);
    throw error;
  }
}
