
import { Company, User, DashboardStats } from '../types';

// CRM Types
export interface CustomerTag {
  id: string;
  name: string;
  color?: string;
}

export interface CustomerActivity {
  id: string;
  customer_id: string;
  type: 'created' | 'updated' | 'status_changed' | 'comment' | 'attachment_added' | 'attachment_deleted' | 'event_created' | 'event_updated' | 'event_deleted';
  title: string;
  payload?: any;
  created_at: string;
  creator?: { id: string; name: string };
}

export interface CustomerComment {
  id: string;
  customer_id: string;
  body: string;
  created_at: string;
  creator?: { id: string; name: string };
}

export interface CustomerAttachment {
  id: string;
  customer_id: string;
  file_name: string;
  file_path: string;
  mime_type?: string;
  file_size?: number;
  note?: string;
  created_at: string;
  creator?: { id: string; name: string };
  url?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  customer_company_name?: string;
  job_title?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  website?: string;
  birthday?: string;
  status: 'lead' | 'active' | 'silent' | 'inactive';
  created_at: string;
  creator?: { id: string; name: string };
  collected_by_employee_id?: number;
  namecards?: CustomerNamecard[];
  events?: CustomerEvent[];
  tags?: CustomerTag[];
  comments_count?: number;
  attachments_count?: number;
}

export interface CustomerNamecard {
  id: string;
  front_image_url: string;
  back_image_url?: string;
  ocr_json?: any;
}

export interface CustomerEvent {
  id: string;
  customer_id: string;
  title: string;
  start_at: string;
  end_at?: string;
  all_day: boolean;
  type: 'birthday' | 'follow_up' | 'meeting' | 'reminder';
  notes?: string;
}

export interface NamecardScanResult {
  namecard_id: string;
  front_image_url: string;
  back_image_url?: string;
  extracted_fields: Partial<Customer>;
  ocr_json: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

// Access environment variables safely
const env = (import.meta as any).env || {};
const USE_MOCK = env.VITE_USE_MOCK === 'true'; // Default to false!

const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';
const getPublicBase = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/#/public/`;
  }
  return 'http://localhost:3000/#/public/';
};

// --- MOCK DATA ---
const INITIAL_COMPANIES: Company[] = [
  {
    id: '1',
    name: 'Acme Corp',
    domain: 'acme.com',
    createdAt: '2023-01-15',
    address: '123 Industrial Way, Tech City',
    bio: 'Leading provider of coyote catching equipment.'
  },
  {
    id: '2',
    name: 'Globex Inc',
    domain: 'globex.com',
    createdAt: '2023-03-22',
    address: '42 Business Park, Cypress Creek',
    bio: 'High-tech multinational conglomerate.'
  },
];

const INITIAL_USERS: User[] = [
  {
    id: '101',
    companyId: '1',
    fullName: 'John Doe',
    email: 'john@acme.com',
    jobTitle: 'CEO',
    phone: '+1 555 0101',
    whatsapp: '+1 555 0101',
    linkedin: 'https://linkedin.com/in/johndoe',
    instagram: 'https://instagram.com/johndoe',
    facebook: 'https://facebook.com/johndoe',
    bio: 'Visionary leader with 20 years experience.',
    profileUrl: `${getPublicBase()}101`,
    status: 'active'
  },
  {
    id: '102',
    companyId: '1',
    fullName: 'Jane Smith',
    email: 'jane@acme.com',
    jobTitle: 'CTO',
    phone: '+1 555 0102',
    whatsapp: '+1 555 0102',
    profileUrl: `${getPublicBase()}102`,
    status: 'active'
  },
  {
    id: '201',
    companyId: '2',
    fullName: 'Robert Paulson',
    email: 'bob@globex.com',
    jobTitle: 'Manager',
    phone: '+1 555 0201',
    profileUrl: `${getPublicBase()}201`,
    status: 'inactive'
  },
];

const STORAGE_KEY_COMPANIES = 'nexus_companies';
const STORAGE_KEY_USERS = 'nexus_users';

interface ApiService {
  getDashboardStats(): Promise<DashboardStats>;
  getCompanies(): Promise<Company[]>;
  addCompany(company: Partial<Company>): Promise<Company>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  getUsers(): Promise<User[]>;
  getPublicUser(id: string): Promise<{ user: User; company: Company }>;
  addUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  incrementCardWriteCount(): Promise<void>;
  
  // CRM
  scanNamecard(formData: FormData): Promise<NamecardScanResult>;
  listCustomers(params?: { status?: string, q?: string, tag?: string, page?: number }): Promise<PaginatedResponse<Customer>>;
  getCustomer(id: string): Promise<Customer>;
  createCustomer(customer: Partial<Customer>): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  listEvents(customerId: string): Promise<CustomerEvent[]>;
  createEvent(customerId: string, event: Partial<CustomerEvent>): Promise<CustomerEvent>;
  updateEvent(eventId: string, event: Partial<CustomerEvent>): Promise<CustomerEvent>;
  deleteEvent(eventId: string): Promise<void>;

