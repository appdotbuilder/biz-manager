
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { Users, Plus, Mail, Phone, MapPin } from 'lucide-react';
import type { Customer, CreateCustomerInput } from '../../../server/src/schema';

export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [customerForm, setCustomerForm] = useState<CreateCustomerInput>({
    name: '',
    email: null,
    phone: null,
    address: null
  });

  const loadCustomers = useCallback(async () => {
    try {
      const customersData = await trpc.getCustomers.query();
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCustomer = await trpc.createCustomer.mutate(customerForm);
      setCustomers((prev: Customer[]) => [...prev, newCustomer]);
      setCustomerForm({
        name: '',
        email: null,
        phone: null,
        address: null
      });
    } catch (error) {
      console.error('Failed to create customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-600" />
            Customer Management
          </h2>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Customer Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Customer
            </CardTitle>
            <CardDescription>Register a new customer in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={customerForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerForm((prev: CreateCustomerInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerForm((prev: CreateCustomerInput) => ({ 
                      ...prev, 
                      email: e.target.value || null 
                    }))
                  }
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={customerForm.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerForm((prev: CreateCustomerInput) => ({ 
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
                  value={customerForm.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerForm((prev: CreateCustomerInput) => ({ 
                      ...prev, 
                      address: e.target.value || null 
                    }))
                  }
                  placeholder="Street, City, State, ZIP"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Adding...' : 'Add Customer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Customer Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Overview</CardTitle>
            <CardDescription>Your customer base statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Total Customers</p>
                  <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">With Email</p>
                  <p className="text-2xl font-bold text-green-600">
                    {customers.filter(c => c.email).length}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium">With Phone</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {customers.filter(c => c.phone).length}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-purple-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium">With Address</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {customers.filter(c => c.address).length}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>All registered customers</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No customers yet
              </h3>
              <p className="text-gray-500">
                Add your first customer to get started! 👥
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customers.map((customer: Customer) => (
                <div key={customer.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <p className="text-sm text-gray-500">
                        Customer #{customer.id}
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-gray-400">
                      Added {customer.created_at.toLocaleDateString()}
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
