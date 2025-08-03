
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { orderItemsTable, ordersTable, customersTable, productsTable } from '../db/schema';
import { type CreateOrderItemInput } from '../schema';
import { createOrderItem } from '../handlers/create_order_item';
import { eq } from 'drizzle-orm';

describe('createOrderItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let productId: number;
  let orderId: number;

  beforeEach(async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    // Create prerequisite product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        sku: 'TEST-001',
        price: '19.99',
        cost: '10.00'
      })
      .returning()
      .execute();
    productId = productResult[0].id;

    // Create prerequisite order
    const orderResult = await db.insert(ordersTable)
      .values({
        order_number: 'ORD-001',
        type: 'sales',
        customer_id: customerId,
        supplier_id: null,
        status: 'pending',
        total_amount: '0.00',
        order_date: new Date()
      })
      .returning()
      .execute();
    orderId = orderResult[0].id;
  });

  const testInput: CreateOrderItemInput = {
    order_id: 0, // Will be set in beforeEach
    product_id: 0, // Will be set in beforeEach
    quantity: 2,
    unit_price: 19.99
  };

  it('should create an order item', async () => {
    const input = { ...testInput, order_id: orderId, product_id: productId };
    const result = await createOrderItem(input);

    // Basic field validation
    expect(result.order_id).toEqual(orderId);
    expect(result.product_id).toEqual(productId);
    expect(result.quantity).toEqual(2);
    expect(result.unit_price).toEqual(19.99);
    expect(result.total_price).toEqual(39.98);
    expect(result.id).toBeDefined();
    expect(typeof result.unit_price).toBe('number');
    expect(typeof result.total_price).toBe('number');
  });

  it('should save order item to database', async () => {
    const input = { ...testInput, order_id: orderId, product_id: productId };
    const result = await createOrderItem(input);

    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.id, result.id))
      .execute();

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].order_id).toEqual(orderId);
    expect(orderItems[0].product_id).toEqual(productId);
    expect(orderItems[0].quantity).toEqual(2);
    expect(parseFloat(orderItems[0].unit_price)).toEqual(19.99);
    expect(parseFloat(orderItems[0].total_price)).toEqual(39.98);
  });

  it('should update order total amount', async () => {
    const input = { ...testInput, order_id: orderId, product_id: productId };
    await createOrderItem(input);

    // Check that order total was updated
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(parseFloat(orders[0].total_amount)).toEqual(39.98);
  });

  it('should calculate correct total for multiple order items', async () => {
    const input1 = { ...testInput, order_id: orderId, product_id: productId };
    const input2 = { ...testInput, order_id: orderId, product_id: productId, quantity: 1, unit_price: 10.00 };

    // Add first item
    await createOrderItem(input1);
    
    // Add second item
    await createOrderItem(input2);

    // Check that order total includes both items
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(parseFloat(orders[0].total_amount)).toEqual(49.98); // 39.98 + 10.00
  });

  it('should throw error for non-existent order', async () => {
    const input = { ...testInput, order_id: 99999, product_id: productId };
    
    await expect(createOrderItem(input)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should throw error for non-existent product', async () => {
    const input = { ...testInput, order_id: orderId, product_id: 99999 };
    
    await expect(createOrderItem(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
