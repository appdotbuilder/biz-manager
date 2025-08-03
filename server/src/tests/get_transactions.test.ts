
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, invoicesTable, expensesTable, customersTable } from '../db/schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();
    expect(result).toEqual([]);
  });

  it('should fetch all transactions', async () => {
    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    const expenseResult = await db.insert(expensesTable)
      .values({
        description: 'Office supplies',
        amount: '150.00',
        category: 'Office',
        expense_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    const expense = expenseResult[0];

    // Create transactions
    await db.insert(transactionsTable)
      .values({
        type: 'income',
        amount: '500.50',
        description: 'Payment received',
        invoice_id: null,
        expense_id: null,
        transaction_date: new Date('2024-01-20')
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        type: 'expense',
        amount: '150.00',
        description: 'Office supplies payment',
        invoice_id: null,
        expense_id: expense.id,
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    
    // Verify transaction data
    const incomeTransaction = result.find(t => t.type === 'income');
    const expenseTransaction = result.find(t => t.type === 'expense');

    expect(incomeTransaction).toBeDefined();
    expect(incomeTransaction!.amount).toEqual(500.50);
    expect(typeof incomeTransaction!.amount).toBe('number');
    expect(incomeTransaction!.description).toEqual('Payment received');
    expect(incomeTransaction!.invoice_id).toBeNull();
    expect(incomeTransaction!.expense_id).toBeNull();

    expect(expenseTransaction).toBeDefined();
    expect(expenseTransaction!.amount).toEqual(150.00);
    expect(typeof expenseTransaction!.amount).toBe('number');
    expect(expenseTransaction!.description).toEqual('Office supplies payment');
    expect(expenseTransaction!.expense_id).toEqual(expense.id);
  });

  it('should return transactions ordered by created_at descending', async () => {
    // Create transactions with different timestamps
    const olderTransaction = {
      type: 'income' as const,
      amount: '100.00',
      description: 'Older transaction',
      invoice_id: null,
      expense_id: null,
      transaction_date: new Date('2024-01-01'),
      created_at: new Date('2024-01-01T10:00:00Z')
    };

    const newerTransaction = {
      type: 'expense' as const,
      amount: '200.00',
      description: 'Newer transaction',
      invoice_id: null,
      expense_id: null,
      transaction_date: new Date('2024-01-02'),
      created_at: new Date('2024-01-02T10:00:00Z')
    };

    // Insert older transaction first
    await db.insert(transactionsTable)
      .values(olderTransaction)
      .execute();

    // Insert newer transaction second
    await db.insert(transactionsTable)
      .values(newerTransaction)
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    // Should be ordered by created_at descending (newest first)
    expect(result[0].description).toEqual('Newer transaction');
    expect(result[1].description).toEqual('Older transaction');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle transactions with linked invoices and expenses', async () => {
    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        order_id: null,
        customer_id: customer.id,
        amount: '300.00',
        tax_amount: '30.00',
        total_amount: '330.00',
        payment_status: 'pending',
        issue_date: new Date('2024-01-10'),
        due_date: new Date('2024-02-10')
      })
      .returning()
      .execute();
    const invoice = invoiceResult[0];

    const expenseResult = await db.insert(expensesTable)
      .values({
        description: 'Office supplies',
        amount: '150.00',
        category: 'Office',
        expense_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    const expense = expenseResult[0];

    // Create transactions linked to invoice and expense
    await db.insert(transactionsTable)
      .values({
        type: 'income',
        amount: '330.00',
        description: 'Invoice payment',
        invoice_id: invoice.id,
        expense_id: null,
        transaction_date: new Date('2024-01-20')
      })
      .execute();

    await db.insert(transactionsTable)
      .values({
        type: 'expense',
        amount: '150.00',
        description: 'Expense payment',
        invoice_id: null,
        expense_id: expense.id,
        transaction_date: new Date('2024-01-15')
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    
    const invoiceTransaction = result.find(t => t.invoice_id === invoice.id);
    const expenseTransaction = result.find(t => t.expense_id === expense.id);

    expect(invoiceTransaction).toBeDefined();
    expect(invoiceTransaction!.amount).toEqual(330.00);
    expect(invoiceTransaction!.invoice_id).toEqual(invoice.id);

    expect(expenseTransaction).toBeDefined();
    expect(expenseTransaction!.amount).toEqual(150.00);
    expect(expenseTransaction!.expense_id).toEqual(expense.id);
  });
});
