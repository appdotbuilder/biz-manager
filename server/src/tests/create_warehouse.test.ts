
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { warehousesTable } from '../db/schema';
import { type CreateWarehouseInput } from '../schema';
import { createWarehouse } from '../handlers/create_warehouse';
import { eq } from 'drizzle-orm';

const testInput: CreateWarehouseInput = {
  name: 'Main Warehouse',
  location: '123 Storage St, City, State 12345',
  description: 'Primary storage facility for all products'
};

const testInputNullDescription: CreateWarehouseInput = {
  name: 'Secondary Warehouse',
  location: '456 Storage Ave, City, State 67890',
  description: null
};

describe('createWarehouse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a warehouse with description', async () => {
    const result = await createWarehouse(testInput);

    expect(result.name).toEqual('Main Warehouse');
    expect(result.location).toEqual('123 Storage St, City, State 12345');
    expect(result.description).toEqual('Primary storage facility for all products');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a warehouse with null description', async () => {
    const result = await createWarehouse(testInputNullDescription);

    expect(result.name).toEqual('Secondary Warehouse');
    expect(result.location).toEqual('456 Storage Ave, City, State 67890');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save warehouse to database', async () => {
    const result = await createWarehouse(testInput);

    const warehouses = await db.select()
      .from(warehousesTable)
      .where(eq(warehousesTable.id, result.id))
      .execute();

    expect(warehouses).toHaveLength(1);
    expect(warehouses[0].name).toEqual('Main Warehouse');
    expect(warehouses[0].location).toEqual('123 Storage St, City, State 12345');
    expect(warehouses[0].description).toEqual('Primary storage facility for all products');
    expect(warehouses[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple warehouses', async () => {
    const result1 = await createWarehouse(testInput);
    const result2 = await createWarehouse(testInputNullDescription);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toBeGreaterThan(0);
    expect(result2.id).toBeGreaterThan(0);
  });
});
