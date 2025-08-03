
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable } from '../db/schema';
import { getOverdueInvoices } from '../handlers/get_overdue_invoices';

describe('getOverdueInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no overdue invoices exist', async () => {
    const result = await getOverdueInvoices();
    expect(result).toEqual([]);
  });

  it('should return overdue unpaid invoices', async () => {
    // Create test customer
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

    // Create overdue invoice (due 5 days ago, pending status)
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 5);

    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - 10);

    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        order_id: null,
        customer_id: customerId,
        amount: '100.00',
        tax_amount: '10.00',
        total_amount: '110.00',
        payment_status: 'pending',
        issue_date: issueDate,
        due_date: pastDueDate
      })
      .execute();

    const result = await getOverdueInvoices();

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].payment_status).toEqual('pending');
    expect(result[0].amount).toEqual(100.00);
    expect(result[0].tax_amount).toEqual(10.00);
    expect(result[0].total_amount).toEqual(110.00);
    expect(typeof result[0].amount).toEqual('number');
    expect(typeof result[0].tax_amount).toEqual('number');
    expect(typeof result[0].total_amount).toEqual('number');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].due_date < new Date()).toBe(true);
  });

  it('should not return paid invoices even if overdue', async () => {
    // Create test customer
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

    // Create overdue but paid invoice
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 5);

    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - 10);

    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        order_id: null,
        customer_id: customerId,
        amount: '200.00',
        tax_amount: '20.00',
        total_amount: '220.00',
        payment_status: 'paid',
        issue_date: issueDate,
        due_date: pastDueDate
      })
      .execute();

    const result = await getOverdueInvoices();

    expect(result).toHaveLength(0);
  });

  it('should not return future invoices even if unpaid', async () => {
    // Create test customer
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

    // Create future invoice (due in 5 days, pending status)
    const futureDueDate = new Date();
    futureDueDate.setDate(futureDueDate.getDate() + 5);

    const issueDate = new Date();

    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-003',
        order_id: null,
        customer_id: customerId,
        amount: '300.00',
        tax_amount: '30.00',
        total_amount: '330.00',
        payment_status: 'pending',
        issue_date: issueDate,
        due_date: futureDueDate
      })
      .execute();

    const result = await getOverdueInvoices();

    expect(result).toHaveLength(0);
  });

  it('should return multiple overdue invoices with different statuses', async () => {
    // Create test customer
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

    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 3);

    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - 8);

    // Create pending overdue invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-004',
        order_id: null,
        customer_id: customerId,
        amount: '150.00',
        tax_amount: '15.00',
        total_amount: '165.00',
        payment_status: 'pending',
        issue_date: issueDate,
        due_date: pastDueDate
      })
      .execute();

    // Create overdue invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-005',
        order_id: null,
        customer_id: customerId,
        amount: '250.00',
        tax_amount: '25.00',
        total_amount: '275.00',
        payment_status: 'overdue',
        issue_date: issueDate,
        due_date: pastDueDate
      })
      .execute();

    const result = await getOverdueInvoices();

    expect(result).toHaveLength(2);
    expect(result.map(r => r.invoice_number).sort()).toEqual(['INV-004', 'INV-005']);
    expect(result.every(r => r.due_date < new Date())).toBe(true);
    expect(result.every(r => r.payment_status !== 'paid')).toBe(true);
  });
});
