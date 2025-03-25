'use client';

import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function AuthForm() {
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const router = useRouter();

  return (
    <div className="w-full max-w-md mx-auto bg-background p-6 rounded-lg shadow-md border">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'hsl(var(--primary))',
                brandAccent: 'hsl(var(--primary-foreground))',
              },
            },
          },
          className: {
            button: 'bg-primary text-primary-foreground hover:bg-primary/90',
            input: 'bg-background border border-input',
            label: 'text-foreground',
          },
        }}
        view={view}
        theme="default"
        showLinks={true}
        providers={[]}
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
        onViewChange={(newView) => {
          setView(newView as 'sign_in' | 'sign_up');
        }}
        magicLink={true}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email address',
              password_label: 'Password',
              button_label: 'Sign in',
              loading_button_label: 'Signing in...',
              link_text: 'Already have an account? Sign in',
            },
            sign_up: {
              email_label: 'Email address',
              password_label: 'Create a password',
              button_label: 'Sign up',
              loading_button_label: 'Signing up...',
              link_text: 'Don\'t have an account? Sign up',
            },
          },
        }}
      />
    </div>
  );
} 