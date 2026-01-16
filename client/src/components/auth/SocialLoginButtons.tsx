import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const OAUTH_PROVIDERS = [
  { 
    id: 'google', 
    name: 'Google', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    )
  },
  { 
    id: 'vk', 
    name: 'VK ID', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 48 48" fill="currentColor">
        <path d="M0 23.04C0 12.1788 0 6.74826 3.37413 3.37413C6.74826 0 12.1788 0 23.04 0H24.96C35.8212 0 41.2517 0 44.6259 3.37413C48 6.74826 48 12.1788 48 23.04V24.96C48 35.8212 48 41.2517 44.6259 44.6259C41.2517 48 35.8212 48 24.96 48H23.04C12.1788 48 6.74826 48 3.37413 44.6259C0 41.2517 0 35.8212 0 24.96V23.04Z" fill="#0077FF"/>
        <path d="M25.54 34.5801C14.6 34.5801 8.3601 27.0801 8.1001 14.6001H13.5801C13.7601 23.7601 17.8001 27.6401 21.0601 28.4401V14.6001H26.1601V22.5001C29.3801 22.1601 32.7601 18.5601 33.8201 14.6001H38.9201C38.0601 19.4801 34.4601 23.0801 31.8801 24.5601C34.4601 25.7601 38.5601 28.9601 40.1201 34.5801H34.4601C33.2601 30.7801 30.2601 27.8401 26.1601 27.4201V34.5801H25.54Z" fill="white"/>
      </svg>
    )
  },
];

export function SocialLoginButtons() {
  const { t } = useTranslation(['oauth']);

  const handleOAuthLogin = (provider: string) => {
    // Redirect to OAuth provider
    window.location.href = `/auth/${provider}`;
  };

  return (
    <div className="space-y-3">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('oauth:orContinueWith')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OAUTH_PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            type="button"
            onClick={() => handleOAuthLogin(provider.id)}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 justify-center transition-colors"
          >
            <span className="mr-2 flex items-center">{provider.icon}</span>
            <span>{provider.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
