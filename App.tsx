
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users as UsersIcon, CreditCard, LogOut, Menu, X, Contact } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Users from './pages/Users';
import WriteCard from './pages/WriteCard';
import PublicProfile from './pages/PublicProfile';
import ScanNamecard from './pages/crm/ScanNamecard';
import Customers from './pages/crm/Customers';
import CustomerProfile from './pages/crm/CustomerProfile';
import PortalHome from './pages/portal/PortalHome';
import PortalScan from './pages/portal/PortalScan';
import Login from './pages/Login';
import { auth } from './services/auth';
import { Modal, Button } from './components/UI';
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet";

// Sidebar Link Component
interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  children?: React.ReactNode;
  onClick?: () => void;
}

const NavLink = ({ to, icon: Icon, children, onClick }: NavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-slate-900 
        ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
  }, []);

    const handleLogin = () => {
      setIsAuthenticated(true);
      const user = auth.getUser();
      // Redirect based on role immediately after login
      if (user?.type === 'employee') {
         // Force reload or navigation to ensure router catches up
         // window.location.href = '/#/portal'; // if hash router
         // or just rely on state update re-render
      }
    };

  const handleLogout = () => {
    auth.logout();
    setIsAuthenticated(false);
    setShowLogoutConfirm(false);
  };

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full justify-between py-6">
      <nav className="space-y-2">
        <NavLink to="/" icon={LayoutDashboard} onClick={onLinkClick}>Dashboard</NavLink>
        <NavLink to="/companies" icon={Building2} onClick={onLinkClick}>Companies</NavLink>
        <NavLink to="/users" icon={UsersIcon} onClick={onLinkClick}>Users</NavLink>
        
        <div className="pt-4 mt-4 border-t border-slate-100">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CRM</p>
          <NavLink to="/crm/customers" icon={Contact} onClick={onLinkClick}>Customers</NavLink>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hardware</p>
          <NavLink to="/write" icon={CreditCard} onClick={onLinkClick}>Write Card (ACR122U)</NavLink>
        </div>
      </nav>

      <div className="border-t pt-4 mt-auto">
        <button
          onClick={() => {
            if (onLinkClick) onLinkClick();
            setShowLogoutConfirm(true);
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  const AppContent: React.FC = () => {
    const location = useLocation();
    const isPublicProfile = location.pathname.startsWith('/public/') || location.pathname.startsWith('/users/');

    if (isPublicProfile) {
      return (
        <Routes>
          <Route path="/public/:id" element={<PublicProfile />} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      );
    }

    // Portal Routes
    if (location.pathname.startsWith('/portal')) {
      if (!isAuthenticated) return <Navigate to="/login" replace />;
      
      // Basic role check: Admins can see everything, Employees confined to portal
      const user = auth.getUser();
      if (user?.type === 'admin') {
         // Admins *can* visit portal, but usually use dashboard. 
         // Let's allow them.
      } else if (user?.type === 'employee' && !location.pathname.startsWith('/portal')) {
         return <Navigate to="/portal" replace />;
      }

      return (
        <Routes>
          <Route path="/portal" element={<PortalHome />} />
          <Route path="/portal/scan" element={<PortalScan />} />
          <Route path="/portal/customers/:id" element={<CustomerProfile />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      );
    }

    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
    }

    // Admin Dashboard Guard
    const user = auth.getUser();
    if (user?.type === 'employee') {
      return <Navigate to="/portal" replace />;
    }

    return (
      <>
        <div className="min-h-screen bg-slate-50/50 flex">

          {/* Desktop Sidebar (Left Panel) */}
          <aside className="hidden lg:flex flex-col w-64 border-r bg-white h-screen sticky top-0">
            <div className="flex h-16 items-center border-b px-6 shrink-0">
              <Link to="/" className="flex items-center gap-2 font-bold text-lg">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">R</div>
                <span>Ritma DBC</span>
              </Link>
            </div>
            <div className="flex-1 overflow-auto px-4">
              <SidebarContent />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header with Sheet */}
            <header className="flex h-16 items-center gap-4 border-b bg-white px-6 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button>
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-white">
                  <div className="flex h-16 items-center border-b px-6">
                    <div className="flex items-center gap-2 font-bold text-lg">
                      <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">R</div>
                      <span>Ritma DBC</span>
                    </div>
                  </div>
                  <div className="px-4 h-[calc(100%-4rem)]">
                    <SidebarContent />
                  </div>
                </SheetContent>
              </Sheet>
              <span className="font-semibold">Ritma DBC Admin</span>
            </header>

            <main className="flex-1 overflow-y-auto p-4 lg:p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/users" element={<Users />} />
                <Route path="/write" element={<WriteCard />} />
                
                {/* CRM Routes */}
                <Route path="/crm/scan" element={<ScanNamecard />} />
                <Route path="/crm/customers" element={<Customers />} />
                <Route path="/crm/customers/:id" element={<CustomerProfile />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        <Modal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          title="Confirm Logout"
          description="Are you sure you want to end your session?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">You will need to sign in again to access the admin panel.</p>
        </Modal>
      </>
    );
  };

  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
