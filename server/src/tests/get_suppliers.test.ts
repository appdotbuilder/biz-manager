
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { getSuppliers } from '../handlers/get_suppliers';

const testSupplier1: CreateSupplierInput = {
  name: 'ABC Supplies',
  email: 'contact@abcsupplies.com',
  phone: '555-0101',
  address: '123 Supply St, Business City, BC 12345'
};

const testSupplier2: CreateSupplierInput = {
  name: 'XYZ Manufacturing',
  email: null,
  phone: '555-0202',
  address: null
};

describe('getSuppliers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no suppliers exist', async () => {
    const result = await getSuppliers();
    expect(result).toEqual([]);
  });

  it('should return all suppliers', async () => {
    // Create test suppliers
    await db.insert(suppliersTable)
      .values([testSupplier1, testSupplier2])
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(2);
    
    // Verify first supplier
    const supplier1 = result.find(s => s.name === 'ABC Supplies');
    expect(supplier1).toBeDefined();
    expect(supplier1!.email).toEqual('contact@abcsupplies.com');
    expect(supplier1!.phone).toEqual('555-0101');
    expect(supplier1!.address).toEqual('123 Supply St, Business City, BC 12345');
    expect(supplier1!.id).toBeDefined();
    expect(supplier1!.created_at).toBeInstanceOf(Date);

    // Verify second supplier
    const supplier2 = result.find(s => s.name === 'XYZ Manufacturing');
    expect(supplier2).toBeDefined();
    expect(supplier2!.email).toBeNull();
    expect(supplier2!.phone).toEqual('555-0202');
    expect(supplier2!.address).toBeNull();
    expect(supplier2!.id).toBeDefined();
    expect(supplier2!.created_at).toBeInstanceOf(Date);
  });

  it('should return suppliers with correct field types', async () => {
    await db.insert(suppliersTable)
      .values(testSupplier1)
      .execute();

    const result = await getSuppliers();

    expect(result).toHaveLength(1);
    const supplier = result[0];
    
    expect(typeof supplier.id).toBe('number');
    expect(typeof supplier.name).toBe('string');
    expect(typeof supplier.phone).toBe('string');
    expect(typeof supplier.email).toBe('string');
    expect(typeof supplier.address).toBe('string');
    expect(supplier.created_at).toBeInstanceOf(Date);
  });
});
