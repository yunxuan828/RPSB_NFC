
export interface Company {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  bio?: string;
  address?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string;
  fullName: string;
  email: string;
  slug?: string;
  jobTitle: string;
  phone: string;
  whatsapp?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  profileUrl: string; // The URL to write to the NFC card
  avatarUrl?: string;
  status: 'active' | 'inactive';
}

export interface NFCWriteStatus {
  state: 'idle' | 'scanning' | 'writing' | 'success' | 'error';
  message: string;
}

export interface ActivityItem {
  type: string;
  description: string;
  time: string;
  user: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalCardsWritten: number;
  charts: {
    weeklyCards: Array<{ name: string; cards: number }>;
  };
  activity: ActivityItem[];
}
