
import { z } from 'zod';

// Enums
export const orderStatusEnum = z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
export const orderTypeEnum = z.enum(['sales', 'purchase']);
export const transactionTypeEnum = z.enum(['income', 'expense']);
export const paymentStatusEnum = z.enum(['pending', 'paid', 'overdue', 'cancelled']);

// Warehouse schema
export const warehouseSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Warehouse = z.infer<typeof warehouseSchema>;

export const createWarehouseInputSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  description: z.string().nullable()
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseInputSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  sku: z.string(),
  price: z.number(),
  cost: z.number(),
  created_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  sku: z.string().min(1),
  price: z.number().positive(),
  cost: z.number().nonnegative()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Inventory schema
export const inventorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  warehouse_id: z.number(),
  quantity: z.number().int(),
  reorder_level: z.number().int(),
  updated_at: z.coerce.date()
});

export type Inventory = z.infer<typeof inventorySchema>;

export const updateInventoryInputSchema = z.object({
  product_id: z.number(),
  warehouse_id: z.number(),
  quantity: z.number().int().nonnegative(),
  reorder_level: z.number().int().nonnegative().optional()
});

export type UpdateInventoryInput = z.infer<typeof updateInventoryInputSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Supplier schema
export const supplierSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Supplier = z.infer<typeof supplierSchema>;

export const createSupplierInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  order_number: z.string(),
  type: orderTypeEnum,
  customer_id: z.number().nullable(),
  supplier_id: z.number().nullable(),
  status: orderStatusEnum,
  total_amount: z.number(),
  order_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  type: orderTypeEnum,
  customer_id: z.number().nullable(),
  supplier_id: z.number().nullable(),
  order_date: z.coerce.date().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

// Order Item schema
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const createOrderItemInputSchema = z.object({
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive()
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemInputSchema>;

// Invoice schema
export const invoiceSchema = z.object({
  id: z.number(),
  invoice_number: z.string(),
  order_id: z.number().nullable(),
  customer_id: z.number(),
  amount: z.number(),
  tax_amount: z.number(),
  total_amount: z.number(),
  payment_status: paymentStatusEnum,
  issue_date: z.coerce.date(),
  due_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const createInvoiceInputSchema = z.object({
  order_id: z.number().nullable(),
  customer_id: z.number(),
  amount: z.number().positive(),
  tax_amount: z.number().nonnegative(),
  due_date: z.coerce.date(),
  issue_date: z.coerce.date().optional()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

// Expense schema
export const expenseSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  expense_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseInputSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  expense_date: z.coerce.date().optional()
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  type: transactionTypeEnum,
  amount: z.number(),
  description: z.string(),
  invoice_id: z.number().nullable(),
  expense_id: z.number().nullable(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  type: transactionTypeEnum,
  amount: z.number().positive(),
  description: z.string().min(1),
  invoice_id: z.number().nullable(),
  expense_id: z.number().nullable(),
  transaction_date: z.coerce.date().optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;
