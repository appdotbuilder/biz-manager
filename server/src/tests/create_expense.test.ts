
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateExpenseInput = {
  description: 'Office supplies',
  amount: 150.75,
  category: 'Operations',
  expense_date: new Date('2024-01-15')
};

describe('createExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an expense', async () => {
    const result = await createExpense(testInput);

    // Basic field validation
    expect(result.description).toEqual('Office supplies');
    expect(result.amount).toEqual(150.75);
    expect(typeof result.amount).toBe('number');
    expect(result.category).toEqual('Operations');
    expect(result.expense_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    const result = await createExpense(testInput);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].description).toEqual('Office supplies');
    expect(parseFloat(expenses[0].amount)).toEqual(150.75);
    expect(expenses[0].category).toEqual('Operations');
    expect(expenses[0].expense_date).toEqual(new Date('2024-01-15'));
    expect(expenses[0].created_at).toBeInstanceOf(Date);
  });

  it('should use current date when expense_date is not provided', async () => {
    const inputWithoutDate: CreateExpenseInput = {
      description: 'Test expense',
      amount: 100.00,
      category: 'Testing'
    };

    const result = await createExpense(inputWithoutDate);

    expect(result.expense_date).toBeInstanceOf(Date);
    expect(result.description).toEqual('Test expense');
    expect(result.amount).toEqual(100.00);
    expect(result.category).toEqual('Testing');
  });

  it('should handle different expense categories', async () => {
    const marketingExpense: CreateExpenseInput = {
      description: 'Facebook ads',
      amount: 299.99,
      category: 'Marketing',
      expense_date: new Date('2024-02-01')
    };

    const result = await createExpense(marketingExpense);

    expect(result.category).toEqual('Marketing');
    expect(result.description).toEqual('Facebook ads');
    expect(result.amount).toEqual(299.99);

    // Verify in database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses[0].category).toEqual('Marketing');
    expect(parseFloat(expenses[0].amount)).toEqual(299.99);
  });
});
