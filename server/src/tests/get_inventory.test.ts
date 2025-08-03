
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { warehousesTable, productsTable, inventoryTable } from '../db/schema';
import { getInventory } from '../handlers/get_inventory';

describe('getInventory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no inventory exists', async () => {
    const result = await getInventory();
    expect(result).toEqual([]);
  });

  it('should fetch all inventory records', async () => {
    // Create prerequisite data
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

    // Create inventory record
    await db.insert(inventoryTable)
      .values({
        product_id: product[0].id,
        warehouse_id: warehouse[0].id,
        quantity: 100,
        reorder_level: 20
      })
      .execute();

    const result = await getInventory();

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toEqual(product[0].id);
    expect(result[0].warehouse_id).toEqual(warehouse[0].id);
    expect(result[0].quantity).toEqual(100);
    expect(result[0].reorder_level).toEqual(20);
    expect(result[0].id).toBeDefined();
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple inventory records', async () => {
    // Create prerequisite data
    const warehouse1 = await db.insert(warehousesTable)
      .values({
        name: 'Warehouse 1',
        location: 'Location 1',
        description: null
      })
      .returning()
      .execute();

    const warehouse2 = await db.insert(warehousesTable)
      .values({
        name: 'Warehouse 2',
        location: 'Location 2',
        description: null
      })
      .returning()
      .execute();

    const product1 = await db.insert(productsTable)
      .values({
        name: 'Product 1',
        description: null,
        sku: 'PROD-001',
        price: '15.00',
        cost: '8.00'
      })
      .returning()
      .execute();

    const product2 = await db.insert(productsTable)
      .values({
        name: 'Product 2',
        description: null,
        sku: 'PROD-002',
        price: '25.00',
        cost: '12.00'
      })
      .returning()
      .execute();

    // Create multiple inventory records
    await db.insert(inventoryTable)
      .values([
        {
          product_id: product1[0].id,
          warehouse_id: warehouse1[0].id,
          quantity: 50,
          reorder_level: 10
        },
        {
          product_id: product2[0].id,
          warehouse_id: warehouse2[0].id,
          quantity: 75,
          reorder_level: 15
        }
      ])
      .execute();

    const result = await getInventory();

    expect(result).toHaveLength(2);
    
    // Verify first inventory record
    const firstRecord = result.find(r => r.product_id === product1[0].id);
    expect(firstRecord).toBeDefined();
    expect(firstRecord!.warehouse_id).toEqual(warehouse1[0].id);
    expect(firstRecord!.quantity).toEqual(50);
    expect(firstRecord!.reorder_level).toEqual(10);
    expect(firstRecord!.updated_at).toBeInstanceOf(Date);

    // Verify second inventory record
    const secondRecord = result.find(r => r.product_id === product2[0].id);
    expect(secondRecord).toBeDefined();
    expect(secondRecord!.warehouse_id).toEqual(warehouse2[0].id);
    expect(secondRecord!.quantity).toEqual(75);
    expect(secondRecord!.reorder_level).toEqual(15);
    expect(secondRecord!.updated_at).toBeInstanceOf(Date);
  });
});
