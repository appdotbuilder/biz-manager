
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Set default transaction_date if not provided
    const transactionDate = input.transaction_date || new Date();

    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        type: input.type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        invoice_id: input.invoice_id,
        expense_id: input.expense_id,
        transaction_date: transactionDate
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
