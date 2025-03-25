'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function CustomSignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const router = useRouter();

  // Password strength indicators
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
  const passwordStrength = 
    [hasMinLength, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password is not strong enough';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Create initial profile with 10 free credits
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            credits: 10, // Start with 10 free credits
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      
      // Show success message
      toast.success('Registration successful! Please check your email to verify your account.');
      setStep('verification');
      
    } catch (error: any) {
      console.error('Error during signup:', error);
      toast.error(error.error_description || error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verification') {
    return (
      <div className="p-8 rounded-lg border bg-card text-card-foreground shadow-md">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-gray-600">
            We've sent a verification link to <span className="font-medium">{formData.email}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click the link in your email to verify your account and continue to the dashboard.
          </p>
          
          <div className="pt-4 border-t mt-6">
            <p className="text-sm text-gray-500 mb-4">
              Didn't receive an email? Check your spam folder or try again.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setStep('form')}
            >
              Back to sign up
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-md">
      <h2 className="text-xl font-semibold mb-6">Create your account</h2>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Your name"
          />
        </div>
        
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
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
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
          {formData.password.length > 0 && (
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
        
        {/* Terms checkbox */}
        <div className="space-y-2">
          <div className="flex items-start">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
            />
            <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-600">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.agreeToTerms}
            </p>
          )}
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
} 