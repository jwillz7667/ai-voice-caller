'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function CustomLoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Login successful!');
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Error during login:', error);
      toast.error(error.error_description || error.message || 'Invalid email or password');
      
      // Set specific errors
      if (error.message.includes('Invalid login')) {
        setErrors({
          ...errors,
          password: 'Invalid email or password',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async () => {
    // Validate email
    if (!formData.email) {
      setErrors({
        ...errors,
        email: 'Email is required for magic link',
      });
      return;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({
        ...errors,
        email: 'Please enter a valid email address',
      });
      return;
    }
    
    setIsMagicLinkLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email.');
      
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      toast.error(error.error_description || error.message || 'Failed to send magic link');
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-md">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-gray-600">
            We've sent a magic link to <span className="font-medium">{formData.email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click the link in your email to sign in to your account.
          </p>
          
          <div className="pt-4 border-t mt-6">
            <p className="text-sm text-gray-500 mb-4">
              Didn't receive an email? Check your spam folder or try again.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setMagicLinkSent(false)}
            >
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-md">
      <h2 className="text-xl font-semibold mb-6">Sign in to your account</h2>
      
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`flex h-10 w-full rounded-md border ${
              errors.email ? 'border-red-500' : 'border-input'
            } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            placeholder="you@example.com"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.email}
            </p>
          )}
        </div>
        
        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link href="/reset-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border ${
                errors.password ? 'border-red-500' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.password}
            </p>
          )}
        </div>
        
        {/* Remember me */}
        <div className="flex items-center space-x-2">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="rememberMe" className="text-sm text-gray-600">
            Remember me
          </label>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleMagicLinkLogin}
          disabled={isMagicLinkLoading}
        >
          {isMagicLinkLoading ? 'Sending link...' : 'Magic link (passwordless)'}
        </Button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
} 