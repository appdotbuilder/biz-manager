
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { warehousesTable, productsTable, customersTable, ordersTable, orderItemsTable } from '../db/schema';
import { getOrderItems } from '../handlers/get_order_items';

describe('getOrderItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when order has no items', async () => {
    // Create prerequisite data
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        location: 'Test Location',
        description: 'Test warehouse'
      })
      .returning()
      .execute();

    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: 'Test Address'
      })
      .returning()
      .execute();

    const order = await db.insert(ordersTable)
      .values({
        order_number: 'ORD-001',
        type: 'sales',
        customer_id: customer[0].id,
        supplier_id: null,
        status: 'pending',
        total_amount: '0.00',
        order_date: new Date()
      })
      .returning()
      .execute();

    const result = await getOrderItems(order[0].id);

    expect(result).toEqual([]);
  });

  it('should return order items for valid order', async () => {
    // Create prerequisite data
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        location: 'Test Location',
        description: 'Test warehouse'
      })
      .returning()
      .execute();

    const product1 = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'Test product 1',
        sku: 'SKU-001',
        price: '19.99',
        cost: '10.00'
      })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Test product 2',
        sku: 'SKU-002',
        price: '29.99',
        cost: '15.00'
      })
      .returning()
      .execute();

    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: 'Test Address'
      })
      .returning()
      .execute();

    const order = await db.insert(ordersTable)
      .values({
        order_number: 'ORD-001',
        type: 'sales',
        customer_id: customer[0].id,
        supplier_id: null,
        status: 'pending',
        total_amount: '99.97',
        order_date: new Date()
      })
      .returning()
      .execute();

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: order[0].id,
          product_id: product1[0].id,
          quantity: 2,
          unit_price: '19.99',
          total_price: '39.98'
        },
        {
          order_id: order[0].id,
          product_id: product2[0].id,
          quantity: 2,
          unit_price: '29.99',
          total_price: '59.98'
        }
      ])
      .execute();

    const result = await getOrderItems(order[0].id);

    expect(result).toHaveLength(2);
    
    // Verify first item
    expect(result[0].order_id).toEqual(order[0].id);
    expect(result[0].product_id).toEqual(product1[0].id);
    expect(result[0].quantity).toEqual(2);
    expect(result[0].unit_price).toEqual(19.99);
    expect(result[0].total_price).toEqual(39.98);
    expect(typeof result[0].unit_price).toBe('number');
    expect(typeof result[0].total_price).toBe('number');

    // Verify second item
    expect(result[1].order_id).toEqual(order[0].id);
    expect(result[1].product_id).toEqual(product2[0].id);
    expect(result[1].quantity).toEqual(2);
    expect(result[1].unit_price).toEqual(29.99);
    expect(result[1].total_price).toEqual(59.98);
    expect(typeof result[1].unit_price).toBe('number');
    expect(typeof result[1].total_price).toBe('number');
  });

  it('should return empty array for non-existent order', async () => {
    const result = await getOrderItems(999);

    expect(result).toEqual([]);
  });

  it('should handle single order item correctly', async () => {
    // Create prerequisite data
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        location: 'Test Location',
        description: 'Test warehouse'
      })
      .returning()
      .execute();

    const product = await db.insert(productsTable)
      .values({
        name: 'Single Product',
        description: 'Test product',
        sku: 'SKU-SINGLE',
        price: '99.99',
        cost: '50.00'
      })
      .returning()
      .execute();

    const customer = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: 'Test Address'
      })
      .returning()
      .execute();

    const order = await db.insert(ordersTable)
      .values({
        order_number: 'ORD-SINGLE',
        type: 'sales',
        customer_id: customer[0].id,
        supplier_id: null,
        status: 'pending',
        total_amount: '99.99',
        order_date: new Date()
      })
      .returning()
      .execute();

    await db.insert(orderItemsTable)
      .values({
        order_id: order[0].id,
        product_id: product[0].id,
        quantity: 1,
        unit_price: '99.99',
        total_price: '99.99'
      })
      .execute();

    const result = await getOrderItems(order[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].order_id).toEqual(order[0].id);
    expect(result[0].product_id).toEqual(product[0].id);
    expect(result[0].quantity).toEqual(1);
    expect(result[0].unit_price).toEqual(99.99);
    expect(result[0].total_price).toEqual(99.99);
    expect(result[0].id).toBeDefined();
  });
});
