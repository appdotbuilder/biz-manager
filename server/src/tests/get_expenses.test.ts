
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { getExpenses } from '../handlers/get_expenses';

describe('getExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expenses exist', async () => {
    const result = await getExpenses();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all expenses', async () => {
    // Insert test expenses
    await db.insert(expensesTable)
      .values([
        {
          description: 'Office Supplies',
          amount: '150.75',
          category: 'Office',
          expense_date: new Date('2023-01-15')
        },
        {
          description: 'Equipment Purchase',
          amount: '2500.00',
          category: 'Equipment',
          expense_date: new Date('2023-01-20')
        },
        {
          description: 'Marketing Campaign',
          amount: '800.50',
          category: 'Marketing',
          expense_date: new Date('2023-01-25')
        }
      ])
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(3);
    
    // Check first expense
    const officeExpense = result.find(e => e.description === 'Office Supplies');
    expect(officeExpense).toBeDefined();
    expect(officeExpense!.amount).toEqual(150.75);
    expect(typeof officeExpense!.amount).toBe('number');
    expect(officeExpense!.category).toEqual('Office');
    expect(officeExpense!.expense_date).toBeInstanceOf(Date);
    expect(officeExpense!.id).toBeDefined();
    expect(officeExpense!.created_at).toBeInstanceOf(Date);

    // Check second expense
    const equipmentExpense = result.find(e => e.description === 'Equipment Purchase');
    expect(equipmentExpense).toBeDefined();
    expect(equipmentExpense!.amount).toEqual(2500.00);
    expect(typeof equipmentExpense!.amount).toBe('number');
    expect(equipmentExpense!.category).toEqual('Equipment');

    // Check third expense
    const marketingExpense = result.find(e => e.description === 'Marketing Campaign');
    expect(marketingExpense).toBeDefined();
    expect(marketingExpense!.amount).toEqual(800.50);
    expect(typeof marketingExpense!.amount).toBe('number');
    expect(marketingExpense!.category).toEqual('Marketing');
  });

  it('should handle single expense correctly', async () => {
    // Insert single test expense
    await db.insert(expensesTable)
      .values({
        description: 'Single Expense',
        amount: '99.99',
        category: 'Test',
        expense_date: new Date('2023-12-01')
      })
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('Single Expense');
    expect(result[0].amount).toEqual(99.99);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].category).toEqual('Test');
    expect(result[0].expense_date).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return expenses in database order', async () => {
    // Insert expenses with different dates
    const firstExpense = await db.insert(expensesTable)
      .values({
        description: 'First Expense',
        amount: '100.00',
        category: 'Test',
        expense_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const secondExpense = await db.insert(expensesTable)
      .values({
        description: 'Second Expense',
        amount: '200.00',
        category: 'Test',
        expense_date: new Date('2023-01-02')
      })
      .returning()
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(2);
    
    // Should maintain insertion order (by id)
    const firstResult = result.find(e => e.id === firstExpense[0].id);
    const secondResult = result.find(e => e.id === secondExpense[0].id);
    
    expect(firstResult).toBeDefined();
    expect(secondResult).toBeDefined();
    expect(firstResult!.description).toEqual('First Expense');
    expect(secondResult!.description).toEqual('Second Expense');
  });
});
