
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Truck,
  TrendingUp,
  Building2
} from 'lucide-react';

// Import components
import { Dashboard } from '@/components/Dashboard';
import { InventoryManager } from '@/components/InventoryManager';
import { OrderManager } from '@/components/OrderManager';
import { FinancialManager } from '@/components/FinancialManager';
import { CustomerManager } from '@/components/CustomerManager';
import { SupplierManager } from '@/components/SupplierManager';
import { WarehouseManager } from '@/components/WarehouseManager';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BusinessHub</h1>
              <p className="text-gray-600">Complete Business Management Solution</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-2">
            <TabsList className="grid w-full grid-cols-7 gap-1">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Financial</span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Customers</span>
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">Suppliers</span>
              </TabsTrigger>
              <TabsTrigger value="warehouses" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Warehouses</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManager />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManager />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialManager />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManager />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierManager />
          </TabsContent>

          <TabsContent value="warehouses">
            <WarehouseManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
