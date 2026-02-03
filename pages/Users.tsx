
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, Company } from '../types';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge, Table, TableHeader,
  TableBody, TableRow, TableHead, TableCell,
  Modal
} from '../components/UI';
import { Trash2, Plus, Search, Link as LinkIcon, Upload, User as UserIcon, Pencil, ExternalLink, AlertTriangle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { getFullImageUrl } from '../lib/utils';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    jobTitle: string;
    phone: string;

    whatsapp: string;
    linkedin: string;
    instagram: string;
    facebook: string;
    bio: string;
    companyId: string;
    avatarUrl?: string;
    status: 'active' | 'inactive';
  }>({
    fullName: '',
    email: '',
    jobTitle: '',
    phone: '',
    whatsapp: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    bio: '',
    companyId: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [userData, companyData] = await Promise.all([
      api.getUsers(),
      api.getCompanies()
    ]);
    setUsers(userData);
    setCompanies(companyData);
    // If not editing, set default company ID
    if (!editingId && companyData.length > 0) {
      setFormData(prev => ({ ...prev, companyId: companyData[0].id }));
    }
    setLoading(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      fullName: user.fullName,
      email: user.email,
      jobTitle: user.jobTitle,
      phone: user.phone,

      linkedin: user.linkedin || '',
      instagram: user.instagram || '',
      facebook: user.facebook || '',
      bio: user.bio || '',
      companyId: user.companyId,
      avatarUrl: user.avatarUrl,
      status: user.status
    });
    setEditingId(user.id);
    setIsAdding(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId) return;

    if (editingId) {
      await api.updateUser(editingId, formData);
    } else {
      await api.addUser(formData);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      jobTitle: '',
      phone: '',

      linkedin: '',
      instagram: '',
      facebook: '',
      bio: '',
      companyId: companies[0]?.id || '',
      avatarUrl: undefined,
      status: 'active'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (userToDelete) {
      await api.deleteUser(userToDelete.id);
      loadData();
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-slate-500">Manage digital card holders.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit User Profile' : 'New User Profile'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Avatar Upload Section */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className={`h-24 w-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 ${formData.avatarUrl ? 'border-solid border-slate-200' : ''}`}>
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <div className="absolute bottom-0 right-0 bg-slate-900 text-white p-1 rounded-full shadow-md pointer-events-none">
                    <Upload className="h-3 w-3" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Profile Picture</h4>
                  <p className="text-xs text-slate-500">Upload a professional photo for the digital card.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Job Title</Label>
                  <Input required value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Company</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                    value={formData.companyId}
                    onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* New Contact Fields */}
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" />
                </div>
                <div className="grid gap-2">
                  <Label>WhatsApp Number</Label>
                  <Input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="+1 234 567 8900" />
                </div>
                <div className="col-span-2 grid gap-2">
                  <Label>LinkedIn URL</Label>
                  <Input value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="col-span-1 grid gap-2">
                  <Label>Instagram URL</Label>
                  <Input value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} placeholder="https://instagram.com/username" />
                </div>
                <div className="col-span-1 grid gap-2">
                  <Label>Facebook URL</Label>
                  <Input value={formData.facebook} onChange={e => setFormData({ ...formData, facebook: e.target.value })} placeholder="https://facebook.com/username" />
                </div>

                <div className="col-span-2 grid gap-2">
                  <Label>Bio / Intro</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief introduction..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editingId ? 'Update User' : 'Create User & Generate URL'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAdding && (
        <div className="flex items-center gap-2 max-w-sm">
          <Search className="h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or email..."
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Card URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No users found.</TableCell></TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={getFullImageUrl(user.avatarUrl)}
                            alt={user.fullName}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <span className="text-xs font-semibold text-slate-500">
                              {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.jobTitle}</TableCell>
                    <TableCell>{companies.find(c => c.id === user.companyId)?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {(() => {
                        const fallbackUrl = `${window.location.origin}/users/${user.id}`;
                        const cardUrl = user.profileUrl || fallbackUrl;
                        return (
                          <a
                            href={cardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline max-w-[150px] truncate"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            {cardUrl}
                          </a>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit User</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => confirmDelete(user)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete User</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Deletion"
        description="Are you sure you want to permanently remove this user? This action cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete}>Delete User</Button>
          </>
        }
      >
        {userToDelete && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{userToDelete.fullName}</p>
              <p className="text-xs text-slate-500">{userToDelete.email}</p>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Users;
