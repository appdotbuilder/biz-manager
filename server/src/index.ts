
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createWarehouseInputSchema,
  createProductInputSchema,
  updateInventoryInputSchema,
  createCustomerInputSchema,
  createSupplierInputSchema,
  createOrderInputSchema,
  createOrderItemInputSchema,
  createInvoiceInputSchema,
  createExpenseInputSchema,
  createTransactionInputSchema
} from './schema';

// Import handlers
import { createWarehouse } from './handlers/create_warehouse';
import { getWarehouses } from './handlers/get_warehouses';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { updateInventory } from './handlers/update_inventory';
import { getInventory } from './handlers/get_inventory';
import { getLowStockItems } from './handlers/get_low_stock_items';
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { createSupplier } from './handlers/create_supplier';
import { getSuppliers } from './handlers/get_suppliers';
import { createOrder } from './handlers/create_order';
import { getOrders } from './handlers/get_orders';
import { createOrderItem } from './handlers/create_order_item';
import { getOrderItems } from './handlers/get_order_items';
import { createInvoice } from './handlers/create_invoice';
import { getInvoices } from './handlers/get_invoices';
import { getOverdueInvoices } from './handlers/get_overdue_invoices';
import { createExpense }  from './handlers/create_expense';
import { getExpenses } from './handlers/get_expenses';
import { getExpensesByCategory } from './handlers/get_expenses_by_category';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { getFinancialSummary } from './handlers/get_financial_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Warehouse management
  createWarehouse: publicProcedure
    .input(createWarehouseInputSchema)
    .mutation(({ input }) => createWarehouse(input)),
  getWarehouses: publicProcedure
    .query(() => getWarehouses()),

  // Product management
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  getProducts: publicProcedure
    .query(() => getProducts()),

  // Inventory management
  updateInventory: publicProcedure
    .input(updateInventoryInputSchema)
    .mutation(({ input }) => updateInventory(input)),
  getInventory: publicProcedure
    .query(() => getInventory()),
  getLowStockItems: publicProcedure
    .query(() => getLowStockItems()),

  // Customer management
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  getCustomers: publicProcedure
    .query(() => getCustomers()),

  // Supplier management
  createSupplier: publicProcedure
    .input(createSupplierInputSchema)
    .mutation(({ input }) => createSupplier(input)),
  getSuppliers: publicProcedure
    .query(() => getSuppliers()),

  // Order management
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),
  getOrders: publicProcedure
    .query(() => getOrders()),
  createOrderItem: publicProcedure
    .input(createOrderItemInputSchema)
    .mutation(({ input }) => createOrderItem(input)),
  getOrderItems: publicProcedure
    .input(z.number())
    .query(({ input }) => getOrderItems(input)),

  // Invoice management
  createInvoice: publicProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  getInvoices: publicProcedure
    .query(() => getInvoices()),
  getOverdueInvoices: publicProcedure
    .query(() => getOverdueInvoices()),

  // Expense management
  createExpense: publicProcedure
    .input(createExpenseInputSchema)
    .mutation(({ input }) => createExpense(input)),
  getExpenses: publicProcedure
    .query(() => getExpenses()),
  getExpensesByCategory: publicProcedure
    .query(() => getExpensesByCategory()),

  // Transaction management
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  getTransactions: publicProcedure
    .query(() => getTransactions()),

  // Financial reporting
  getFinancialSummary: publicProcedure
    .query(() => getFinancialSummary()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
