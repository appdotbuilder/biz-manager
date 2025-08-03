
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice } from '../schema';

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const results = await db.select()
      .from(invoicesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(invoice => ({
      ...invoice,
      amount: parseFloat(invoice.amount),
      tax_amount: parseFloat(invoice.tax_amount),
      total_amount: parseFloat(invoice.total_amount)
    }));
  } catch (error) {
    console.error('Fetching invoices failed:', error);
    throw error;
  }
};
