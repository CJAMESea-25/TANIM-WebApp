import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useGlobalAuth } from '../hooks/useGlobalAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useGlobalAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find user in Admin table
      const { data: adminData, error: adminError } = await (supabase as any)
        .from('admin')
        .select('*')
        // Checking exact match against the custom username and password columns
        .eq('username', username)
        .eq('password', password)
        .single();

      if (adminData) {
        login({ id: adminData.id || adminData.admin_id || 1, username: adminData.username || username, role: 'admin' });
        toast.success("Successfully logged in as Admin");
        return;
      }

      // If no match was found
      throw new Error("Invalid username or password. Please check your credentials.");

    } catch (error: any) {
      console.error("Auth error details:", error);
      toast.error(error.message || "An error occurred during authentication.", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sprout className="h-12 w-12 text-accent mr-3" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-crop bg-clip-text text-transparent">TANIM</h1>
              <p className="text-lg text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <p className="text-muted-foreground">Sign in to access the dashboard</p>
        </div>

        <Card className="shadow-deep">
          <CardHeader className="text-center pb-4">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full btn-glow bg-primary hover:bg-primary/90 text-primary-foreground mt-4" disabled={loading}>
                {loading ? 'Processing...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};