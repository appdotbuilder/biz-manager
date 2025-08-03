
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { ShoppingCart, Plus, Package, Users, Truck } from 'lucide-react';
import type { 
  Order, 
  CreateOrderInput, 
  Customer, 
  Supplier,
  OrderItem,
  CreateOrderItemInput,
  Product
} from '../../../server/src/schema';

export function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Order form state
  const [orderForm, setOrderForm] = useState<CreateOrderInput>({
    type: 'sales',
    customer_id: null,
    supplier_id: null,
    order_date: new Date()
  });

  // Order item form state
  const [orderItemForm, setOrderItemForm] = useState<CreateOrderItemInput>({
    order_id: 0,
    product_id: 0,
    quantity: 1,
    unit_price: 0
  });

  const loadData = useCallback(async () => {
    try {
      const [ordersData, customersData, suppliersData, productsData] = await Promise.all([
        trpc.getOrders.query(),
        trpc.getCustomers.query(),
        trpc.getSuppliers.query(),
        trpc.getProducts.query()
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load order data:', error);
    }
  }, []);

  const loadOrderItems = useCallback(async (orderId: number) => {
    try {
      const items = await trpc.getOrderItems.query(orderId);
      setOrderItems(items);
    } catch (error) {
      console.error('Failed to load order items:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedOrderId) {
      loadOrderItems(selectedOrderId);
    }
  }, [selectedOrderId, loadOrderItems]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newOrder = await trpc.createOrder.mutate(orderForm);
      setOrders((prev: Order[]) => [...prev, newOrder]);
      setOrderForm({
        type: 'sales',
        customer_id: null,
        supplier_id: null,
        order_date: new Date()
      });
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrderItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    
    setIsLoading(true);
    try {
      const newItem = await trpc.createOrderItem.mutate({
        ...orderItemForm,
        order_id: selectedOrderId
      });
      setOrderItems((prev: OrderItem[]) => [...prev, newItem]);
      setOrderItemForm({
        order_id: selectedOrderId,
        product_id: 0,
        quantity: 1,
        unit_price: 0
      });
    } catch (error) {
      console.error('Failed to add order item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return 'N/A';
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer ${customerId}`;
  };

  const getSupplierName = (supplierId: number | null) => {
    if (!supplierId) return 'N/A';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : `Supplier ${supplierId}`;
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product ${productId}`;
  };

  const salesOrders = orders.filter(order => order.type === 'sales');
  const purchaseOrders = orders.filter(order => order.type === 'purchase');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Order Management
          </h2>
          <p className="text-gray-600">Manage sales and purchase orders</p>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales Orders</TabsTrigger>
          <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
          <TabsTrigger value="create">Create Order</TabsTrigger>
        </TabsList>

        {/* Sales Orders Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Sales Orders
              </CardTitle>
              <CardDescription>{salesOrders.length} sales orders</CardDescription>
            </CardHeader>
            <CardContent>
              {salesOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No sales orders yet. Create your first sale! 💰
                </p>
              ) : (
                <div className="space-y-4">
                  {salesOrders.map((order: Order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">#{order.order_number}</h3>
                          <p className="text-sm text-gray-600">
                            Customer: {getCustomerName(order.customer_id)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.order_date.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ${order.total_amount.toFixed(2)}
                          </p>
                          <Badge variant={
                            order.status === 'pending' ? 'secondary' :
                            order.status === 'confirmed' ? 'default' :
                            order.status === 'shipped' ? 'outline' :
                            order.status === 'delivered' ? 'default' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Items
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit Order
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items Modal */}
          {selectedOrderId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items - Order #{selectedOrderId}
                </CardTitle>
                <CardDescription>
                  Items in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Item Form */}
                  <form onSubmit={handleAddOrderItem} className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <Label>Product</Label>
                        <Select
                          value={orderItemForm.product_id > 0 ? orderItemForm.product_id.toString() : ''}
                          onValueChange={(value: string) =>
                            setOrderItemForm((prev: CreateOrderItemInput) => ({ 
                              ...prev, 
                              product_id: parseInt(value) || 0
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product: Product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={orderItemForm.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setOrderItemForm((prev: CreateOrderItemInput) => ({ 
                              ...prev, 
                              quantity: parseInt(e.target.value) || 1 
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={orderItemForm.unit_price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setOrderItemForm((prev: CreateOrderItemInput) => ({ 
                              ...prev, 
                              unit_price: parseFloat(e.target.value) || 0 
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" disabled={isLoading}>
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </form>

                  {/* Order Items List */}
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No items in this order yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item: OrderItem) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-white border rounded">
                          <div>
                            <p className="font-medium">{getProductName(item.product_id)}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedOrderId(null)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Purchase Orders
              </CardTitle>
              <CardDescription>{purchaseOrders.length} purchase orders</CardDescription>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No purchase orders yet. Order from suppliers! 📦
                </p>
              ) : (
                <div className="space-y-4">
                  {purchaseOrders.map((order: Order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">#{order.order_number}</h3>
                          <p className="text-sm text-gray-600">
                            Supplier: {getSupplierName(order.supplier_id)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.order_date.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">
                            ${order.total_amount.toFixed(2)}
                          </p>
                          <Badge variant={
                            order.status === 'pending' ? 'secondary' :
                            order.status === 'confirmed' ? 'default' :
                            order.status === 'shipped' ? 'outline' :
                            order.status === 'delivered' ? 'default' : 'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Items
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit Order
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Order Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Order
              </CardTitle>
              <CardDescription>Start a new sales or purchase order</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <Label>Order Type</Label>
                  <Select
                    value={orderForm.type}
                    onValueChange={(value: 'sales' | 'purchase') =>
                      setOrderForm((prev: CreateOrderInput) => ({ 
                        ...prev, 
                        type: value,
                        customer_id: value === 'purchase' ? null : prev.customer_id,
                        supplier_id: value === 'sales' ? null : prev.supplier_id
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Order</SelectItem>
                      <SelectItem value="purchase">Purchase Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderForm.type === 'sales' && (
                  <div>
                    <Label>Customer</Label>
                    <Select
                      value={orderForm.customer_id ? orderForm.customer_id.toString() : ''}
                      onValueChange={(value: string) =>
                        setOrderForm((prev: CreateOrderInput) => ({ 
                          ...prev, 
                          customer_id: value ? parseInt(value) : null 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
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
                )}

                {orderForm.type === 'purchase' && (
                  <div>
                    <Label>Supplier</Label>
                    <Select
                      value={orderForm.supplier_id ? orderForm.supplier_id.toString() : ''}
                      onValueChange={(value: string) =>
                        setOrderForm((prev: CreateOrderInput) => ({ 
                          ...prev, 
                          supplier_id: value ? parseInt(value) : null 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier: Supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={orderForm.order_date ? orderForm.order_date.toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOrderForm((prev: CreateOrderInput) => ({ 
                        ...prev, 
                        order_date: new Date(e.target.value) 
                      }))
                    }
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Create Order'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
