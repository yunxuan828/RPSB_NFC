
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Company } from '../types';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Table, TableHeader,
  TableBody, TableRow, TableHead, TableCell,
  Modal
} from '../components/UI';
import { Trash2, Plus, Building, Upload, Pencil, Search, AlertTriangle } from 'lucide-react';
import { getFullImageUrl } from '../lib/utils';

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    domain: string;
    address?: string;
    bio?: string;
    logoUrl?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  }>({
    name: '',
    domain: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await api.getCompanies();
    setCompanies(data);
    setLoading(false);
  };

  const confirmDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (companyToDelete) {
      await api.deleteCompany(companyToDelete.id);
      loadCompanies();
      setDeleteConfirmOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      domain: company.domain,
      address: company.address || '',
      bio: company.bio || '',
      logoUrl: company.logoUrl,
      linkedin: company.linkedin || '',
      facebook: company.facebook || '',
      instagram: company.instagram || ''
    });
    setEditingId(company.id);
    setIsAdding(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.domain) return;

    if (editingId) {
      await api.updateCompany(editingId, formData);
    } else {
      await api.addCompany(formData);
    }

    resetForm();
    loadCompanies();
  };

  const resetForm = () => {
    setFormData({ name: '', domain: '', address: '', bio: '', logoUrl: undefined, linkedin: '', facebook: '', instagram: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
          <p className="text-slate-500">Manage client entities and organizations.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Organization' : 'New Organization'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="grid gap-2 flex-1">
                  <Label>Company Name</Label>
                  <Input
                    placeholder="e.g. Acme Industries"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 flex-1">
                  <Label>Domain (for URLs)</Label>
                  <Input
                    placeholder="e.g. acme.com"
                    value={formData.domain}
                    onChange={e => setFormData({ ...formData, domain: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  placeholder="e.g. 123 Business St, Tech City"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Bio / Description</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="Brief description of the company..."
                  value={formData.bio || ''}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    placeholder="https://linkedin.com/company/..."
                    value={formData.linkedin || ''}
                    onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Facebook URL</Label>
                  <Input
                    placeholder="https://facebook.com/..."
                    value={formData.facebook || ''}
                    onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Instagram URL</Label>
                  <Input
                    placeholder="https://instagram.com/..."
                    value={formData.instagram || ''}
                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-3">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Preview"
                      className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center">
                      <Upload className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="flex-1 cursor-pointer file:cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editingId ? 'Update Company' : 'Save Company'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAdding && (
        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search companies by name or domain..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">No companies found.</TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                      {company.logoUrl ? (
                        <img
                          src={getFullImageUrl(company.logoUrl)}
                          alt={company.name}
                          className="h-9 w-9 rounded-md object-cover border border-slate-200 bg-white"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200">
                          <Building className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div>{company.name}</div>
                        {company.bio && <div className="text-xs text-slate-500 truncate max-w-[200px]">{company.bio}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{company.domain}</TableCell>
                    <TableCell className="text-slate-600">{company.address || '-'}</TableCell>
                    <TableCell>{company.createdAt}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(company)}>
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => confirmDelete(company)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Double Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={`Delete ${companyToDelete?.name}?`}
        description="This action cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete}>Confirm Delete</Button>
          </>
        }
      >
        <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg text-red-700">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Warning: Associated Users</p>
            <p className="mt-1">Deleting this company will also remove all users associated with it. Are you absolutely sure?</p>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Companies;
