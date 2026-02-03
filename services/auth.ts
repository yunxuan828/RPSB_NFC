
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager';
}

const AUTH_KEY = 'nexus_auth_user';
// Accessing env via type casting to avoid TS error about 'env' not existing on ImportMeta
const env = (import.meta as any).env || {};
const USE_MOCK = env.VITE_USE_MOCK !== 'false';
const API_URL = env.VITE_API_URL || 'http://localhost:8000/api';

export const auth = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock Credential Check
      if (email === 'admin@nexus.com' && password === 'admin') {
        const user: AuthUser = {
          id: '1',
          name: 'Admin User',
          email,
          role: 'admin'
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
      }
      throw new Error('Invalid credentials');
    } else {
      // Real Backend Call
      try {
        const response = await fetch(`${API_URL}/login`, {
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
    if (!USE_MOCK) {
      try {
        await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
      } catch (e) {
        console.warn("Logout API call failed", e);
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    localStorage.removeItem(AUTH_KEY);
  },

  getUser: (): AuthUser | null => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  }
};
