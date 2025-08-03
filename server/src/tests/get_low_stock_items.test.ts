
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { warehousesTable, productsTable, inventoryTable } from '../db/schema';
import { getLowStockItems } from '../handlers/get_low_stock_items';

describe('getLowStockItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no low stock items exist', async () => {
    const result = await getLowStockItems();
    expect(result).toEqual([]);
  });

  it('should return items where quantity is below reorder level', async () => {
    // Create prerequisite warehouse and product
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Main Warehouse',
        location: 'New York',
        description: 'Primary storage facility'
      })
      .returning()
      .execute();

    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        sku: 'TEST-001',
        price: '19.99',
        cost: '10.00'
      })
      .returning()
      .execute();

    // Create inventory item with low stock (quantity < reorder_level)
    await db.insert(inventoryTable)
      .values({
        product_id: product[0].id,
        warehouse_id: warehouse[0].id,
        quantity: 5,
        reorder_level: 10
      })
      .execute();

    const result = await getLowStockItems();

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
    expect(result[0].reorder_level).toBe(10);
    expect(result[0].product_id).toBe(product[0].id);
    expect(result[0].warehouse_id).toBe(warehouse[0].id);
  });

  it('should not return items where quantity equals or exceeds reorder level', async () => {
    // Create prerequisite warehouse and products
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Main Warehouse',
        location: 'New York',
        description: 'Primary storage facility'
      })
      .returning()
      .execute();

    const product1 = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'First product',
        sku: 'PROD-001',
        price: '19.99',
        cost: '10.00'
      })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Second product',
        sku: 'PROD-002',
        price: '29.99',
        cost: '15.00'
      })
      .returning()
      .execute();

    // Create inventory items with adequate stock
    await db.insert(inventoryTable)
      .values([
        {
          product_id: product1[0].id,
          warehouse_id: warehouse[0].id,
          quantity: 10, // equals reorder level
          reorder_level: 10
        },
        {
          product_id: product2[0].id,
          warehouse_id: warehouse[0].id,
          quantity: 15, // exceeds reorder level
          reorder_level: 10
        }
      ])
      .execute();

    const result = await getLowStockItems();
    expect(result).toHaveLength(0);
  });

  it('should return multiple low stock items', async () => {
    // Create prerequisite warehouse and products
    const warehouse = await db.insert(warehousesTable)
      .values({
        name: 'Main Warehouse',
        location: 'New York',
        description: 'Primary storage facility'
      })
      .returning()
      .execute();

    const product1 = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: 'First product',
        sku: 'PROD-001',
        price: '19.99',
        cost: '10.00'
      })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: 'Second product',
        sku: 'PROD-002',
        price: '29.99',
        cost: '15.00'
      })
      .returning()
      .execute();

    // Create multiple inventory items with low stock
    await db.insert(inventoryTable)
      .values([
        {
          product_id: product1[0].id,
          warehouse_id: warehouse[0].id,
          quantity: 3,
          reorder_level: 10
        },
        {
          product_id: product2[0].id,
          warehouse_id: warehouse[0].id,
          quantity: 7,
          reorder_level: 15
        }
      ])
      .execute();

    const result = await getLowStockItems();

    expect(result).toHaveLength(2);
    
    // Check first item
    const item1 = result.find(item => item.product_id === product1[0].id);
    expect(item1).toBeDefined();
    expect(item1!.quantity).toBe(3);
    expect(item1!.reorder_level).toBe(10);

    // Check second item
    const item2 = result.find(item => item.product_id === product2[0].id);
    expect(item2).toBeDefined();
    expect(item2!.quantity).toBe(7);
    expect(item2!.reorder_level).toBe(15);
  });
});
