
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { sql } from 'drizzle-orm';

export async function getExpensesByCategory(): Promise<{ category: string; total: number }[]> {
  try {
    // Group expenses by category and sum amounts
    const results = await db
      .select({
        category: expensesTable.category,
        total: sql<string>`sum(${expensesTable.amount})`.as('total')
      })
      .from(expensesTable)
      .groupBy(expensesTable.category)
      .execute();

    // Convert numeric total from string to number
    return results.map(result => ({
      category: result.category,
      total: parseFloat(result.total)
    }));
  } catch (error) {
    console.error('Failed to get expenses by category:', error);
    throw error;
  }
}
