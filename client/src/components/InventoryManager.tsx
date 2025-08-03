
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { Package, Plus, AlertTriangle, TrendingUp } from 'lucide-react';
import type { 
  Product, 
  CreateProductInput, 
  Inventory, 
  UpdateInventoryInput, 
  Warehouse 
} from '../../../server/src/schema';

export function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    description: null,
    sku: '',
    price: 0,
    cost: 0
  });

  // Inventory update form state
  const [inventoryForm, setInventoryForm] = useState<UpdateInventoryInput>({
    product_id: 0,
    warehouse_id: 0,
    quantity: 0,
    reorder_level: 10
  });

  const loadData = useCallback(async () => {
    try {
      const [productsData, inventoryData, warehousesData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getInventory.query(),
        trpc.getWarehouses.query()
      ]);
      setProducts(productsData);
      setInventory(inventoryData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newProduct = await trpc.createProduct.mutate(productForm);
      setProducts((prev: Product[]) => [...prev, newProduct]);
      setProductForm({
        name: '',
        description: null,
        sku: '',
        price: 0,
        cost: 0
      });
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedInventory = await trpc.updateInventory.mutate(inventoryForm);
      setInventory((prev: Inventory[]) => {
        const index = prev.findIndex(
          item => item.product_id === updatedInventory.product_id && 
                  item.warehouse_id === updatedInventory.warehouse_id
        );
        if (index >= 0) {
          const newInventory = [...prev];
          newInventory[index] = updatedInventory;
          return newInventory;
        }
        return [...prev, updatedInventory];
      });
      setInventoryForm({
        product_id: 0,
        warehouse_id: 0,
        quantity: 0,
        reorder_level: 10
      });
    } catch (error) {
      console.error('Failed to update inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product ${productId}`;
  };

  const getWarehouseName = (warehouseId: number) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : `Warehouse ${warehouseId}`;
  };

  const lowStockItems = inventory.filter(item => item.quantity <= item.reorder_level);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            Inventory Management
          </h2>
          <p className="text-gray-600">Manage products and stock levels</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Stock Levels</TabsTrigger>
          <TabsTrigger value="alerts">Low Stock</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Add Product Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Product
                </CardTitle>
                <CardDescription>Create a new product in your catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={productForm.sku}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ ...prev, sku: e.target.value }))
                      }
                      placeholder="Enter SKU"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={productForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      placeholder="Product description (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Sale Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProductForm((prev: CreateProductInput) => ({ 
                            ...prev, 
                            price: parseFloat(e.target.value) || 0 
                          }))
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost Price</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.cost}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProductForm((prev: CreateProductInput) => ({ 
                            ...prev, 
                            cost: parseFloat(e.target.value) || 0 
                          }))
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating...' : 'Create Product'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>{products.length} products in your catalog</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No products yet. Add your first product! 📦
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {products.map((product: Product) => (
                      <div key={product.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">${product.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Cost: ${product.cost.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <Badge variant="outline">
                            Margin: {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                          </Badge>
                          <p className="text-xs text-gray-400">
                            Added {product.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Update Inventory Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Update Stock Level
                </CardTitle>
                <CardDescription>Adjust inventory quantities</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateInventory} className="space-y-4">
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Select
                      value={inventoryForm.product_id.toString()}
                      onValueChange={(value: string) =>
                        setInventoryForm((prev: UpdateInventoryInput) => ({ 
                          ...prev, 
                          product_id: parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select
                      value={inventoryForm.warehouse_id.toString()}
                      onValueChange={(value: string) =>
                        setInventoryForm((prev: UpdateInventoryInput) => ({ 
                          ...prev, 
                          warehouse_id: parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse: Warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={inventoryForm.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setInventoryForm((prev: UpdateInventoryInput) => ({ 
                            ...prev, 
                            quantity: parseInt(e.target.value) || 0 
                          }))
                        }
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="reorder">Reorder Level</Label>
                      <Input
                        id="reorder"
                        type="number"
                        min="0"
                        value={inventoryForm.reorder_level}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setInventoryForm((prev: UpdateInventoryInput) => ({ 
                            ...prev, 
                            reorder_level: parseInt(e.target.value) || 0 
                          }))
                        }
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Updating...' : 'Update Inventory'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Current Stock</CardTitle>
                <CardDescription>{inventory.length} inventory records</CardDescription>
              </CardHeader>
              <CardContent>
                {inventory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No inventory records yet. Update stock levels! 📊
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {inventory.map((item: Inventory) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{getProductName(item.product_id)}</h3>
                            <p className="text-sm text-gray-600">{getWarehouseName(item.warehouse_id)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.quantity} units</p>
                            <p className="text-xs text-gray-500">
                              Reorder at {item.reorder_level}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <Badge 
                            variant={item.quantity <= item.reorder_level ? 'destructive' : 'default'}
                          >
                            {item.quantity <= item.reorder_level ? 'Low Stock' : 'In Stock'}
                          </Badge>
                          <p className="text-xs text-gray-400">
                            Updated {item.updated_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Low Stock Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>
                Items that need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600 mb-2">
                    All Good! 🎉
                  </h3>
                  <p className="text-gray-600">
                    All your products are well stocked.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {lowStockItems.map((item: Inventory) => (
                    <div key={item.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-orange-800">
                            {getProductName(item.product_id)}
                          </h3>
                          <p className="text-sm text-orange-600">
                            {getWarehouseName(item.warehouse_id)}
                          </p>
                          <div className="mt-2">
                            <Badge variant="destructive">
                              Only {item.quantity} left!
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-orange-600">
                            Reorder Level: {item.reorder_level}
                          </p>
                          <Button size="sm" className="mt-2">
                            Reorder Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
