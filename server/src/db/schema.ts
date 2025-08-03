
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
export const orderTypeEnum = pgEnum('order_type', ['sales', 'purchase']);
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue', 'cancelled']);

// Warehouses table
export const warehousesTable = pgTable('warehouses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku').notNull().unique(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Inventory table
export const inventoryTable = pgTable('inventory', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  warehouse_id: integer('warehouse_id').notNull().references(() => warehousesTable.id),
  quantity: integer('quantity').notNull(),
  reorder_level: integer('reorder_level').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Suppliers table
export const suppliersTable = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  order_number: text('order_number').notNull().unique(),
  type: orderTypeEnum('type').notNull(),
  customer_id: integer('customer_id').references(() => customersTable.id),
  supplier_id: integer('supplier_id').references(() => suppliersTable.id),
  status: orderStatusEnum('status').notNull().default('pending'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  order_date: timestamp('order_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Order items table
export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => ordersTable.id),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

// Invoices table
export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: text('invoice_number').notNull().unique(),
  order_id: integer('order_id').references(() => ordersTable.id),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  tax_amount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  payment_status: paymentStatusEnum('payment_status').notNull().default('pending'),
  issue_date: timestamp('issue_date').notNull(),
  due_date: timestamp('due_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Expenses table
export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  expense_date: timestamp('expense_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  invoice_id: integer('invoice_id').references(() => invoicesTable.id),
  expense_id: integer('expense_id').references(() => expensesTable.id),
  transaction_date: timestamp('transaction_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const warehousesRelations = relations(warehousesTable, ({ many }) => ({
  inventory: many(inventoryTable),
}));

export const productsRelations = relations(productsTable, ({ many }) => ({
  inventory: many(inventoryTable),
  orderItems: many(orderItemsTable),
}));

export const inventoryRelations = relations(inventoryTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [inventoryTable.product_id],
    references: [productsTable.id],
  }),
  warehouse: one(warehousesTable, {
    fields: [inventoryTable.warehouse_id],
    references: [warehousesTable.id],
  }),
}));

export const customersRelations = relations(customersTable, ({ many }) => ({
  orders: many(ordersTable),
  invoices: many(invoicesTable),
}));

export const suppliersRelations = relations(suppliersTable, ({ many }) => ({
  orders: many(ordersTable),
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [ordersTable.customer_id],
    references: [customersTable.id],
  }),
  supplier: one(suppliersTable, {
    fields: [ordersTable.supplier_id],
    references: [suppliersTable.id],
  }),
  orderItems: many(orderItemsTable),
  invoices: many(invoicesTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id],
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const invoicesRelations = relations(invoicesTable, ({ one, many }) => ({
  order: one(ordersTable, {
    fields: [invoicesTable.order_id],
    references: [ordersTable.id],
  }),
  customer: one(customersTable, {
    fields: [invoicesTable.customer_id],
    references: [customersTable.id],
  }),
  transactions: many(transactionsTable),
}));

export const expensesRelations = relations(expensesTable, ({ many }) => ({
  transactions: many(transactionsTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  invoice: one(invoicesTable, {
    fields: [transactionsTable.invoice_id],
    references: [invoicesTable.id],
  }),
  expense: one(expensesTable, {
    fields: [transactionsTable.expense_id],
    references: [expensesTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  warehouses: warehousesTable,
  products: productsTable,
  inventory: inventoryTable,
  customers: customersTable,
  suppliers: suppliersTable,
  orders: ordersTable,
  orderItems: orderItemsTable,
  invoices: invoicesTable,
  expenses: expensesTable,
  transactions: transactionsTable,
};
