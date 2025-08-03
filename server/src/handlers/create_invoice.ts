
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type CreateInvoiceInput, type Invoice } from '../schema';

export const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice> => {
  try {
    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Calculate total amount
    const totalAmount = input.amount + input.tax_amount;
    
    // Set issue date to now if not provided
    const issueDate = input.issue_date || new Date();
    
    // Insert invoice record
    const result = await db.insert(invoicesTable)
      .values({
        invoice_number: invoiceNumber,
        order_id: input.order_id,
        customer_id: input.customer_id,
        amount: input.amount.toString(),
        tax_amount: input.tax_amount.toString(),
        total_amount: totalAmount.toString(),
        payment_status: 'pending',
        issue_date: issueDate,
        due_date: input.due_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const invoice = result[0];
    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
      tax_amount: parseFloat(invoice.tax_amount),
      total_amount: parseFloat(invoice.total_amount)
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    throw error;
  }
};
