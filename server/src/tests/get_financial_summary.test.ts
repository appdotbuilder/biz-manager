
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, invoicesTable, customersTable } from '../db/schema';
import { getFinancialSummary } from '../handlers/get_financial_summary';

describe('getFinancialSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values when no data exists', async () => {
    const result = await getFinancialSummary();

    expect(result.totalIncome).toEqual(0);
    expect(result.totalExpenses).toEqual(0);
    expect(result.netProfit).toEqual(0);
    expect(result.pendingInvoices).toEqual(0);
    expect(result.overdueInvoices).toEqual(0);
  });

  it('should calculate totals with mixed transaction types', async () => {
    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          type: 'income',
          amount: '1000.50',
          description: 'Sales revenue',
          transaction_date: new Date(),
          invoice_id: null,
          expense_id: null
        },
        {
          type: 'income',
          amount: '750.25',
          description: 'Service income',
          transaction_date: new Date(),
          invoice_id: null,
          expense_id: null
        },
        {
          type: 'expense',
          amount: '300.00',
          description: 'Office supplies',
          transaction_date: new Date(),
          invoice_id: null,
          expense_id: null
        },
        {
          type: 'expense',
          amount: '150.75',
          description: 'Utilities',
          transaction_date: new Date(),
          invoice_id: null,
          expense_id: null
        }
      ])
      .execute();

    const result = await getFinancialSummary();

    expect(result.totalIncome).toEqual(1750.75);
    expect(result.totalExpenses).toEqual(450.75);
    expect(result.netProfit).toEqual(1300.00);
  });

  it('should calculate invoice amounts by payment status', async () => {
    // Create test customer first
    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    // Create test invoices with different payment statuses
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          customer_id: customer[0].id,
          amount: '500.00',
          tax_amount: '50.00',
          total_amount: '550.00',
          payment_status: 'pending',
          issue_date: new Date(),
          due_date: new Date(),
          order_id: null
        },
        {
          invoice_number: 'INV-002',
          customer_id: customer[0].id,
          amount: '800.00',
          tax_amount: '80.00',
          total_amount: '880.00',
          payment_status: 'pending',
          issue_date: new Date(),
          due_date: new Date(),
          order_id: null
        },
        {
          invoice_number: 'INV-003',
          customer_id: customer[0].id,
          amount: '300.00',
          tax_amount: '30.00',
          total_amount: '330.00',
          payment_status: 'overdue',
          issue_date: new Date(),
          due_date: new Date(),
          order_id: null
        },
        {
          invoice_number: 'INV-004',
          customer_id: customer[0].id,
          amount: '200.00',
          tax_amount: '20.00',
          total_amount: '220.00',
          payment_status: 'paid',
          issue_date: new Date(),
          due_date: new Date(),
          order_id: null
        }
      ])
      .execute();

    const result = await getFinancialSummary();

    expect(result.pendingInvoices).toEqual(1430.00); // 550 + 880
    expect(result.overdueInvoices).toEqual(330.00);
  });

  it('should handle complete financial scenario', async () => {
    // Create customer for invoices
    const customer = await db.insert(customersTable)
      .values({
        name: 'Complete Test Customer',
        email: 'complete@example.com',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    // Add transactions
    await db.insert(transactionsTable)
      .values([
        {
          type: 'income',
          amount: '2000.00',
          description: 'Product sales',
          transaction_date: new Date(),
          invoice_id: null,
          expense_id: null
        },
        {
          type: 'expense',
          amount: '500.00',
          description: 'Raw materials',
          transaction_date: new Date(),
          invoice_id: null,
          expense_id: null
        }
      ])
      .execute();

    // Add invoices
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'COMP-001',
          customer_id: customer[0].id,
          amount: '1000.00',
          tax_amount: '100.00',
          total_amount: '1100.00',
          payment_status: 'pending',
          issue_date: new Date(),
          due_date: new Date(),
          order_id: null
        },
        {
          invoice_number: 'COMP-002',
          customer_id: customer[0].id,
          amount: '600.00',
          tax_amount: '60.00',
          total_amount: '660.00',
          payment_status: 'overdue',
          issue_date: new Date(),
          due_date: new Date(),
          order_id: null
        }
      ])
      .execute();

    const result = await getFinancialSummary();

    expect(result.totalIncome).toEqual(2000.00);
    expect(result.totalExpenses).toEqual(500.00);
    expect(result.netProfit).toEqual(1500.00);
    expect(result.pendingInvoices).toEqual(1100.00);
    expect(result.overdueInvoices).toEqual(660.00);
  });
});
