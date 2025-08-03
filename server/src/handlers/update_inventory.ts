
import { db } from '../db';
import { inventoryTable, productsTable, warehousesTable } from '../db/schema';
import { type UpdateInventoryInput, type Inventory } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateInventory = async (input: UpdateInventoryInput): Promise<Inventory> => {
  try {
    // Verify product exists
    const productExists = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (productExists.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    // Verify warehouse exists
    const warehouseExists = await db.select()
      .from(warehousesTable)
      .where(eq(warehousesTable.id, input.warehouse_id))
      .execute();

    if (warehouseExists.length === 0) {
      throw new Error(`Warehouse with id ${input.warehouse_id} not found`);
    }

    // Check if inventory record exists
    const existingInventory = await db.select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.product_id, input.product_id),
          eq(inventoryTable.warehouse_id, input.warehouse_id)
        )
      )
      .execute();

    let result;

    if (existingInventory.length > 0) {
      // Update existing inventory record
      const updateData: any = {
        quantity: input.quantity,
        updated_at: new Date()
      };

      if (input.reorder_level !== undefined) {
        updateData.reorder_level = input.reorder_level;
      }

      result = await db.update(inventoryTable)
        .set(updateData)
        .where(
          and(
            eq(inventoryTable.product_id, input.product_id),
            eq(inventoryTable.warehouse_id, input.warehouse_id)
          )
        )
        .returning()
        .execute();
    } else {
      // Create new inventory record
      result = await db.insert(inventoryTable)
        .values({
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          quantity: input.quantity,
          reorder_level: input.reorder_level || 10,
          updated_at: new Date()
        })
        .returning()
        .execute();
    }

    return result[0];
  } catch (error) {
    console.error('Inventory update failed:', error);
    throw error;
  }
};
