
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { desc } from 'drizzle-orm';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};
