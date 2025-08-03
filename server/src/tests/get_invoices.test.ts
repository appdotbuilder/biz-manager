
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable, customersTable } from '../db/schema';
import { type CreateInvoiceInput, type CreateCustomerInput } from '../schema';
import { getInvoices } from '../handlers/get_invoices';

describe('getInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no invoices exist', async () => {
    const result = await getInvoices();
    expect(result).toEqual([]);
  });

  it('should return all invoices', async () => {
    // Create a customer first (required for invoice)
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test invoices
    const invoiceData = [
      {
        invoice_number: 'INV-001',
        order_id: null,
        customer_id: customerId,
        amount: '100.00',
        tax_amount: '10.00',
        total_amount: '110.00',
        payment_status: 'pending' as const,
        issue_date: new Date('2024-01-01'),
        due_date: new Date('2024-01-31')
      },
      {
        invoice_number: 'INV-002',
        order_id: null,
        customer_id: customerId,
        amount: '200.50',
        tax_amount: '20.05',
        total_amount: '220.55',
        payment_status: 'paid' as const,
        issue_date: new Date('2024-01-02'),
        due_date: new Date('2024-02-01')
      }
    ];

    await db.insert(invoicesTable)
      .values(invoiceData)
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(2);

    // Verify first invoice
    const invoice1 = result.find(inv => inv.invoice_number === 'INV-001');
    expect(invoice1).toBeDefined();
    expect(invoice1!.customer_id).toEqual(customerId);
    expect(invoice1!.amount).toEqual(100.00);
    expect(invoice1!.tax_amount).toEqual(10.00);
    expect(invoice1!.total_amount).toEqual(110.00);
    expect(invoice1!.payment_status).toEqual('pending');
    expect(invoice1!.issue_date).toBeInstanceOf(Date);
    expect(invoice1!.due_date).toBeInstanceOf(Date);
    expect(invoice1!.created_at).toBeInstanceOf(Date);

    // Verify second invoice
    const invoice2 = result.find(inv => inv.invoice_number === 'INV-002');
    expect(invoice2).toBeDefined();
    expect(invoice2!.amount).toEqual(200.50);
    expect(invoice2!.tax_amount).toEqual(20.05);
    expect(invoice2!.total_amount).toEqual(220.55);
    expect(invoice2!.payment_status).toEqual('paid');

    // Verify numeric type conversions
    result.forEach(invoice => {
      expect(typeof invoice.amount).toBe('number');
      expect(typeof invoice.tax_amount).toBe('number');
      expect(typeof invoice.total_amount).toBe('number');
    });
  });

  it('should handle invoices with different payment statuses', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create invoices with different statuses
    const invoiceData = [
      {
        invoice_number: 'INV-PENDING',
        order_id: null,
        customer_id: customerId,
        amount: '50.00',
        tax_amount: '5.00',
        total_amount: '55.00',
        payment_status: 'pending' as const,
        issue_date: new Date(),
        due_date: new Date()
      },
      {
        invoice_number: 'INV-OVERDUE',
        order_id: null,
        customer_id: customerId,
        amount: '75.25',
        tax_amount: '7.53',
        total_amount: '82.78',
        payment_status: 'overdue' as const,
        issue_date: new Date(),
        due_date: new Date()
      },
      {
        invoice_number: 'INV-CANCELLED',
        order_id: null,
        customer_id: customerId,
        amount: '25.99',
        tax_amount: '2.60',
        total_amount: '28.59',
        payment_status: 'cancelled' as const,
        issue_date: new Date(),
        due_date: new Date()
      }
    ];

    await db.insert(invoicesTable)
      .values(invoiceData)
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(3);

    const statuses = result.map(inv => inv.payment_status).sort();
    expect(statuses).toEqual(['cancelled', 'overdue', 'pending']);

    // Verify all numeric conversions work correctly
    result.forEach(invoice => {
      expect(typeof invoice.amount).toBe('number');
      expect(typeof invoice.tax_amount).toBe('number');
      expect(typeof invoice.total_amount).toBe('number');
      expect(invoice.amount).toBeGreaterThan(0);
      expect(invoice.tax_amount).toBeGreaterThanOrEqual(0);
      expect(invoice.total_amount).toBeGreaterThan(0);
    });
  });
});
