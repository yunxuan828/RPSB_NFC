import React, { useState } from 'react';
import { auth } from '../services/auth';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from '../components/UI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'; // Assuming tabs exist

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Determine type based on active tab
      const type = activeTab === 'employee' ? 'employee' : 'admin';
      await auth.login(email, password, type);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xl font-bold">R</div>
          </div>
          <CardTitle className="text-2xl">Ritma DBC</CardTitle>
          <p className="text-sm text-slate-500">
            {activeTab === 'admin' ? 'Administrative Access' : 'Employee Portal'}
          </p>
        </CardHeader>
        <CardContent>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="employee">Employee</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder={activeTab === 'admin' ? "admin@nexus.com" : "employee@company.com"}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-100 text-center">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-xs text-center text-slate-400 mt-4">
              {activeTab === 'admin' 
                ? 'Only Administrators can access this dashboard.' 
                : 'Login with your employee credentials to scan leads.'}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
