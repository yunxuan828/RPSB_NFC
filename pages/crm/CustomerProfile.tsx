import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Building2, Phone, Mail, Globe, MapPin, Calendar as CalendarIcon, 
  ArrowLeft, Edit, Trash2, Plus, Clock, MessageSquare, Paperclip, History, 
  Save, X, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { api, Customer, CustomerEvent, CustomerActivity, CustomerComment, CustomerAttachment, CustomerTag } from '../../services/api';
import { Modal } from '../../components/UI';
import { auth } from '../../services/auth';

const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.getUser();
  const [activeTab, setActiveTab] = useState('profile');

  // Sub-data states
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [comments, setComments] = useState<CustomerComment[]>([]);
  const [attachments, setAttachments] = useState<CustomerAttachment[]>([]);
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [availableTags, setAvailableTags] = useState<CustomerTag[]>([]);

  // Modals & Inputs
  const [showEventModal, setShowEventModal] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [newEvent, setNewEvent] = useState<Partial<CustomerEvent>>({
    title: '',
    type: 'follow_up',
    start_at: '',
    notes: ''
  });

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (id) {
      fetchCustomer();
      fetchAvailableTags();
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'timeline') fetchActivities();
    if (id && activeTab === 'comments') fetchComments();
    if (id && activeTab === 'attachments') fetchAttachments();
    if (id && activeTab === 'calendar') fetchEvents();
  }, [id, activeTab]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      if (!id) return;
      const data = await api.getCustomer(id);
      setCustomer(data);
      setEditForm(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const data = await api.listTags();
      setAvailableTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchEvents = async () => {
    if (!id) return;
    const data = await api.listEvents(id);
    setEvents(data);
  };

  const fetchActivities = async () => {
    if (!id) return;
    const response = await api.listActivities(id);
    setActivities(response.data);
  };

  const fetchComments = async () => {
    if (!id) return;
    const response = await api.listComments(id);
    setComments(response.data);
  };

  const fetchAttachments = async () => {
    if (!id) return;
    const data = await api.listAttachments(id);
    setAttachments(data);
  };

  const handleUpdateProfile = async () => {
    if (!id) return;
    try {
      await api.updateCustomer(id, editForm);
      setIsEditing(false);
      fetchCustomer();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update profile');
    }
  };

  const handleStatusChange = async (newStatus: any) => {
    if (!id) return;
    try {
      await api.updateCustomer(id, { status: newStatus });
      fetchCustomer();
      // Also refresh timeline if active
      if (activeTab === 'timeline') fetchActivities();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddComment = async () => {
    if (!id || !commentInput.trim()) return;
    try {
      await api.createComment(id, commentInput);
      setCommentInput('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.uploadAttachment(id, formData);
      fetchAttachments();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      await api.deleteAttachment(attachmentId);
      fetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!id || !newEvent.title || !newEvent.start_at) return;
    try {
      await api.createEvent(id, newEvent);
      setShowEventModal(false);
      setNewEvent({ title: '', type: 'follow_up', start_at: '', notes: '' });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleTagToggle = async (tagId: string) => {
    if (!id || !customer) return;
    const currentTagIds = customer.tags?.map(t => t.id) || [];
    const isAttached = currentTagIds.includes(tagId);

    try {
      if (isAttached) {
        await api.detachTag(id, tagId);
      } else {
        await api.attachTags(id, [tagId]);
      }
      fetchCustomer();
    } catch (error) {
      console.error('Error toggling tag:', error);
    }
  };

  const handleDelete = async () => {
    if (!customer || !window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
    
    try {
      await api.deleteCustomer(customer.id);
      navigate('/crm/customers');
    } catch (error) {
      console.error('Failed to delete customer', error);
      alert('Failed to delete customer. You might not have permission.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!customer) return <div className="p-8 text-center">Customer not found</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/crm/customers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {customer.full_name}
            <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className="uppercase">
              {customer.status}
            </Badge>
          </h1>
          <p className="text-slate-500">{customer.job_title} at {customer.customer_company_name}</p>
        </div>
        <div className="ml-auto flex gap-2">
           <select 
             className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
             value={customer.status}
             onChange={(e) => handleStatusChange(e.target.value)}
           >
             <option value="lead">Lead</option>
             <option value="active">Active</option>
             <option value="silent">Silent</option>
             <option value="inactive">Inactive</option>
           </select>
          {(currentUser?.role === 'admin' || (currentUser?.role === 'employee' && customer.collected_by_employee_id == currentUser?.id)) && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase text-slate-500">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline truncate">{customer.email || '-'}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone || '-'}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-slate-400" />
                <a href={customer.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{customer.website || '-'}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{customer.address || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle className="text-sm font-medium uppercase text-slate-500">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {customer.tags && customer.tags.map(tag => (
                  <span 
                    key={tag.id} 
                    className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: tag.color ? `${tag.color}20` : '#f1f5f9', color: tag.color || '#64748b' }}
                  >
                    {tag.name}
                    <button onClick={() => handleTagToggle(tag.id)} className="ml-1 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500">Add Tags:</label>
                <div className="flex flex-wrap gap-1">
                   {availableTags.filter(t => !customer.tags?.some(ct => ct.id === t.id)).map(tag => (
                     <Badge 
                        key={tag.id} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-slate-100"
                        onClick={() => handleTagToggle(tag.id)}
                     >
                       + {tag.name}
                     </Badge>
                   ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Main: Tabs */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="attachments">Files</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Customer Profile</CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditForm(customer); }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleUpdateProfile}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input 
                        disabled={!isEditing} 
                        value={editForm.full_name || ''} 
                        onChange={e => setEditForm({...editForm, full_name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Title</label>
                      <Input 
                        disabled={!isEditing} 
                        value={editForm.job_title || ''} 
                        onChange={e => setEditForm({...editForm, job_title: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company</label>
                      <Input 
                        disabled={!isEditing} 
                        value={editForm.customer_company_name || ''} 
                        onChange={e => setEditForm({...editForm, customer_company_name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        disabled={!isEditing} 
                        value={editForm.email || ''} 
                        onChange={e => setEditForm({...editForm, email: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input 
                        disabled={!isEditing} 
                        value={editForm.phone || ''} 
                        onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Website</label>
                      <Input 
                        disabled={!isEditing} 
                        value={editForm.website || ''} 
                        onChange={e => setEditForm({...editForm, website: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input 
                        disabled={!isEditing} 
                        value={editForm.address || ''} 
                        onChange={e => setEditForm({...editForm, address: e.target.value})} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {activities.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No activity yet.</p>
                    ) : activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="mt-1">
                          <div className="bg-slate-100 p-2 rounded-full">
                            <History className="h-4 w-4 text-slate-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.title || activity.type.replace('_', ' ')}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(activity.created_at).toLocaleString()} by {activity.creator?.name || 'System'}
                          </p>
                          {activity.payload && (
                            <pre className="mt-2 text-xs bg-slate-50 p-2 rounded overflow-x-auto max-w-md">
                              {JSON.stringify(activity.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Add a comment..." 
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button onClick={handleAddComment}>Post</Button>
                  </div>
                  
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm">{comment.creator?.name || 'Unknown'}</span>
                          <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Files & Attachments</CardTitle>
                  <div>
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span className="cursor-pointer">
                          <Paperclip className="h-4 w-4 mr-2" /> Upload File
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attachments.map(file => (
                        <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                           <FileText className="h-8 w-8 text-blue-500" />
                           <div className="flex-1 overflow-hidden">
                             <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline truncate block">
                               {file.file_name}
                             </a>
                             <p className="text-xs text-slate-500">
                               {file.file_size ? Math.round(file.file_size / 1024) + ' KB' : '-'} • {new Date(file.created_at).toLocaleDateString()}
                             </p>
                           </div>
                           <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => handleDeleteAttachment(file.id)}>
                             <X className="h-4 w-4" />
                           </Button>
                        </div>
                      ))}
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="mt-6">
               <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                   <CardTitle>Upcoming Events</CardTitle>
                   <Button size="sm" onClick={() => setShowEventModal(true)}>
                     <Plus className="h-4 w-4 mr-2" /> Add Event
                   </Button>
                 </CardHeader>
                 <CardContent>
                    {events.length === 0 ? (
                      <p className="text-center py-8 text-slate-500">No events scheduled.</p>
                    ) : (
                      <div className="space-y-4">
                        {events.map(event => (
                          <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50">
                            <div className="bg-blue-100 text-blue-700 p-2 rounded-md">
                              <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-slate-500">{new Date(event.start_at).toLocaleString()}</p>
                              {event.notes && <p className="text-sm mt-1 text-slate-600">{event.notes}</p>}
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
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Add New Event"
        description="Schedule a follow-up, meeting, or reminder."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEventModal(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent}>Save Event</Button>
          </>
        }
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Title</label>
            <Input 
              placeholder="e.g. Follow-up Call" 
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select 
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <option value="follow_up">Follow Up</option>
                <option value="meeting">Meeting</option>
                <option value="reminder">Reminder</option>
                <option value="birthday">Birthday</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date & Time</label>
              <Input 
                type="datetime-local"
                value={newEvent.start_at}
                onChange={(e) => setNewEvent(prev => ({ ...prev, start_at: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input 
              placeholder="Add details..."
              value={newEvent.notes || ''}
              onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerProfile;
