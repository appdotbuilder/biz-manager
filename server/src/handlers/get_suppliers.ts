
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type Supplier } from '../schema';

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const results = await db.select()
      .from(suppliersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Get suppliers failed:', error);
    throw error;
  }
};
