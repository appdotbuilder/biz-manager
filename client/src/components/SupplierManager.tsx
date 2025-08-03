
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Truck, Plus, Mail, Phone, MapPin } from 'lucide-react';
import type { Supplier, CreateSupplierInput } from '../../../server/src/schema';

export function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [supplierForm, setSupplierForm] = useState<CreateSupplierInput>({
    name: '',
    email: null,
    phone: null,
    address: null
  });

  const loadSuppliers = useCallback(async () => {
    try {
      const suppliersData = await trpc.getSuppliers.query();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newSupplier = await trpc.createSupplier.mutate(supplierForm);
      setSuppliers((prev: Supplier[]) => [...prev, newSupplier]);
      setSupplierForm({
        name: '',
        email: null,
        phone: null,
        address: null
      });
    } catch (error) {
      console.error('Failed to create supplier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            Supplier Management
          </h2>
          <p className="text-gray-600">Manage your supplier network</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Supplier Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Supplier
            </CardTitle>
            <CardDescription>Register a new supplier in your network</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <Label htmlFor="name">Supplier Name</Label>
                <Input
                  id="name"
                  value={supplierForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSupplierForm((prev: CreateSupplierInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter supplier name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSupplierForm((prev: CreateSupplierInput) => ({ 
                      ...prev, 
                      email: e.target.value || null 
                    }))
                  }
                  placeholder="supplier@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={supplierForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSupplierForm((prev: CreateSupplierInput) => ({ 
                      ...prev, 
                      phone: e.target.value || null 
                    }))
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={supplierForm.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSupplierForm((prev: CreateSupplierInput) => ({ 
                      ...prev, 
                      address: e.target.value || null 
                    }))
                  }
                  placeholder="Street, City, State, ZIP"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Adding...' : 'Add Supplier'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Supplier Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Overview</CardTitle>
            <CardDescription>Your supplier network statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <div>
                  <p className="font-medium">Total Suppliers</p>
                  <p className="text-2xl font-bold text-indigo-600">{suppliers.length}</p>
                </div>
                <Truck className="w-8 h-8 text-indigo-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">With Email</p>
                  <p className="text-2xl font-bold text-green-600">
                    {suppliers.filter(s => s.email).length}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">With Phone</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {suppliers.filter(s => s.phone).length}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium">With Address</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {suppliers.filter(s => s.address).length}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier List */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
          <CardDescription>All registered suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No suppliers yet
              </h3>
              <p className="text-gray-500">
                Add your first supplier to get started! 🚛
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((supplier: Supplier) => (
                <div key={supplier.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">
                        Supplier #{supplier.id}
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-gray-400">
                      Added {supplier.created_at.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Orders
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
