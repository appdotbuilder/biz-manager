
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Building2, Plus, MapPin, Package } from 'lucide-react';
import type { Warehouse, CreateWarehouseInput, Inventory } from '../../../server/src/schema';

export function WarehouseManager() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [warehouseForm, setWarehouseForm] = useState<CreateWarehouseInput>({
    name: '',
    location: '',
    description: null
  });

  const loadData = useCallback(async () => {
    try {
      const [warehousesData, inventoryData] = await Promise.all([
        trpc.getWarehouses.query(),
        trpc.getInventory.query()
      ]);
      setWarehouses(warehousesData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Failed to load warehouse data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newWarehouse = await trpc.createWarehouse.mutate(warehouseForm);
      setWarehouses((prev: Warehouse[]) => [...prev, newWarehouse]);
      setWarehouseForm({
        name: '',
        location: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create warehouse:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWarehouseInventoryCount = (warehouseId: number) => {
    return inventory.filter(item => item.warehouse_id === warehouseId).length;
  };

  const getWarehouseTotalItems = (warehouseId: number) => {
    return inventory
      .filter(item => item.warehouse_id === warehouseId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-gray-600" />
            Warehouse Management
          </h2>
          <p className="text-gray-600">Manage your storage locations</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Warehouse Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Warehouse
            </CardTitle>
            <CardDescription>Create a new storage location</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div>
                <Label htmlFor="name">Warehouse Name</Label>
                <Input
                  id="name"
                  value={warehouseForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWarehouseForm((prev: CreateWarehouseInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter warehouse name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={warehouseForm.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWarehouseForm((prev: CreateWarehouseInput) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Street, City, State, ZIP"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={warehouseForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWarehouseForm((prev: CreateWarehouseInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Optional description"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating...' : 'Create Warehouse'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Warehouse Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Overview</CardTitle>
            <CardDescription>Your storage network statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Total Warehouses</p>
                  <p className="text-2xl font-bold text-gray-600">{warehouses.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-gray-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Total Products Stored</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {inventory.length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-green-600">
                    {inventory.reduce((total, item) => total + item.quantity, 0)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium">Low Stock Items</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {inventory.filter(item => item.quantity <= item.reorder_level).length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse List */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Directory</CardTitle>
          <CardDescription>All storage locations</CardDescription>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No warehouses yet
              </h3>
              <p className="text-gray-500">
                Create your first warehouse to start managing inventory! 🏢
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {warehouses.map((warehouse: Warehouse) => (
                <div key={warehouse.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                      <p className="text-sm text-gray-500">
                        Warehouse #{warehouse.id}
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{warehouse.location}</span>
                    </div>
                    
                    {warehouse.description && (
                      <p className="text-sm text-gray-600 italic">
                        {warehouse.description}
                      </p>
                    )}
                  </div>

                  {/* Inventory Stats */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-b">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Products</p>
                      <p className="text-xl font-bold text-blue-600">
                        {getWarehouseInventoryCount(warehouse.id)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total Items</p>
                      <p className="text-xl font-bold text-green-600">
                        {getWarehouseTotalItems(warehouse.id)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-xs text-gray-400">
                      Created {warehouse.created_at.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      View Inventory
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
