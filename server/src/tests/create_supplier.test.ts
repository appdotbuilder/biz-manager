
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { createSupplier } from '../handlers/create_supplier';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateSupplierInput = {
  name: 'Test Supplier Inc.',
  email: 'supplier@test.com',
  phone: '+1-555-123-4567',
  address: '123 Business Park, Suite 100, Test City, TC 12345'
};

// Test input with minimal required fields
const minimalInput: CreateSupplierInput = {
  name: 'Minimal Supplier',
  email: null,
  phone: null,
  address: null
};

describe('createSupplier', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a supplier with all fields', async () => {
    const result = await createSupplier(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Supplier Inc.');
    expect(result.email).toEqual('supplier@test.com');
    expect(result.phone).toEqual('+1-555-123-4567');
    expect(result.address).toEqual('123 Business Park, Suite 100, Test City, TC 12345');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a supplier with minimal fields', async () => {
    const result = await createSupplier(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Supplier');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save supplier to database', async () => {
    const result = await createSupplier(testInput);

    // Query using proper drizzle syntax
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, result.id))
      .execute();

    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toEqual('Test Supplier Inc.');
    expect(suppliers[0].email).toEqual('supplier@test.com');
    expect(suppliers[0].phone).toEqual('+1-555-123-4567');
    expect(suppliers[0].address).toEqual('123 Business Park, Suite 100, Test City, TC 12345');
    expect(suppliers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle email validation correctly', async () => {
    const validEmailInput: CreateSupplierInput = {
      name: 'Email Test Supplier',
      email: 'valid@email.com',
      phone: null,
      address: null
    };

    const result = await createSupplier(validEmailInput);
    expect(result.email).toEqual('valid@email.com');

    // Verify in database
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, result.id))
      .execute();

    expect(suppliers[0].email).toEqual('valid@email.com');
  });

  it('should generate unique IDs for multiple suppliers', async () => {
    const result1 = await createSupplier({
      name: 'Supplier One',
      email: null,
      phone: null,
      address: null
    });

    const result2 = await createSupplier({
      name: 'Supplier Two',
      email: null,
      phone: null,
      address: null
    });

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both exist in database
    const suppliers = await db.select()
      .from(suppliersTable)
      .execute();

    expect(suppliers).toHaveLength(2);
    expect(suppliers.map(s => s.name)).toContain('Supplier One');
    expect(suppliers.map(s => s.name)).toContain('Supplier Two');
  });
});
