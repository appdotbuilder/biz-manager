
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  TrendingDown, 
  Plus,
  AlertCircle,
  Calculator
} from 'lucide-react';
import type { 
  Invoice, 
  CreateInvoiceInput, 
  Expense, 
  CreateExpenseInput, 
  Transaction,
  CreateTransactionInput,
  Customer
} from '../../../server/src/schema';
import type { FinancialSummary } from '../../../server/src/handlers/get_financial_summary';

export function FinancialManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceInput>({
    order_id: null,
    customer_id: 0,
    amount: 0,
    tax_amount: 0,
    due_date: new Date(),
    issue_date: new Date()
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState<CreateExpenseInput>({
    description: '',
    amount: 0,
    category: '',
    expense_date: new Date()
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState<CreateTransactionInput>({
    type: 'income',
    amount: 0,
    description: '',
    invoice_id: null,
    expense_id: null,
    transaction_date: new Date()
  });

  const loadData = useCallback(async () => {
    try {
      const [
        invoicesData,
        expensesData,
        transactionsData,
        customersData,
        financialData
      ] = await Promise.all([
        trpc.getInvoices.query(),
        trpc.getExpenses.query(),
        trpc.getTransactions.query(),
        trpc.getCustomers.query(),
        trpc.getFinancialSummary.query()
      ]);
      
      setInvoices(invoicesData);
      setExpenses(expensesData);
      setTransactions(transactionsData);
      setCustomers(customersData);
      setFinancialSummary(financialData);
    } catch (error) {
      console.error('Failed to load financial data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newInvoice = await trpc.createInvoice.mutate(invoiceForm);
      setInvoices((prev: Invoice[]) => [...prev, newInvoice]);
      setInvoiceForm({
        order_id: null,
        customer_id: 0,
        amount: 0,
        tax_amount: 0,
        due_date: new Date(),
        issue_date: new Date()
      });
      loadData(); // Refresh financial summary
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newExpense = await trpc.createExpense.mutate(expenseForm);
      setExpenses((prev: Expense[]) => [...prev, newExpense]);
      setExpenseForm({
        description: '',
        amount: 0,
        category: '',
        expense_date: new Date()
      });
      loadData(); // Refresh financial summary
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newTransaction = await trpc.createTransaction.mutate(transactionForm);
      setTransactions((prev: Transaction[]) => [...prev, newTransaction]);
      setTransactionForm({
        type: 'income',
        amount: 0,
        description: '',
        invoice_id: null,
        expense_id: null,
        transaction_date: new Date()
      });
      loadData(); // Refresh financial summary
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer ${customerId}`;
  };

  const overdueInvoices =  invoices.filter(invoice => 
    invoice.payment_status !== 'paid' && 
    new Date(invoice.due_date) < new Date()
  );

  const expenseCategories = [...new Set(expenses.map(e => e.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Financial Management
          </h2>
          <p className="text-gray-600">Track invoices, expenses, and financial health</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.netProfit.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.pendingInvoices}</div>
            <div className="text-xs text-orange-100">
              {financialSummary.overdueInvoices} overdue
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Invoices
                </CardTitle>
                <CardDescription>{invoices.length} total invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No invoices yet. Create your first invoice! 📄
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {invoices.map((invoice: Invoice) => (
                      <div key={invoice.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">#{invoice.invoice_number}</h3>
                            <p className="text-sm text-gray-600">
                              {getCustomerName(invoice.customer_id)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Due: {invoice.due_date.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${invoice.total_amount.toFixed(2)}</p>
                            <Badge variant={
                              invoice.payment_status === 'paid' ? 'default' :
                              invoice.payment_status === 'overdue' ? 'destructive' :
                              invoice.payment_status === 'cancelled' ? 'secondary' : 'outline'
                            }>
                              {invoice.payment_status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Overdue Invoices
                </CardTitle>
                <CardDescription>Invoices past their due date</CardDescription>
              </CardHeader>
              <CardContent>
                {overdueInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-600 mb-2">
                      All Caught Up! ✅
                    </h3>
                    <p className="text-gray-600">No overdue invoices.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {overdueInvoices.map((invoice: Invoice) => (
                      <div key={invoice.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-red-800">
                              #{invoice.invoice_number}
                            </h3>
                            <p className="text-sm text-red-600">
                              {getCustomerName(invoice.customer_id)}
                            </p>
                            <p className="text-sm text-red-500">
                              Overdue by {Math.ceil((new Date().getTime() - invoice.due_date.getTime()) / (1000 * 3600 * 24))} days
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-red-700">
                              ${invoice.total_amount.toFixed(2)}
                            </p>
                            <Button size="sm" className="mt-2">
                              Follow Up
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Business Expenses
              </CardTitle>
              <CardDescription>{expenses.length} recorded expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No expenses recorded yet. Track your business costs! 💸
                </p>
              ) : (
                <div className="space-y-3">
                  {expenses.slice().reverse().slice(0, 10).map((expense: Expense) => (
                    <div key={expense.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{expense.description}</h3>
                          <p className="text-sm text-gray-600">
                            Category: {expense.category}
                          </p>
                          <p className="text-sm text-gray-500">
                            {expense.expense_date.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            -${expense.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {expenses.length > 10 && (
                    <p className="text-sm text-gray-500 text-center">
                      Showing latest 10 expenses
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                All Transactions
              </CardTitle>
              <CardDescription>{transactions.length} recorded transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No transactions recorded yet. Start tracking your cash flow! 💰
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice().reverse().slice(0, 15).map((transaction: Transaction) => (
                    <div key={transaction.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{transaction.description}</h3>
                          <p className="text-sm text-gray-500">
                            {transaction.transaction_date.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </p>
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                            {transaction.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 15 && (
                    <p className="text-sm text-gray-500 text-center">
                      Showing latest 15 transactions
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create New Tab */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Create Invoice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  New Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div>
                    <Label>Customer</Label>
                    <Select
                      value={invoiceForm.customer_id > 0 ? invoiceForm.customer_id.toString() : ''}
                      onValueChange={(value: string) =>
                        setInvoiceForm((prev: CreateInvoiceInput) => ({ 
                          ...prev, 
                          customer_id: parseInt(value) || 0
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setInvoiceForm((prev: CreateInvoiceInput) => ({ 
                          ...prev, 
                          amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Tax Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.tax_amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setInvoiceForm((prev: CreateInvoiceInput) => ({ 
                          ...prev, 
                          tax_amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={invoiceForm.due_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setInvoiceForm((prev: CreateInvoiceInput) => ({ 
                          ...prev, 
                          due_date: new Date(e.target.value) 
                        }))
                      }
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    Create Invoice
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create Expense */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  New Expense
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={expenseForm.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          description: e.target.value 
                        }))
                      }
                      placeholder="What was this expense for?"
                      required
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={expenseForm.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={expenseForm.category || ''}
                      onValueChange={(value: string) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          category: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select or type category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category: string) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={expenseForm.expense_date ? expenseForm.expense_date.toISOString().split('T')[0] : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setExpenseForm((prev: CreateExpenseInput) => ({ 
                          ...prev, 
                          expense_date: new Date(e.target.value) 
                        }))
                      }
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    Add Expense
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create Transaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  New Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTransaction} className="space-y-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={transactionForm.type}
                      onValueChange={(value: 'income' | 'expense') =>
                        setTransactionForm((prev: CreateTransactionInput) => ({ 
                          ...prev, 
                          type: value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={transactionForm.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTransactionForm((prev: CreateTransactionInput) => ({ 
                          ...prev, 
                          description: e.target.value 
                        }))
                      }
                      placeholder="Transaction description"
                      required
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={transactionForm.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTransactionForm((prev: CreateTransactionInput) => ({ 
                          ...prev, 
                          amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={transactionForm.transaction_date ? transactionForm.transaction_date.toISOString().split('T')[0] : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTransactionForm((prev: CreateTransactionInput) => ({ 
                          ...prev, 
                          transaction_date: new Date(e.target.value) 
                        }))
                      }
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    Record Transaction
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
