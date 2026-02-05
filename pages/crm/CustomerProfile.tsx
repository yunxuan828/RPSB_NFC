import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Building2, Phone, Mail, Globe, MapPin, Calendar as CalendarIcon, 
  ArrowLeft, Edit, Trash2, Plus, Clock 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { api, Customer, CustomerEvent } from '../../services/api';
import { Modal } from '../../components/UI';
import { auth } from '../../services/auth';

const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.getUser();
  
  // Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CustomerEvent>>({
    title: '',
    type: 'follow_up',
    start_at: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (customerId: string) => {
    setLoading(true);
    try {
      const [custData, eventsData] = await Promise.all([
        api.getCustomer(customerId),
        api.listEvents(customerId)
      ]);
      setCustomer(custData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!id || !newEvent.title || !newEvent.start_at) return;
    try {
      await api.createEvent(id, newEvent);
      setShowEventModal(false);
      setNewEvent({ title: '', type: 'follow_up', start_at: '', notes: '' });
      fetchData(id); // Refresh
    } catch (error) {
      console.error('Error creating event:', error);
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
        {/* Determine navigation back path based on user role or history */}
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {customer.full_name}
            <Badge variant="outline" className="text-xs uppercase">{customer.status}</Badge>
          </h1>
          <p className="text-slate-500">{customer.job_title} at {customer.customer_company_name}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {(currentUser?.role === 'admin' || (currentUser?.role === 'employee' && customer.collected_by_employee_id == currentUser?.id)) && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Lead
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar: Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email || '-'}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone || '-'}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-slate-400" />
                <a href={customer.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{customer.website || '-'}</a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{customer.address || '-'}</span>
              </div>
              {customer.birthday && (
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                  <span>Birthday: {new Date(customer.birthday).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Namecard Preview (Latest) */}
          {customer.namecards && customer.namecards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Namecard</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={customer.namecards[0].front_image_url} 
                  alt="Namecard Front" 
                  className="w-full rounded-md border"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Main: Tabs */}
        <div className="lg:col-span-2">
          {/* Simplified Tabs Implementation since I don't know if Tabs component works perfectly */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="border-b px-4">
               <nav className="flex -mb-px space-x-8" aria-label="Tabs">
                  <span className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                    Overview & Events
                  </span>
                  {/* Future: Add more tabs like 'Notes', 'History' */}
               </nav>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Calendar / Events Section */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Calendar & Events</h3>
                <Button size="sm" onClick={() => setShowEventModal(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <CalendarIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No upcoming events scheduled.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map(event => (
                    <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50">
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-md">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold">{event.title}</h4>
                          <span className="text-xs text-slate-500 capitalize px-2 py-1 bg-white border rounded-full">
                            {event.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.start_at).toLocaleString()}
                        </div>
                        {event.notes && (
                          <p className="text-sm mt-2 text-slate-600">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
            <textarea 
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add details..."
              value={newEvent.notes}
              onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerProfile;
