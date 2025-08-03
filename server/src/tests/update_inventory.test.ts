
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryTable, productsTable, warehousesTable } from '../db/schema';
import { type UpdateInventoryInput } from '../schema';
import { updateInventory } from '../handlers/update_inventory';
import { eq, and } from 'drizzle-orm';

describe('updateInventory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let productId: number;
  let warehouseId: number;

  beforeEach(async () => {
    // Create test warehouse
    const warehouseResult = await db.insert(warehousesTable)
      .values({
        name: 'Test Warehouse',
        location: 'Test Location',
        description: 'Test Description'
      })
      .returning()
      .execute();
    warehouseId = warehouseResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'Test Description',
        sku: 'TEST-001',
        price: '19.99',
        cost: '10.00'
      })
      .returning()
      .execute();
    productId = productResult[0].id;
  });

  it('should create new inventory record when none exists', async () => {
    const input: UpdateInventoryInput = {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: 100,
      reorder_level: 20
    };

    const result = await updateInventory(input);

    expect(result.product_id).toBe(productId);
    expect(result.warehouse_id).toBe(warehouseId);
    expect(result.quantity).toBe(100);
    expect(result.reorder_level).toBe(20);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing inventory record', async () => {
    // Create initial inventory record
    const initialRecord = await db.insert(inventoryTable)
      .values({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: 50,
        reorder_level: 10,
        updated_at: new Date()
      })
      .returning()
      .execute();

    const input: UpdateInventoryInput = {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: 150,
      reorder_level: 25
    };

    const result = await updateInventory(input);

    expect(result.id).toBe(initialRecord[0].id);
    expect(result.quantity).toBe(150);
    expect(result.reorder_level).toBe(25);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should use default reorder_level when not provided for new record', async () => {
    const input: UpdateInventoryInput = {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: 75
    };

    const result = await updateInventory(input);

    expect(result.quantity).toBe(75);
    expect(result.reorder_level).toBe(10); // Default value
  });

  it('should not update reorder_level when not provided for existing record', async () => {
    // Create initial inventory record
    await db.insert(inventoryTable)
      .values({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: 50,
        reorder_level: 15,
        updated_at: new Date()
      })
      .returning()
      .execute();

    const input: UpdateInventoryInput = {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: 200
    };

    const result = await updateInventory(input);

    expect(result.quantity).toBe(200);
    expect(result.reorder_level).toBe(15); // Should remain unchanged
  });

  it('should save inventory record to database', async () => {
    const input: UpdateInventoryInput = {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: 300,
      reorder_level: 30
    };

    const result = await updateInventory(input);

    const savedRecord = await db.select()
      .from(inventoryTable)
      .where(eq(inventoryTable.id, result.id))
      .execute();

    expect(savedRecord).toHaveLength(1);
    expect(savedRecord[0].quantity).toBe(300);
    expect(savedRecord[0].reorder_level).toBe(30);
    expect(savedRecord[0].product_id).toBe(productId);
    expect(savedRecord[0].warehouse_id).toBe(warehouseId);
  });

  it('should throw error for non-existent product', async () => {
    const input: UpdateInventoryInput = {
      product_id: 99999,
      warehouse_id: warehouseId,
      quantity: 100
    };

    await expect(updateInventory(input)).rejects.toThrow(/product.*not found/i);
  });

  it('should throw error for non-existent warehouse', async () => {
    const input: UpdateInventoryInput = {
      product_id: productId,
      warehouse_id: 99999,
      quantity: 100
    };

    await expect(updateInventory(input)).rejects.toThrow(/warehouse.*not found/i);
  });

  it('should handle zero quantity correctly', async () => {
    const input: UpdateInventoryInput = {
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: 0,
      reorder_level: 5
    };

    const result = await updateInventory(input);

    expect(result.quantity).toBe(0);
    expect(result.reorder_level).toBe(5);
  });

  it('should query inventory by product and warehouse correctly', async () => {
    // Create inventory record
    await updateInventory({
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: 250,
      reorder_level: 35
    });

    // Query with proper drizzle syntax
    const inventory = await db.select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.product_id, productId),
          eq(inventoryTable.warehouse_id, warehouseId)
        )
      )
      .execute();

    expect(inventory).toHaveLength(1);
    expect(inventory[0].quantity).toBe(250);
    expect(inventory[0].reorder_level).toBe(35);
    expect(inventory[0].updated_at).toBeInstanceOf(Date);
  });
});
