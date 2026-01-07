import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export function LogoutButton() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation(['common']);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Button 
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="w-full md:w-auto"
    >
      {t('common:logout')}
    </Button>
  );
}