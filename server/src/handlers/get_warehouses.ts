
import { db } from '../db';
import { warehousesTable } from '../db/schema';
import { type Warehouse } from '../schema';

export const getWarehouses = async (): Promise<Warehouse[]> => {
  try {
    const results = await db.select()
      .from(warehousesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch warehouses:', error);
    throw error;
  }
};
