'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useUserStore } from '@/lib/user-store';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, signOut, profile } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 mr-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Jingle.AI</span>
          </Link>
        </div>
        
        <nav className="flex-1 flex items-center justify-between">
          <div className="hidden md:flex gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Home
            </Link>
            {user && (
              <>
                <Link 
                  href="/dashboard" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/credits" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard/credits' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  Credits
                </Link>
                <Link 
                  href="/app" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/app' ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  Call Dashboard
                </Link>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!user ? (
              <div className="hidden md:flex gap-2">
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent relative"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{profile?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.credits || 0} credits</p>
                  </div>
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <div className="block px-4 py-2 text-sm text-muted-foreground border-b">
                        Signed in as<br />
                        <span className="font-medium text-foreground">{user.email}</span>
                      </div>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                        onClick={() => setMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/credits"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                        onClick={() => setMenuOpen(false)}
                      >
                        Credits
                      </Link>
                      <Link
                        href="/app"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                        onClick={() => setMenuOpen(false)}
                      >
                        Call Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent border-t"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t p-4">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/"
              className="text-foreground hover:text-primary"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/dashboard/credits"
                  className="text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Credits
                </Link>
                <Link
                  href="/app"
                  className="text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Call Dashboard
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="text-left text-foreground hover:text-primary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-foreground hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
} 