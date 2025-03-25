'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { AlertCircle, Check } from 'lucide-react';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setResetEmailSent(true);
      toast.success('Password reset instructions sent to your email');
      
    } catch (error: any) {
      console.error('Error sending reset password email:', error);
      toast.error(error.error_description || error.message || 'Failed to send reset instructions');
      setError(error.error_description || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-md">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-gray-600">
            We've sent password reset instructions to <span className="font-medium">{email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click the link in that email to reset your password.
          </p>
          
          <div className="pt-4 border-t mt-6">
            <p className="text-sm text-gray-500 mb-4">
              Didn't receive an email? Check your spam folder or try again.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setResetEmailSent(false)}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-md">
      <h2 className="text-xl font-semibold mb-2">Reset your password</h2>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className={`flex h-10 w-full rounded-md border ${
              error ? 'border-red-500' : 'border-input'
            } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            placeholder="you@example.com"
            required
          />
          {error && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {error}
            </p>
          )}
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Sending instructions...' : 'Send reset instructions'}
        </Button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Remember your password?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
} 