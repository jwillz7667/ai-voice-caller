"use client";

import React from 'react';
import ModernNavigation from './modern-navigation';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 safe-area">
      <ModernNavigation />
      <main className="relative">
        <div className="content-container page-padding">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
