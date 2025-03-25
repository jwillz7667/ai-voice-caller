'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordStrength = 
    [hasMinLength, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;

  useEffect(() => {
    // Check if we're in a recovery flow
    const checkRecoveryMode = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking auth session:', error);
        toast.error('Authentication error. Please try again.');
        router.push('/login');
      }
    };
    
    checkRecoveryMode();
  }, [router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password is not strong enough';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      toast.success('Password updated successfully');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.error_description || error.message || 'Failed to update password');
      
      if (error.message.includes('Token expired')) {
        setErrors({
          ...errors,
          general: 'Your password reset link has expired. Please request a new one.',
        });
      } else {
        setErrors({
          ...errors,
          general: error.error_description || error.message || 'An error occurred',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-md">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Password Updated</h2>
          <p className="text-gray-600">
            Your password has been updated successfully.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            You will be redirected to the dashboard in a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-md">
      <h2 className="text-xl font-semibold mb-2">Set new password</h2>
      <p className="text-gray-500 text-sm mb-6">
        Please create a new password for your account.
      </p>
      
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {errors.general}
          </div>
        )}
        
        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors({ ...errors, password: '' });
                }
              }}
              className={`flex h-10 w-full rounded-md border ${
                errors.password ? 'border-red-500' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              placeholder="Create a strong password"
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
          
          {/* Password strength meter */}
          {password.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full ${
                      i < passwordStrength 
                        ? passwordStrength === 1 ? 'bg-red-500' 
                        : passwordStrength === 2 ? 'bg-orange-500' 
                        : passwordStrength === 3 ? 'bg-yellow-500' 
                        : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <ul className="space-y-1 text-xs">
                <li className={`flex items-center ${hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-3 h-3 mr-2 rounded-full ${hasMinLength ? 'bg-green-600' : 'bg-gray-200'}`} />
                  At least 8 characters
                </li>
                <li className={`flex items-center ${hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-3 h-3 mr-2 rounded-full ${hasUppercase ? 'bg-green-600' : 'bg-gray-200'}`} />
                  At least one uppercase letter
                </li>
                <li className={`flex items-center ${hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-3 h-3 mr-2 rounded-full ${hasNumber ? 'bg-green-600' : 'bg-gray-200'}`} />
                  At least one number
                </li>
                <li className={`flex items-center ${hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`inline-block w-3 h-3 mr-2 rounded-full ${hasSpecialChar ? 'bg-green-600' : 'bg-gray-200'}`} />
                  At least one special character
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {/* Confirm Password field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: '' });
                }
              }}
              className={`flex h-10 w-full rounded-md border ${
                errors.confirmPassword ? 'border-red-500' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.confirmPassword}
            </p>
          )}
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
    </div>
  );
} 