
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, customersTable, invoicesTable, expensesTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const basicIncomeInput: CreateTransactionInput = {
    type: 'income',
    amount: 1500.75,
    description: 'Payment received for invoice',
    invoice_id: null,
    expense_id: null,
    transaction_date: new Date('2024-01-15')
  };

  const basicExpenseInput: CreateTransactionInput = {
    type: 'expense',
    amount: 250.50,
    description: 'Office supplies purchase',
    invoice_id: null,
    expense_id: null,
    transaction_date: new Date('2024-01-16')
  };

  it('should create an income transaction', async () => {
    const result = await createTransaction(basicIncomeInput);

    expect(result.type).toEqual('income');
    expect(result.amount).toEqual(1500.75);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Payment received for invoice');
    expect(result.invoice_id).toBeNull();
    expect(result.expense_id).toBeNull();
    expect(result.transaction_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an expense transaction', async () => {
    const result = await createTransaction(basicExpenseInput);

    expect(result.type).toEqual('expense');
    expect(result.amount).toEqual(250.50);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Office supplies purchase');
    expect(result.invoice_id).toBeNull();
    expect(result.expense_id).toBeNull();
    expect(result.transaction_date).toEqual(new Date('2024-01-16'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const result = await createTransaction(basicIncomeInput);

    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toEqual('income');
    expect(parseFloat(transactions[0].amount)).toEqual(1500.75);
    expect(transactions[0].description).toEqual('Payment received for invoice');
    expect(transactions[0].transaction_date).toEqual(new Date('2024-01-15'));
    expect(transactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should use current date when transaction_date is not provided', async () => {
    const inputWithoutDate: CreateTransactionInput = {
      type: 'income',
      amount: 1000.00,
      description: 'Test transaction',
      invoice_id: null,
      expense_id: null
    };

    const beforeTest = new Date();
    const result = await createTransaction(inputWithoutDate);
    const afterTest = new Date();

    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.transaction_date >= beforeTest).toBe(true);
    expect(result.transaction_date <= afterTest).toBe(true);
  });

  it('should create transaction with invoice reference', async () => {
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

    // Create an invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        order_id: null,
        customer_id: customerResult[0].id,
        amount: '1500.75',
        tax_amount: '150.00',
        total_amount: '1650.75',
        issue_date: new Date('2024-01-01'),
        due_date: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const inputWithInvoice: CreateTransactionInput = {
      type: 'income',
      amount: 1650.75,
      description: 'Payment for INV-001',
      invoice_id: invoiceResult[0].id,
      expense_id: null,
      transaction_date: new Date('2024-01-15')
    };

    const result = await createTransaction(inputWithInvoice);

    expect(result.invoice_id).toEqual(invoiceResult[0].id);
    expect(result.expense_id).toBeNull();
    expect(result.amount).toEqual(1650.75);
  });

  it('should create transaction with expense reference', async () => {
    // Create an expense first
    const expenseResult = await db.insert(expensesTable)
      .values({
        description: 'Office rent',
        amount: '2000.00',
        category: 'Rent',
        expense_date: new Date('2024-01-01')
      })
      .returning()
      .execute();

    const inputWithExpense: CreateTransactionInput = {
      type: 'expense',
      amount: 2000.00,
      description: 'Payment for office rent',
      invoice_id: null,
      expense_id: expenseResult[0].id,
      transaction_date: new Date('2024-01-15')
    };

    const result = await createTransaction(inputWithExpense);

    expect(result.expense_id).toEqual(expenseResult[0].id);
    expect(result.invoice_id).toBeNull();
    expect(result.amount).toEqual(2000.00);
  });
});