  // CRM Phase 2
  listTags(): Promise<CustomerTag[]>;
  createTag(tag: Partial<CustomerTag>): Promise<CustomerTag>;
  attachTags(customerId: string, tagIds: string[]): Promise<CustomerTag[]>;
  detachTag(customerId: string, tagId: string): Promise<void>;

  listComments(customerId: string): Promise<PaginatedResponse<CustomerComment>>;
  createComment(customerId: string, body: string): Promise<CustomerComment>;
  deleteComment(commentId: string): Promise<void>;

  listAttachments(customerId: string): Promise<CustomerAttachment[]>;
  uploadAttachment(customerId: string, formData: FormData): Promise<CustomerAttachment>;
  deleteAttachment(attachmentId: string): Promise<void>;

  listActivities(customerId: string): Promise<PaginatedResponse<CustomerActivity>>;
}

// --- MOCK SERVICE IMPLEMENTATION ---
class MockApiService implements ApiService {
  private companies: Company[];
  private users: User[];
  private cardsWrittenCount = 142;

  constructor() {
    const storedCompanies = localStorage.getItem(STORAGE_KEY_COMPANIES);
    this.companies = storedCompanies ? JSON.parse(storedCompanies) : INITIAL_COMPANIES;

    const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
    this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
  }

  private save() {
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(this.companies));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    await this.delay(500);
    return {
      totalUsers: this.users.length,
      totalCompanies: this.companies.length,
      totalCardsWritten: this.cardsWrittenCount,
      charts: {
        weeklyCards: [
          { name: 'Mon', cards: 4 },
          { name: 'Tue', cards: 3 },
          { name: 'Wed', cards: 10 },
          { name: 'Thu', cards: 7 },
          { name: 'Fri', cards: 12 },
          { name: 'Sat', cards: 2 },
          { name: 'Sun', cards: 0 },
        ]
      },
      activity: [
        {
          type: 'card_written',
          description: 'user_id: 101 via ACR122U',
          time: '2m ago',
          user: 'John Doe'
        },
        {
          type: 'user_created',
          description: 'New user Jane Smith added to Acme Corp',
          time: '12m ago',
          user: 'Jane Smith'
        }
      ]
    };
  }

  async getCompanies(): Promise<Company[]> {
    await this.delay(300);
    return [...this.companies];
  }

  async addCompany(company: Partial<Company>): Promise<Company> {
    await this.delay(300);
    const newCompany: Company = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString().split('T')[0],
      name: company.name || '',
      domain: company.domain || '',
      ...company
    };
    this.companies.push(newCompany);
    this.save();
    return newCompany;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    await this.delay(300);
    const index = this.companies.findIndex(c => c.id === id);
    if (index !== -1) {
      this.companies[index] = { ...this.companies[index], ...updates };
      this.save();
      return this.companies[index];
    }
    throw new Error('Company not found');
  }

  async deleteCompany(id: string): Promise<void> {
    await this.delay(300);
    this.companies = this.companies.filter(c => c.id !== id);
    this.users = this.users.filter(u => u.companyId !== id);
    this.save();
  }

  async getUsers(): Promise<User[]> {
    await this.delay(300);
    return [...this.users];
  }

  async getPublicUser(id: string): Promise<{ user: User; company: Company }> {
    await this.delay(200);
    const user = this.users.find(
      (u) => u.id === id || u.profileUrl?.endsWith(`/${id}`)
    );
    if (!user) {
      throw new Error('User not found');
    }
    const company = this.companies.find((c) => c.id === user.companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    return { user: { ...user }, company: { ...company } };
  }

  async addUser(user: Partial<User>): Promise<User> {
    await this.delay(400);
    const company = this.companies.find(c => c.id === user.companyId);
    const domain = company ? company.domain : 'nexuscard.com';
    const slug = (user.fullName || 'user').toLowerCase().replace(/\s+/g, '-');

    const id = Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id,
      profileUrl: `${getPublicBase()}${id}`,
      companyId: user.companyId || '',
      fullName: user.fullName || '',
      email: user.email || '',
      jobTitle: user.jobTitle || '',
      phone: user.phone || '',
      status: 'active',
      ...user
    } as User;

    this.users.push(newUser);
    this.save();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await this.delay(300);
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this.save();
      return this.users[index];
    }
    throw new Error('User not found');
  }

  async deleteUser(id: string): Promise<void> {
    await this.delay(300);
    this.users = this.users.filter(u => u.id !== id);
    this.save();
  }

  async incrementCardWriteCount(): Promise<void> {
    await this.delay(200);
    this.cardsWrittenCount++;
  }

  // --- MOCK CRM ---
  async scanNamecard(formData: FormData): Promise<NamecardScanResult> {
    await this.delay(1000);
    return {
      namecard_id: 'nc_' + Math.random().toString(36).substr(2, 5),
      front_image_url: 'https://via.placeholder.com/600x400?text=Front+Card',
      extracted_fields: {
        full_name: 'Mock Customer',
        customer_company_name: 'Mock Industries',
        email: 'customer@mock.com',
        phone: '123-456-7890'
      },
      ocr_json: {}
    };
  }

  async listCustomers(params?: any): Promise<PaginatedResponse<Customer>> {
    await this.delay(400);
    return {
      data: [
        { 
          id: 'c1', full_name: 'Alice Wonder', customer_company_name: 'Wonderland', 
          status: 'lead', created_at: '2023-10-01', email: 'alice@example.com',
          tags: [{id: 't1', name: 'VIP', color: '#ff0000'}]
        },
        { 
          id: 'c2', full_name: 'Bob Builder', customer_company_name: 'Construction Co', 
          status: 'active', created_at: '2023-10-05', email: 'bob@example.com' 
        }
      ],
      current_page: 1,
      last_page: 1,
      total: 2
    };
  }

  async getCustomer(id: string): Promise<Customer> {
    await this.delay(300);
    return { 
      id, full_name: 'Alice Wonder', customer_company_name: 'Wonderland', 
      status: 'lead', created_at: '2023-10-01', email: 'alice@example.com',
      job_title: 'Explorer', phone: '555-0199', birthday: '1990-05-15',
      tags: [{id: 't1', name: 'VIP', color: '#ff0000'}]
    };
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    await this.delay(500);
    return { ...customer, id: 'c_' + Math.random(), created_at: new Date().toISOString() } as Customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    await this.delay(300);
    return { id, ...updates, created_at: '2023-10-01' } as Customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.delay(300);
  }

  async listEvents(customerId: string): Promise<CustomerEvent[]> {
    await this.delay(200);
    return [
      { id: 'e1', customer_id: customerId, title: 'Follow up call', start_at: new Date().toISOString(), all_day: false, type: 'follow_up' }
    ];
  }

  async createEvent(customerId: string, event: Partial<CustomerEvent>): Promise<CustomerEvent> {
    await this.delay(300);
    return { ...event, id: 'e_' + Math.random(), customer_id: customerId } as CustomerEvent;
  }

  async updateEvent(eventId: string, event: Partial<CustomerEvent>): Promise<CustomerEvent> {
    await this.delay(300);
    return { ...event, id: eventId, customer_id: 'c1' } as CustomerEvent;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.delay(300);
  }

  async listTags(): Promise<CustomerTag[]> {
    return [{id: 't1', name: 'VIP', color: '#ff0000'}, {id: 't2', name: 'New', color: '#00ff00'}];
  }
  async createTag(tag: Partial<CustomerTag>): Promise<CustomerTag> {
    return { id: 't_' + Math.random(), name: tag.name || 'New Tag', color: tag.color };
  }
  async attachTags(customerId: string, tagIds: string[]): Promise<CustomerTag[]> {
    return [];
  }
  async detachTag(customerId: string, tagId: string): Promise<void> {}

  async listComments(customerId: string): Promise<PaginatedResponse<CustomerComment>> {
    return { data: [], current_page: 1, last_page: 1, total: 0 };
  }
  async createComment(customerId: string, body: string): Promise<CustomerComment> {
    return { id: 'cm_' + Math.random(), customer_id: customerId, body, created_at: new Date().toISOString() };
  }
  async deleteComment(commentId: string): Promise<void> {}

  async listAttachments(customerId: string): Promise<CustomerAttachment[]> {
    return [];
  }
  async uploadAttachment(customerId: string, formData: FormData): Promise<CustomerAttachment> {
    return { id: 'a_' + Math.random(), customer_id: customerId, file_name: 'test.pdf', file_path: '', created_at: new Date().toISOString() };
  }
  async deleteAttachment(attachmentId: string): Promise<void> {}

  async listActivities(customerId: string): Promise<PaginatedResponse<CustomerActivity>> {
    return { data: [], current_page: 1, last_page: 1, total: 0 };
  }
}

