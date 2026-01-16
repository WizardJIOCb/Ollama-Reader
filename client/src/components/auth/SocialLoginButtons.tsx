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
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.10.08.13.19.14.27-.01.06.01.24 0 .38z"/>
      </svg>
    )
  },
  { 
    id: 'twitter', 
    name: 'Twitter', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  },
  { 
    id: 'yandex', 
    name: 'Yandex', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FC3F1D"/>
        <path d="M13.55 3.06h-1.58c-2.48 0-3.87 1.5-3.87 3.98 0 2.61 1.26 3.98 3.64 4.38l-3.95 8.52h2.6l3.72-8.14h.86v8.14h2.33V3.06h-3.75zm-1.33 7.14c-1.65 0-2.54-.98-2.54-2.98 0-1.94.85-2.92 2.54-2.92h1.33v5.9h-1.33z" fill="white"/>
      </svg>
    )
  },
  { 
    id: 'discord', 
    name: 'Discord', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    )
  },
];

export function SocialLoginButtons() {
  const { t } = useTranslation(['oauth']);

  const handleOAuthLogin = (provider: string) => {
    if (provider === 'telegram') {
      // Telegram uses a widget, handled separately
      window.alert(t('oauth:telegramInstructions'));
      return;
    }

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
            className="w-full bg-amber-50 hover:bg-amber-100 text-slate-700 border justify-center"
          >
            <span className="mr-2 flex items-center">{provider.icon}</span>
            <span>{provider.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
