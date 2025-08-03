
import { db } from '../db';
import { inventoryTable } from '../db/schema';
import { type Inventory } from '../schema';

export async function getInventory(): Promise<Inventory[]> {
  try {
    const results = await db.select()
      .from(inventoryTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(inventory => ({
      id: inventory.id,
      product_id: inventory.product_id,
      warehouse_id: inventory.warehouse_id,
      quantity: inventory.quantity,
      reorder_level: inventory.reorder_level,
      updated_at: inventory.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    throw error;
  }
}
