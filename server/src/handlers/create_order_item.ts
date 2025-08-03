
import { db } from '../db';
import { orderItemsTable, ordersTable } from '../db/schema';
import { type CreateOrderItemInput, type OrderItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createOrderItem = async (input: CreateOrderItemInput): Promise<OrderItem> => {
  try {
    // Calculate total price
    const totalPrice = input.quantity * input.unit_price;

    // Insert order item record
    const result = await db.insert(orderItemsTable)
      .values({
        order_id: input.order_id,
        product_id: input.product_id,
        quantity: input.quantity,
        unit_price: input.unit_price.toString(),
        total_price: totalPrice.toString()
      })
      .returning()
      .execute();

    const orderItem = result[0];

    // Update the order's total amount
    // First, get all order items for this order to calculate new total
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, input.order_id))
      .execute();

    // Calculate new order total
    const newOrderTotal = orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.total_price);
    }, 0);

    // Update the order's total amount
    await db.update(ordersTable)
      .set({ total_amount: newOrderTotal.toString() })
      .where(eq(ordersTable.id, input.order_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    return {
      ...orderItem,
      unit_price: parseFloat(orderItem.unit_price),
      total_price: parseFloat(orderItem.total_price)
    };
  } catch (error) {
    console.error('Order item creation failed:', error);
    throw error;
  }
};
