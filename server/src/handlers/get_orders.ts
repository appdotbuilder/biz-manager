
import { db } from '../db';
import { ordersTable, customersTable, suppliersTable } from '../db/schema';
import { type Order } from '../schema';
import { eq } from 'drizzle-orm';

export async function getOrders(): Promise<Order[]> {
  try {
    const results = await db.select()
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customer_id, customersTable.id))
      .leftJoin(suppliersTable, eq(ordersTable.supplier_id, suppliersTable.id))
      .execute();

    return results.map(result => ({
      id: result.orders.id,
      order_number: result.orders.order_number,
      type: result.orders.type,
      customer_id: result.orders.customer_id,
      supplier_id: result.orders.supplier_id,
      status: result.orders.status,
      total_amount: parseFloat(result.orders.total_amount),
      order_date: result.orders.order_date,
      created_at: result.orders.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}
