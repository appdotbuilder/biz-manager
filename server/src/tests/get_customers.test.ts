
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

// Test customer data
const testCustomer1: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main St, City, State'
};

const testCustomer2: CreateCustomerInput = {
  name: 'Jane Smith', 
  email: 'jane@example.com',
  phone: '+0987654321',
  address: '456 Oak Ave, Town, State'
};

const testCustomer3: CreateCustomerInput = {
  name: 'Bob Johnson',
  email: null,
  phone: null,
  address: null
};

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    
    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create test customers
    await db.insert(customersTable)
      .values([testCustomer1, testCustomer2, testCustomer3])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    
    // Verify first customer
    const customer1 = result.find(c => c.name === 'John Doe');
    expect(customer1).toBeDefined();
    expect(customer1!.email).toEqual('john@example.com');
    expect(customer1!.phone).toEqual('+1234567890');
    expect(customer1!.address).toEqual('123 Main St, City, State');
    expect(customer1!.id).toBeDefined();
    expect(customer1!.created_at).toBeInstanceOf(Date);

    // Verify second customer
    const customer2 = result.find(c => c.name === 'Jane Smith');
    expect(customer2).toBeDefined();
    expect(customer2!.email).toEqual('jane@example.com');
    expect(customer2!.phone).toEqual('+0987654321');
    expect(customer2!.address).toEqual('456 Oak Ave, Town, State');

    // Verify third customer with null values
    const customer3 = result.find(c => c.name === 'Bob Johnson');
    expect(customer3).toBeDefined();
    expect(customer3!.email).toBeNull();
    expect(customer3!.phone).toBeNull();
    expect(customer3!.address).toBeNull();
  });

  it('should return customers in order of creation', async () => {
    // Insert customers one by one to ensure order
    await db.insert(customersTable).values(testCustomer1).execute();
    await db.insert(customersTable).values(testCustomer2).execute();
    await db.insert(customersTable).values(testCustomer3).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    
    // Verify order by checking IDs are ascending
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
    
    // Verify names are in expected order
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[2].name).toEqual('Bob Johnson');
  });
});
