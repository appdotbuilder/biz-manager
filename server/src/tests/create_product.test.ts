
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  sku: 'TEST-001',
  price: 19.99,
  cost: 15.50
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual(testInput.description);
    expect(result.sku).toEqual('TEST-001');
    expect(result.price).toEqual(19.99);
    expect(result.cost).toEqual(15.50);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify price and cost are numbers, not strings
    expect(typeof result.price).toBe('number');
    expect(typeof result.cost).toBe('number');
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].description).toEqual(testInput.description);
    expect(products[0].sku).toEqual('TEST-001');
    expect(parseFloat(products[0].price)).toEqual(19.99);
    expect(parseFloat(products[0].cost)).toEqual(15.50);
    expect(products[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle products with null description', async () => {
    const inputWithNullDescription: CreateProductInput = {
      name: 'Product Without Description',
      description: null,
      sku: 'NO-DESC-001',
      price: 25.00,
      cost: 20.00
    };

    const result = await createProduct(inputWithNullDescription);

    expect(result.name).toEqual('Product Without Description');
    expect(result.description).toBeNull();
    expect(result.sku).toEqual('NO-DESC-001');
    expect(result.price).toEqual(25.00);
    expect(result.cost).toEqual(20.00);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should fail for duplicate SKU', async () => {
    // Create first product
    await createProduct(testInput);

    // Try to create another product with same SKU
    const duplicateSkuInput: CreateProductInput = {
      name: 'Another Product',
      description: 'Different product, same SKU',
      sku: 'TEST-001', // Same SKU as first product
      price: 29.99,
      cost: 25.00
    };

    await expect(createProduct(duplicateSkuInput)).rejects.toThrow(/unique/i);
  });
});
