
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, customersTable, suppliersTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

// Test input for sales order
const salesOrderInput: CreateOrderInput = {
  type: 'sales',
  customer_id: 1,
  supplier_id: null,
  order_date: new Date('2024-01-15')
};

// Test input for purchase order
const purchaseOrderInput: CreateOrderInput = {
  type: 'purchase',
  customer_id: null,
  supplier_id: 1,
  order_date: new Date('2024-01-16')
};

describe('createOrder', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test customer for sales orders
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '555-0123',
        address: '123 Customer St'
      })
      .execute();

    // Create test supplier for purchase orders
    await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        email: 'supplier@test.com',
        phone: '555-0456',
        address: '456 Supplier Ave'
      })
      .execute();
  });

  afterEach(resetDB);

  it('should create a sales order', async () => {
    const result = await createOrder(salesOrderInput);

    // Basic field validation
    expect(result.type).toEqual('sales');
    expect(result.customer_id).toEqual(1);
    expect(result.supplier_id).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.total_amount).toEqual(0);
    expect(result.order_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.order_number).toMatch(/^ORD-\d+-\d+$/);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a purchase order', async () => {
    const result = await createOrder(purchaseOrderInput);

    // Basic field validation
    expect(result.type).toEqual('purchase');
    expect(result.customer_id).toBeNull();
    expect(result.supplier_id).toEqual(1);
    expect(result.status).toEqual('pending');
    expect(result.total_amount).toEqual(0);
    expect(result.order_date).toEqual(new Date('2024-01-16'));
    expect(result.id).toBeDefined();
    expect(result.order_number).toMatch(/^ORD-\d+-\d+$/);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save order to database', async () => {
    const result = await createOrder(salesOrderInput);

    // Query using proper drizzle syntax
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].type).toEqual('sales');
    expect(orders[0].customer_id).toEqual(1);
    expect(orders[0].supplier_id).toBeNull();
    expect(orders[0].status).toEqual('pending');
    expect(parseFloat(orders[0].total_amount)).toEqual(0);
    expect(orders[0].order_date).toEqual(new Date('2024-01-15'));
    expect(orders[0].created_at).toBeInstanceOf(Date);
  });

  it('should use current date when order_date is not provided', async () => {
    const inputWithoutDate: CreateOrderInput = {
      type: 'sales',
      customer_id: 1,
      supplier_id: null
    };

    const result = await createOrder(inputWithoutDate);

    // Check that order_date is recent (within last few seconds)
    const timeDiff = Math.abs(Date.now() - result.order_date.getTime());
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
  });

  it('should generate unique order numbers', async () => {
    const result1 = await createOrder(salesOrderInput);
    const result2 = await createOrder(purchaseOrderInput);

    expect(result1.order_number).not.toEqual(result2.order_number);
    expect(result1.order_number).toMatch(/^ORD-\d+-\d+$/);
    expect(result2.order_number).toMatch(/^ORD-\d+-\d+$/);
  });

  it('should handle numeric conversion correctly', async () => {
    const result = await createOrder(salesOrderInput);

    // Verify the returned value is a number
    expect(typeof result.total_amount).toBe('number');
    expect(result.total_amount).toEqual(0);
  });
});