// --- REAL LARAVEL API SERVICE IMPLEMENTATION ---
class RealApiService implements ApiService {

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Handle FormData specifically to avoid setting Content-Type manually (browser does it with boundary)
      const headers: any = {
        'Accept': 'application/json',
        ...options.headers,
      };

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        // Include credentials (cookies) for Laravel Sanctum/Session
        credentials: 'include',
      });

        if (!response.ok) {
        // Stale/invalid session (e.g. old cookie from IP vs domain) → clear and send to login
        if (response.status === 401 && typeof window !== 'undefined') {
          const { auth } = await import('./auth');
          const wasAuthenticated = auth.isAuthenticated();
          auth.logout();
          // Only hard-redirect if we still had auth (e.g. session expired). Avoid double redirect during explicit logout.
          if (wasAuthenticated) {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Session expired'));
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.statusText}`);
      }

      // Check for 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error: any) {
      // Improve error message for network/CORS issues
      if (error.message === 'Failed to fetch') {
        const currentPort = window.location.port;
        throw new Error(`Unable to connect to server. Check if Backend is running and 'config/cors.php' allows port ${currentPort}.`);
      }
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard');
  }

  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/companies');
  }

  async addCompany(company: Partial<Company>): Promise<Company> {
    return this.request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    return this.request<Company>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCompany(id: string): Promise<void> {
    return this.request<void>(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getPublicUser(id: string): Promise<{ user: User; company: Company }> {
    return this.request<{ user: User; company: Company }>(`/users/${id}`);
  }

  async addUser(user: Partial<User>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async incrementCardWriteCount(): Promise<void> {
    return this.request<void>('/cards/written', {
      method: 'POST'
    });
  }

  // --- CRM ---

  async scanNamecard(formData: FormData): Promise<NamecardScanResult> {
    return this.request<NamecardScanResult>('/crm/namecards/scan', {
      method: 'POST',
      body: formData
    });
  }

  async listCustomers(params?: { status?: string, q?: string, tag?: string, page?: number }): Promise<PaginatedResponse<Customer>> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.q) query.append('q', params.q);
    if (params?.tag) query.append('tag', params.tag);
    if (params?.page) query.append('page', params.page.toString());
    
    return this.request<PaginatedResponse<Customer>>(`/crm/customers?${query.toString()}`);
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/crm/customers/${id}`);
  }

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>('/crm/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/crm/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/crm/customers/${id}`, {
      method: 'DELETE'
    });
  }

  async listEvents(customerId: string): Promise<CustomerEvent[]> {
    return this.request<CustomerEvent[]>(`/crm/customers/${customerId}/events`);
  }

  async createEvent(customerId: string, event: Partial<CustomerEvent>): Promise<CustomerEvent> {
    return this.request<CustomerEvent>(`/crm/customers/${customerId}/events`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  async updateEvent(eventId: string, event: Partial<CustomerEvent>): Promise<CustomerEvent> {
    return this.request<CustomerEvent>(`/crm/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event)
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    return this.request<void>(`/crm/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  // Phase 2
  async listTags(): Promise<CustomerTag[]> {
    return this.request<CustomerTag[]>('/crm/tags');
  }

  async createTag(tag: Partial<CustomerTag>): Promise<CustomerTag> {
    return this.request<CustomerTag>('/crm/tags', {
      method: 'POST',
      body: JSON.stringify(tag)
    });
  }

  async attachTags(customerId: string, tagIds: string[]): Promise<CustomerTag[]> {
    return this.request<CustomerTag[]>(`/crm/customers/${customerId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags: tagIds })
    });
  }

  async detachTag(customerId: string, tagId: string): Promise<void> {
    return this.request<void>(`/crm/customers/${customerId}/tags/${tagId}`, {
      method: 'DELETE'
    });
  }

  async listComments(customerId: string): Promise<PaginatedResponse<CustomerComment>> {
    return this.request<PaginatedResponse<CustomerComment>>(`/crm/customers/${customerId}/comments`);
  }

  async createComment(customerId: string, body: string): Promise<CustomerComment> {
    return this.request<CustomerComment>(`/crm/customers/${customerId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.request<void>(`/crm/comments/${commentId}`, {
      method: 'DELETE'
    });
  }

  async listAttachments(customerId: string): Promise<CustomerAttachment[]> {
    return this.request<CustomerAttachment[]>(`/crm/customers/${customerId}/attachments`);
  }

  async uploadAttachment(customerId: string, formData: FormData): Promise<CustomerAttachment> {
    return this.request<CustomerAttachment>(`/crm/customers/${customerId}/attachments`, {
      method: 'POST',
      body: formData
    });
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    return this.request<void>(`/crm/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
  }

  async listActivities(customerId: string): Promise<PaginatedResponse<CustomerActivity>> {
    return this.request<PaginatedResponse<CustomerActivity>>(`/crm/customers/${customerId}/activities`);
  }
}

// Export the instance based on environment configuration
export const api = USE_MOCK ? new MockApiService() : new RealApiService();
