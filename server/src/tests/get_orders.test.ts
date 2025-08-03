
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, customersTable, suppliersTable } from '../db/schema';
import { getOrders } from '../handlers/get_orders';

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no orders exist', async () => {
    const result = await getOrders();
    expect(result).toEqual([]);
  });

  it('should fetch sales order with customer', async () => {
    // Create customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    // Create sales order
    const orderResult = await db.insert(ordersTable)
      .values({
        order_number: 'SO-001',
        type: 'sales',
        customer_id: customer.id,
        supplier_id: null,
        status: 'pending',
        total_amount: '150.00',
        order_date: new Date('2024-01-15')
      })
      .returning()
      .execute();

    const orders = await getOrders();

    expect(orders).toHaveLength(1);
    expect(orders[0].id).toEqual(orderResult[0].id);
    expect(orders[0].order_number).toEqual('SO-001');
    expect(orders[0].type).toEqual('sales');
    expect(orders[0].customer_id).toEqual(customer.id);
    expect(orders[0].supplier_id).toBeNull();
    expect(orders[0].status).toEqual('pending');
    expect(orders[0].total_amount).toEqual(150.00);
    expect(typeof orders[0].total_amount).toEqual('number');
    expect(orders[0].order_date).toBeInstanceOf(Date);
    expect(orders[0].created_at).toBeInstanceOf(Date);
  });

  it('should fetch purchase order with supplier', async () => {
    // Create supplier first
    const supplierResult = await db.insert(suppliersTable)
      .values({
        name: 'Test Supplier',
        email: 'supplier@test.com',
        phone: '987-654-3210',
        address: '456 Supplier Ave'
      })
      .returning()
      .execute();

    const supplier = supplierResult[0];

    // Create purchase order
    await db.insert(ordersTable)
      .values({
        order_number: 'PO-001',
        type: 'purchase',
        customer_id: null,
        supplier_id: supplier.id,
        status: 'confirmed',
        total_amount: '250.75',
        order_date: new Date('2024-01-20')
      })
      .execute();

    const orders = await getOrders();

    expect(orders).toHaveLength(1);
    expect(orders[0].order_number).toEqual('PO-001');
    expect(orders[0].type).toEqual('purchase');
    expect(orders[0].customer_id).toBeNull();
    expect(orders[0].supplier_id).toEqual(supplier.id);
    expect(orders[0].status).toEqual('confirmed');
    expect(orders[0].total_amount).toEqual(250.75);
    expect(typeof orders[0].total_amount).toEqual('number');
  });

  it('should fetch multiple orders with different types', async () => {
    // Create customer and supplier
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Customer One',
        email: 'customer1@test.com',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const supplierResult = await db.insert(suppliersTable)
      .values({
        name: 'Supplier One',
        email: null,
        phone: '555-0001',
        address: null
      })
      .returning()
      .execute();

    // Create multiple orders
    await db.insert(ordersTable)
      .values([
        {
          order_number: 'SO-002',
          type: 'sales',
          customer_id: customerResult[0].id,
          supplier_id: null,
          status: 'shipped',
          total_amount: '99.99',
          order_date: new Date('2024-01-10')
        },
        {
          order_number: 'PO-002',
          type: 'purchase',
          customer_id: null,
          supplier_id: supplierResult[0].id,
          status: 'delivered',
          total_amount: '199.50',
          order_date: new Date('2024-01-12')
        }
      ])
      .execute();

    const orders = await getOrders();

    expect(orders).toHaveLength(2);
    
    // Check that we have both types
    const salesOrder = orders.find(o => o.type === 'sales');
    const purchaseOrder = orders.find(o => o.type === 'purchase');
    
    expect(salesOrder).toBeDefined();
    expect(purchaseOrder).toBeDefined();
    
    expect(salesOrder!.customer_id).toEqual(customerResult[0].id);
    expect(salesOrder!.supplier_id).toBeNull();
    expect(salesOrder!.total_amount).toEqual(99.99);
    
    expect(purchaseOrder!.customer_id).toBeNull();
    expect(purchaseOrder!.supplier_id).toEqual(supplierResult[0].id);
    expect(purchaseOrder!.total_amount).toEqual(199.50);
  });

  it('should handle orders with different statuses', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Status Test Customer',
        email: 'status@test.com',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    // Create orders with different statuses
    await db.insert(ordersTable)
      .values([
        {
          order_number: 'SO-003',
          type: 'sales',
          customer_id: customerResult[0].id,
          supplier_id: null,
          status: 'pending',
          total_amount: '50.00',
          order_date: new Date('2024-01-01')
        },
        {
          order_number: 'SO-004',
          type: 'sales',
          customer_id: customerResult[0].id,
          supplier_id: null,
          status: 'cancelled',
          total_amount: '75.25',
          order_date: new Date('2024-01-02')
        }
      ])
      .execute();

    const orders = await getOrders();

    expect(orders).toHaveLength(2);
    
    const statuses = orders.map(o => o.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('cancelled');
    
    // Verify numeric conversion works for all orders
    orders.forEach(order => {
      expect(typeof order.total_amount).toEqual('number');
      expect(order.total_amount).toBeGreaterThan(0);
    });
  });
});
