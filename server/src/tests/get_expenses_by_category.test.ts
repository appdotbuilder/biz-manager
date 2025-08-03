
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { getExpensesByCategory } from '../handlers/get_expenses_by_category';

describe('getExpensesByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expenses exist', async () => {
    const result = await getExpensesByCategory();
    expect(result).toEqual([]);
  });

  it('should group expenses by category with correct totals', async () => {
    // Create test expenses in different categories
    await db.insert(expensesTable).values([
      {
        description: 'Office supplies',
        amount: '100.50',
        category: 'Office',
        expense_date: new Date()
      },
      {
        description: 'Marketing campaign',
        amount: '250.75',
        category: 'Marketing',
        expense_date: new Date()
      },
      {
        description: 'More office supplies',
        amount: '75.25',
        category: 'Office',
        expense_date: new Date()
      }
    ]).execute();

    const result = await getExpensesByCategory();

    // Should have 2 categories
    expect(result).toHaveLength(2);

    // Find each category result
    const officeResult = result.find(r => r.category === 'Office');
    const marketingResult = result.find(r => r.category === 'Marketing');

    // Verify Office category total (100.50 + 75.25 = 175.75)
    expect(officeResult).toBeDefined();
    expect(officeResult!.total).toEqual(175.75);
    expect(typeof officeResult!.total).toBe('number');

    // Verify Marketing category total
    expect(marketingResult).toBeDefined();
    expect(marketingResult!.total).toEqual(250.75);
    expect(typeof marketingResult!.total).toBe('number');
  });

  it('should handle single category with multiple expenses', async () => {
    // Create multiple expenses in same category
    await db.insert(expensesTable).values([
      {
        description: 'Travel expense 1',
        amount: '150.00',
        category: 'Travel',
        expense_date: new Date()
      },
      {
        description: 'Travel expense 2',
        amount: '200.50',
        category: 'Travel',
        expense_date: new Date()
      },
      {
        description: 'Travel expense 3',
        amount: '99.99',
        category: 'Travel',
        expense_date: new Date()
      }
    ]).execute();

    const result = await getExpensesByCategory();

    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual('Travel');
    expect(result[0].total).toEqual(450.49);
    expect(typeof result[0].total).toBe('number');
  });

  it('should handle decimal precision correctly', async () => {
    // Create expenses with various decimal amounts
    await db.insert(expensesTable).values([
      {
        description: 'Precise expense 1',
        amount: '10.01',
        category: 'Test',
        expense_date: new Date()
      },
      {
        description: 'Precise expense 2',
        amount: '20.99',
        category: 'Test',
        expense_date: new Date()
      }
    ]).execute();

    const result = await getExpensesByCategory();

    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual('Test');
    expect(result[0].total).toEqual(31.00);
    expect(typeof result[0].total).toBe('number');
  });
});
