import React, { useState } from 'react';
import { useCropStore } from '@/stores/cropStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sprout, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export const LoginPage: React.FC = () => {
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: '',
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const { login, auth, t } = useCropStore();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(adminCredentials.username, adminCredentials.password);
  };

  const fillDemoCredentials = () => {
    setAdminCredentials({
      username: t('demoAdminUsername'),
      password: t('demoAdminPassword'),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sprout className="h-12 w-12 text-accent mr-3" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-crop bg-clip-text text-transparent">TANIM</h1>
              <p className="text-lg text-muted-foreground">Crop Recommender System</p>
            </div>
          </div>
          <p className="text-muted-foreground">Sign in to access your administrative dashboard</p>
        </div>

        <Card className="shadow-deep">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-end mb-4">
              <LanguageSwitcher />
            </div>
            <CardTitle>{t('loginTitle')}</CardTitle>
            <CardDescription>{t('loginSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="admin-username">{t('username')}</Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Enter admin username"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                  >
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {auth.loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {auth.loginError === 'Invalid username or password' ? t('invalidCredentials') : auth.loginError}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" variant="soil" size="lg">
                {t('loginButton')} ({t('adminTab')})
              </Button>

              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('demoCredentials')}</span>
                  </div>
                </div>

                <Button variant="earth" size="sm" className="w-full" onClick={fillDemoCredentials}>
                  Use Demo Admin Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};