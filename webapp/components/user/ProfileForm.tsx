'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useUserStore } from '@/lib/user-store';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, User } from 'lucide-react';

export default function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const { setProfile } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    jobTitle: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        jobTitle: profile.job_title || '',
      });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
    
    // Clear success message when user makes changes
    if (success) {
      setSuccess(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !user) {
      return;
    }

    const file = files[0];
    const fileSize = file.size / 1024 / 1024; // Convert to MB
    
    // Validate file size (max 2MB)
    if (fileSize > 2) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setAvatarLoading(true);
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(avatarUrl);
      await refreshProfile();
      toast.success('Profile picture updated');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.phone && !/^\+?[0-9\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!validateForm()) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          company: formData.company || null,
          job_title: formData.jobTitle || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await refreshProfile();
      setSuccess(true);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full p-6">
      <div className="flex flex-col space-y-1.5 pb-5">
        <h3 className="font-semibold text-lg">Your Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your personal information
        </p>
      </div>
      
      {/* Avatar section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-6 border-b">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {avatarLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="loader w-8 h-8 border-2 border-t-2 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <p className="text-sm font-medium">Profile Picture</p>
          <p className="text-xs text-gray-500 mb-2">
            JPG, PNG or GIF. Max size 2MB.
          </p>
          <div className="flex gap-2">
            <label 
              htmlFor="avatar-upload" 
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              {avatarUrl ? 'Change Picture' : 'Upload Picture'}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarLoading}
                className="hidden"
              />
            </label>
            
            {avatarUrl && (
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (user) {
                    setAvatarLoading(true);
                    try {
                      await supabase
                        .from('profiles')
                        .update({
                          avatar_url: null,
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', user.id);
                        
                      setAvatarUrl(null);
                      await refreshProfile();
                      toast.success('Profile picture removed');
                    } catch (error) {
                      console.error('Error removing avatar:', error);
                      toast.error('Failed to remove profile picture');
                    } finally {
                      setAvatarLoading(false);
                    }
                  }
                }}
                disabled={avatarLoading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 rounded-md p-3 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Profile information saved successfully
        </div>
      )}
      
      <form onSubmit={updateProfile} className="space-y-4">
        {/* Email field - readonly */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`flex h-10 w-full rounded-md border ${
              errors.name ? 'border-red-500' : 'border-input'
            } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            placeholder="Enter your full name"
            required
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.name}
            </p>
          )}
        </div>
        
        {/* Phone field */}
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className={`flex h-10 w-full rounded-md border ${
              errors.phone ? 'border-red-500' : 'border-input'
            } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            placeholder="Enter your phone number"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>
        
        {/* Company field */}
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium">
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={formData.company}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your company name"
          />
        </div>
        
        {/* Job Title field */}
        <div className="space-y-2">
          <label htmlFor="jobTitle" className="text-sm font-medium">
            Job Title
          </label>
          <input
            id="jobTitle"
            name="jobTitle"
            type="text"
            value={formData.jobTitle}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your job title"
          />
        </div>
        
        <Button
          type="submit"
          className="mt-2"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
} 