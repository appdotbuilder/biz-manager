
import { db } from '../db';
import { warehousesTable } from '../db/schema';
import { type CreateWarehouseInput, type Warehouse } from '../schema';

export const createWarehouse = async (input: CreateWarehouseInput): Promise<Warehouse> => {
  try {
    const result = await db.insert(warehousesTable)
      .values({
        name: input.name,
        location: input.location,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Warehouse creation failed:', error);
    throw error;
  }
};
