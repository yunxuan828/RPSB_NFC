import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Trash2, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { api, Customer, CustomerTag } from '../../services/api';
import { auth } from '../../services/auth';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [tagFilter, setTagFilter] = useState('');
  const currentUser = auth.getUser();

  useEffect(() => {
    fetchTags();
    fetchCustomers();
  }, [statusFilter, tagFilter]);

  const fetchTags = async () => {
    try {
      const data = await api.listTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags', error);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.listCustomers({ 
        status: statusFilter,
        q: searchTerm,
        tag: tagFilter
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'lead': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Lead</Badge>;
      case 'silent': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Silent</Badge>;
      case 'inactive': return <Badge variant="destructive">Inactive</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lead?')) return;

    try {
      await api.deleteCustomer(customerId);
      setCustomers(customers.filter(c => c.id !== customerId));
    } catch (error) {
      console.error('Failed to delete customer', error);
      alert('Failed to delete customer. You might not have permission.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your CRM leads and contacts.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/crm/scan')}>
            <Plus className="mr-2 h-4 w-4" /> Scan Namecard
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search customers..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              className="h-9 w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block" />

          {['all', 'lead', 'active', 'silent'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No customers found. Try scanning a namecard!
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => navigate(`/crm/customers/${customer.id}`)}
                >
                  <TableCell className="font-medium">
                    <div>{customer.full_name}</div>
                    <div className="text-xs text-slate-500">{customer.job_title}</div>
                  </TableCell>
                  <TableCell>{customer.customer_company_name || '-'}</TableCell>
                  <TableCell>
                    <div className="text-sm">{customer.email}</div>
                    <div className="text-xs text-slate-500">{customer.phone}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags && customer.tags.map(tag => (
                        <span 
                          key={tag.id} 
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
                          style={{ backgroundColor: tag.color ? `${tag.color}20` : '#f1f5f9', color: tag.color || '#64748b', borderColor: tag.color ? `${tag.color}40` : '#e2e8f0' }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {(currentUser?.role === 'admin' || (currentUser?.role === 'employee' && customer.collected_by_employee_id == currentUser?.id)) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => handleDelete(e, customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Customers;
