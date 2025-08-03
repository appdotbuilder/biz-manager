
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable, customersTable } from '../db/schema';
import { type CreateInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateInvoiceInput = {
  order_id: null,
  customer_id: 1,
  amount: 100.50,
  tax_amount: 10.05,
  due_date: new Date('2024-02-01'),
  issue_date: new Date('2024-01-01')
};

describe('createInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an invoice with all fields', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .execute();

    const result = await createInvoice(testInput);

    // Basic field validation
    expect(result.order_id).toBeNull();
    expect(result.customer_id).toEqual(1);
    expect(result.amount).toEqual(100.50);
    expect(result.tax_amount).toEqual(10.05);
    expect(result.total_amount).toEqual(110.55); // amount + tax_amount
    expect(result.payment_status).toEqual('pending');
    expect(result.issue_date).toEqual(testInput.issue_date!);
    expect(result.due_date).toEqual(testInput.due_date);
    expect(result.id).toBeDefined();
    expect(result.invoice_number).toMatch(/^INV-\d+-\d+$/);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save invoice to database', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .execute();

    const result = await createInvoice(testInput);

    // Query using proper drizzle syntax
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].customer_id).toEqual(1);
    expect(parseFloat(invoices[0].amount)).toEqual(100.50);
    expect(parseFloat(invoices[0].tax_amount)).toEqual(10.05);
    expect(parseFloat(invoices[0].total_amount)).toEqual(110.55);
    expect(invoices[0].payment_status).toEqual('pending');
    expect(invoices[0].created_at).toBeInstanceOf(Date);
  });

  it('should use current date as issue_date when not provided', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .execute();

    const inputWithoutIssueDate = {
      order_id: null,
      customer_id: 1,
      amount: 100.50,
      tax_amount: 10.05,
      due_date: new Date('2024-02-01')
      // issue_date omitted to test default behavior
    } as CreateInvoiceInput;

    const result = await createInvoice(inputWithoutIssueDate);

    // Should use current date (within reasonable time)
    const now = new Date();
    const timeDiff = Math.abs(result.issue_date.getTime() - now.getTime());
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
  });

  it('should generate unique invoice numbers', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .execute();

    const result1 = await createInvoice(testInput);
    const result2 = await createInvoice(testInput);

    expect(result1.invoice_number).not.toEqual(result2.invoice_number);
    expect(result1.invoice_number).toMatch(/^INV-\d+-\d+$/);
    expect(result2.invoice_number).toMatch(/^INV-\d+-\d+$/);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create prerequisite customer
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .execute();

    const result = await createInvoice(testInput);

    // Verify all numeric fields are returned as numbers
    expect(typeof result.amount).toBe('number');
    expect(typeof result.tax_amount).toBe('number');
    expect(typeof result.total_amount).toBe('number');
    expect(result.total_amount).toEqual(result.amount + result.tax_amount);
  });
});
