'use client';

import ProfileForm from '@/components/user/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
      </div>
      
      <ProfileForm />
    </div>
  );
} 