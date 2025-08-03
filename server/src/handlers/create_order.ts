
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    // Generate unique order number with timestamp and random suffix
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Set order date to current date if not provided
    const orderDate = input.order_date || new Date();

    // Insert order record
    const result = await db.insert(ordersTable)
      .values({
        order_number: orderNumber,
        type: input.type,
        customer_id: input.customer_id,
        supplier_id: input.supplier_id,
        status: 'pending', // Default status
        total_amount: '0.00', // Initial amount, will be updated when items are added
        order_date: orderDate
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const order = result[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};
