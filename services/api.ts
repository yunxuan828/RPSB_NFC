
import { Company, User, DashboardStats } from '../types';

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
}

// --- REAL LARAVEL API SERVICE IMPLEMENTATION ---
class RealApiService implements ApiService {

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        // Include credentials (cookies) for Laravel Sanctum/Session
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.statusText}`);
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
}

// Export the instance based on environment configuration
export const api = USE_MOCK ? new MockApiService() : new RealApiService();
