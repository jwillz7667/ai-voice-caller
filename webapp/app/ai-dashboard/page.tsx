'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import CallInterface from '@/components/call-interface';
import DTMFPhonePad from '@/components/dtmf-phone-pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Phone, Settings, History, Save, MessageSquare, Activity,
  CreditCard, User, LogOut, Menu, X, ChevronRight,
  Mic, MicOff, PhoneOff, PhoneCall, Bot, Brain,
  Zap, Shield, Globe, Database, Cloud, Code,
  Home, FileText, Users, HelpCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AIDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigationItems = [
    { href: '/ai-dashboard', label: 'Dashboard', icon: Home },
    { href: '/recordings', label: 'Recordings', icon: History },
    { href: '/logs', label: 'Call Logs', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <Brain className="h-8 w-8 text-blue-600" />
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Voice Assistant
                </h1>
                <p className="text-xs lg:text-sm text-gray-600">Welcome, {user.name || user.email}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Right side items */}
            <div className="flex items-center gap-2 lg:gap-4">
              <Badge variant="outline" className="px-2 lg:px-3 py-1">
                <CreditCard className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{user.credits || 0} Credits</span>
                <span className="sm:hidden">{user.credits || 0}</span>
              </Badge>

              {/* Desktop User Menu */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline">{user.name || 'Account'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/help')}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <Brain className="h-8 w-8 text-blue-600" />
                      <div>
                        <h2 className="font-bold text-lg">AI Assistant</h2>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    <nav className="flex-1 space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Button
                              variant={pathname === item.href ? "secondary" : "ghost"}
                              className="w-full justify-start gap-3"
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </nav>

                    <div className="border-t pt-4 space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          router.push('/help');
                          setMobileMenuOpen(false);
                        }}
                      >
                        <HelpCircle className="h-4 w-4" />
                        Help & Support
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-600"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Credits Remaining</p>
                      <p className="text-2xl font-bold text-blue-600">{user.credits || 0}</p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Call Interface */}
      <div className="container mx-auto px-4 py-4 md:py-6 max-w-full">
        <CallInterface />
      </div>
    </div>
  );
}