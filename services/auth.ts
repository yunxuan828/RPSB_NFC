
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  type: 'admin' | 'employee'; // Backend distinguishes types
  company_id?: string;
}

const AUTH_KEY = 'nexus_auth_user';
// Accessing env via type casting to avoid TS error about 'env' not existing on ImportMeta
const env = (import.meta as any).env || {};
// Use mock only if explicitly true
const USE_MOCK = env.VITE_USE_MOCK === 'true';
const API_URL = env.VITE_API_URL || '/api';

export const auth = {
  login: async (email: string, password: string, type: 'admin' | 'employee' = 'admin'): Promise<AuthUser> => {
    
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock Credential Check
      if (type === 'admin' && email === 'admin@nexus.com' && password === 'admin') {
        const user: AuthUser = {
          id: '1',
          name: 'Admin User',
          email,
          role: 'admin',
          type: 'admin'
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
      }

      if (type === 'employee' && password === 'demo') {
        const user: AuthUser = {
           id: 'emp_1',
           name: 'Demo Employee',
           email,
           role: 'employee',
           type: 'employee',
           company_id: '1'
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
      }

      throw new Error('Invalid credentials');
    } else {
      // Real Backend Call
      try {
        const endpoint = type === 'employee' ? '/employee/login' : '/login';
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
           const errorData = await response.json().catch(() => ({}));
           throw new Error(errorData.message || 'Login failed');
        }

        const user = await response.json();
        // Ensure type is set if backend doesn't return it
        user.type = user.type || type; 
        
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === 'Failed to fetch') {
           const currentPort = window.location.port;
           throw new Error(`Connection failed. Ensure Backend is running and 'cors.php' allows port ${currentPort}.`);
        }
        throw error;
      }
    }
  },

  logout: async () => {
    localStorage.removeItem(AUTH_KEY); // clear immediately so redirect sees clean state
    if (!USE_MOCK) {
      try {
        await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
      } catch (e) {
        console.warn("Logout API call failed", e);
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  },

  getUser: (): AuthUser | null => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};
