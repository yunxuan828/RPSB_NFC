import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Loader2, Search, User, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal, Button as UIButton } from '../../components/UI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { auth } from '../../services/auth';
import { api, Customer } from '../../services/api';

const PortalHome: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.getUser());
  const [leads, setLeads] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchLeads();
  }, [user, statusFilter]); // Re-fetch when status filter changes

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await api.listCustomers({ 
        q: searchTerm,
        status: statusFilter
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await auth.logout();
      window.dispatchEvent(new Event('auth-change'));
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">R</div>
           <span className="font-semibold text-lg">My Leads</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogoutClick} disabled={loggingOut}>
          <LogOut className="h-5 w-5 text-slate-500" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        
        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Welcome back, {user?.name}</CardTitle>
                <CardDescription>Manage and capture your contacts efficiently.</CardDescription>
              </div>
              <Button 
                className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => navigate('/portal/scan')}
              >
                <Plus className="mr-2 h-4 w-4" /> Scan New Namecard
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search leads..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>

          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {['all', 'lead', 'active', 'silent'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize whitespace-nowrap"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Lead List Table */}
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <User className="h-12 w-12 mb-3 text-slate-300" />
                      <p className="font-medium">No leads found yet.</p>
                      <p className="text-sm text-slate-400">Start by scanning a namecard.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/portal/customers/${lead.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium text-slate-900">{lead.full_name || 'Unknown Name'}</div>
                      <div className="text-xs text-slate-500 md:hidden">{lead.customer_company_name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.customer_company_name || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{lead.email}</div>
                      <div className="text-xs text-slate-500">{lead.phone}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="text-slate-500 hidden sm:table-cell">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Logout Confirmation Modal (same as admin) */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => !loggingOut && setShowLogoutConfirm(false)}
        title="Confirm Logout"
        description="Are you sure you want to end your session?"
        footer={
          <>
            <UIButton variant="ghost" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}>Cancel</UIButton>
            <UIButton variant="destructive" onClick={handleLogoutConfirm} disabled={loggingOut}>
              {loggingOut ? 'Logging out…' : 'Logout'}
            </UIButton>
          </>
        }
      >
        <p className="text-sm text-slate-600">You will need to sign in again to access the portal.</p>
      </Modal>
    </div>
  );
};

export default PortalHome;
