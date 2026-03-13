'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import {
  Sun, Moon, Menu, X, PenSquare, LogIn, LogOut,
  BookOpen, Sparkles, ChevronDown, Shield, LayoutDashboard, Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

export function Navbar() {
  const { data: session } = useSession();
  const { isManager, label: roleLabel, badgeColor } = useRole();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // WCAG 2.1.2 — close menus on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/blog?category=technology', label: 'Technology' },
    { href: '/blog?category=tutorial', label: 'Tutorials' },
    { href: '/contact', label: 'Contact' },
  ];

  const dashboardLink = { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-800/50'
          : 'bg-transparent'
      )}
    >
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-sky-500/30 dark:shadow-sky-500/20 transition-all group-hover:scale-105">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">DevBlog</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}

            {session ? (
              <div className="relative flex items-center gap-2">
                <Button variant="default" size="sm" className="hidden md:flex" asChild>
                  <Link href="/create">
                    <PenSquare className="w-4 h-4" />
                    Write
                  </Link>
                </Button>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label={`${session.user?.name ?? 'User'} menu`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-sky-500/30">
                    <AvatarImage src={session.user?.image || undefined} alt={session.user?.name ?? 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-semibold">
                      {session.user?.name?.[0] ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-gray-600 hidden md:block" />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{session.user?.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{roleLabel}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-600 truncate">{session.user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start" asChild onClick={() => setUserMenuOpen(false)}>
                        <Link href="/profile">
                          <Sparkles className="w-4 h-4 mr-2" />
                          My Profile
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" asChild onClick={() => setUserMenuOpen(false)}>
                        <Link href="/dashboard">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" asChild onClick={() => setUserMenuOpen(false)}>
                        <Link href="/bookmarks">
                          <Bookmark className="w-4 h-4 mr-2" />
                          Saved Posts
                        </Link>
                      </Button>
                      {isManager && (
                        <>
                          <Button variant="ghost" size="sm" className="w-full justify-start" asChild onClick={() => setUserMenuOpen(false)}>
                            <Link href="/create">
                              <PenSquare className="w-4 h-4 mr-2" />
                              Write Post
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-amber-600 dark:text-amber-400" asChild onClick={() => setUserMenuOpen(false)}>
                            <Link href="/admin">
                              <Shield className="w-4 h-4 mr-2" />
                              Admin Panel
                            </Link>
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 dark:text-red-400"
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="default" size="sm" className="hidden md:flex" asChild onClick={() => signIn()}>
                <Link href="/auth/signin">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div id="mobile-menu" role="region" aria-label="Mobile navigation" className="md:hidden pb-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 dark:border-gray-800">
              {navLinks.map((link) => (
                <Button key={link.href} variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
              {session ? (
                <>
                  <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/profile">
                      <Sparkles className="w-4 h-4 mr-2" /> My Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/bookmarks">
                      <Bookmark className="w-4 h-4 mr-2" /> Saved Posts
                    </Link>
                  </Button>
                  <Button variant="default" size="sm" className="mt-2 w-full" asChild onClick={() => setMobileOpen(false)}>
                    <Link href="/create">
                      <PenSquare className="w-4 h-4 mr-2" /> Write Post
                    </Link>
                  </Button>
                  {isManager && (
                    <Button variant="ghost" size="sm" className="justify-start text-amber-600 dark:text-amber-400" asChild onClick={() => setMobileOpen(false)}>
                      <Link href="/admin">
                        <Shield className="w-4 h-4 mr-2" /> Admin Panel
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-red-600 dark:text-red-400"
                    onClick={() => { signOut(); setMobileOpen(false); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" className="mt-2" onClick={() => { signIn(); setMobileOpen(false); }}>
                  <LogIn className="w-4 h-4 mr-2" /> Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
