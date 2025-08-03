
import { db } from '../db';
import { inventoryTable } from '../db/schema';
import { type Inventory } from '../schema';
import { lt, sql } from 'drizzle-orm';

export async function getLowStockItems(): Promise<Inventory[]> {
  try {
    // Query inventory items where quantity is below reorder level
    const results = await db.select()
      .from(inventoryTable)
      .where(lt(inventoryTable.quantity, sql`${inventoryTable.reorder_level}`))
      .execute();

    // Return the results - no numeric conversions needed as quantity and reorder_level are integers
    return results;
  } catch (error) {
    console.error('Failed to fetch low stock items:', error);
    throw error;
  }
}
