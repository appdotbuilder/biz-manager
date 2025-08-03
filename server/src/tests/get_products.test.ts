
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    
    expect(result).toEqual([]);
  });

  it('should return all products', async () => {
    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          description: 'First product',
          sku: 'SKU001',
          price: '19.99',
          cost: '10.50'
        },
        {
          name: 'Product 2',
          description: 'Second product',
          sku: 'SKU002',
          price: '29.99',
          cost: '15.75'
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    
    // Check first product
    expect(result[0].name).toEqual('Product 1');
    expect(result[0].description).toEqual('First product');
    expect(result[0].sku).toEqual('SKU001');
    expect(result[0].price).toEqual(19.99);
    expect(result[0].cost).toEqual(10.50);
    expect(typeof result[0].price).toEqual('number');
    expect(typeof result[0].cost).toEqual('number');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second product
    expect(result[1].name).toEqual('Product 2');
    expect(result[1].description).toEqual('Second product');
    expect(result[1].sku).toEqual('SKU002');
    expect(result[1].price).toEqual(29.99);
    expect(result[1].cost).toEqual(15.75);
    expect(typeof result[1].price).toEqual('number');
    expect(typeof result[1].cost).toEqual('number');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle products with null descriptions', async () => {
    await db.insert(productsTable)
      .values({
        name: 'Product with null description',
        description: null,
        sku: 'SKU003',
        price: '9.99',
        cost: '5.00'
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Product with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].sku).toEqual('SKU003');
    expect(result[0].price).toEqual(9.99);
    expect(result[0].cost).toEqual(5.00);
  });
});
