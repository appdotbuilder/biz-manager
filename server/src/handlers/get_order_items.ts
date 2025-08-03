
import { db } from '../db';
import { orderItemsTable, productsTable } from '../db/schema';
import { type OrderItem } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  try {
    const results = await db.select({
      id: orderItemsTable.id,
      order_id: orderItemsTable.order_id,
      product_id: orderItemsTable.product_id,
      quantity: orderItemsTable.quantity,
      unit_price: orderItemsTable.unit_price,
      total_price: orderItemsTable.total_price,
    })
    .from(orderItemsTable)
    .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
    .where(eq(orderItemsTable.order_id, orderId))
    .execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price)
    }));
  } catch (error) {
    console.error('Failed to fetch order items:', error);
    throw error;
  }
}
