
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { warehousesTable } from '../db/schema';
import { getWarehouses } from '../handlers/get_warehouses';

describe('getWarehouses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no warehouses exist', async () => {
    const result = await getWarehouses();
    expect(result).toEqual([]);
  });

  it('should return all warehouses', async () => {
    // Create test warehouses
    await db.insert(warehousesTable)
      .values([
        {
          name: 'Main Warehouse',
          location: 'New York',
          description: 'Primary storage facility'
        },
        {
          name: 'Secondary Warehouse',
          location: 'Los Angeles',
          description: null
        }
      ])
      .execute();

    const result = await getWarehouses();

    expect(result).toHaveLength(2);
    
    // Check first warehouse
    expect(result[0].name).toEqual('Main Warehouse');
    expect(result[0].location).toEqual('New York');
    expect(result[0].description).toEqual('Primary storage facility');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second warehouse
    expect(result[1].name).toEqual('Secondary Warehouse');
    expect(result[1].location).toEqual('Los Angeles');
    expect(result[1].description).toBeNull();
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return warehouses ordered by id', async () => {
    // Create warehouses in reverse alphabetical order
    await db.insert(warehousesTable)
      .values([
        {
          name: 'Zebra Warehouse',
          location: 'Chicago',
          description: 'Last warehouse'
        },
        {
          name: 'Alpha Warehouse',
          location: 'Boston',
          description: 'First warehouse'
        }
      ])
      .execute();

    const result = await getWarehouses();

    expect(result).toHaveLength(2);
    // Should be ordered by id (insertion order), not by name
    expect(result[0].name).toEqual('Zebra Warehouse');
    expect(result[1].name).toEqual('Alpha Warehouse');
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});
