'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Logo from './Logo'
import LanguageToggle from './LanguageToggle'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null)
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null)
  // Track whether we have resolved the initial auth state.
  // This prevents the navbar from flashing "logged in" then "logged out"
  // (or vice-versa) during the first render cycle.
  const [authReady, setAuthReady] = useState(false)

  // Re-fetch profile data whenever the route changes so avatar/name updates
  // immediately after the user edits their profile (fixes stale header avatar).
  useEffect(() => {
    const supabase = createClient()

    /**
     * Load the current user AND their admin flag in a single async block so
     * both pieces of state are set together, avoiding a render where `user`
     * is set but `isAdmin` is still false (which caused the Admin link to
     * never appear).
     */
    const loadUserAndAdmin = async (currentUser: User | null) => {
      if (!currentUser) {
        setUser(null)
        setIsAdmin(false)
        setProfileAvatar(null)
        setProfileDisplayName(null)
        return
      }

      // Profiles are publicly readable (RLS: "Public profiles are viewable by
      // everyone"), so the anon key is sufficient here.
      // Bug Extra 1 fix: also fetch display_name and avatar_url from the profiles
      // table so the header always reflects the data saved during onboarding/profile
      // edit, not the stale auth metadata that never updates after sign-up.
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, display_name, avatar_url')
        .eq('id', currentUser.id)
        .single()

      // Set all values atomically so a single re-render picks them all up.
      setUser(currentUser)
      setIsAdmin(!error && data?.is_admin === true)
      setProfileAvatar(data?.avatar_url ?? null)
      setProfileDisplayName(data?.display_name ?? null)
    }

    // Resolve the initial session from the cookie / local storage.
    supabase.auth.getUser().then(({ data: { user: initialUser } }) => {
      loadUserAndAdmin(initialUser).finally(() => setAuthReady(true))
    })

    // Keep state in sync with auth events (sign-in, sign-out, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUserAndAdmin(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  // pathname is intentionally included: re-fetch profile on every route change
  // so that avatar/display_name updates are reflected immediately in the header
  // when the user navigates away from /profile after saving changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleLogout = async () => {
    setIsMenuOpen(false)
    const supabase = createClient()
    // Clear local state immediately so the navbar updates before the redirect.
    setUser(null)
    setIsAdmin(false)
    await supabase.auth.signOut()
    // Hard navigate to home — forces a full page reload so the server
    // re-evaluates the cleared session cookie (fixes admin redirect loop).
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/next-run', label: t.nav.nextRun },
    { href: '/gallery', label: t.nav.gallery },
    { href: '/leaderboard', label: t.nav.leaderboard },
    { href: '/about', label: (t.nav as Record<string, string>).about },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: t.nav.admin }] : []),
    ...(isAdmin ? [{ href: '/admin/sponsors', label: 'Sponsors' }] : []),
    ...(isAdmin ? [{ href: '/admin/metrics', label: 'Metrics' }] : []),
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-brand-dark/95 backdrop-blur-md shadow-lg shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex-shrink-0" onClick={() => setIsMenuOpen(false)}>
              <Logo className="h-16 w-auto" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative group ${
                    pathname === link.href ? 'text-brand-pink' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-brand-pink transition-all duration-200 ${
                      pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              ))}
            </nav>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageToggle />
              {/*
               * Only render the auth-dependent UI after the initial session
               * check has resolved.  This prevents a flash of the "Login"
               * button for authenticated users (and vice-versa) on first load.
               */}
              {authReady && (
                user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      title={t.nav.profile}
                    >
                      {(profileAvatar || user.user_metadata?.avatar_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(profileAvatar || user.user_metadata?.avatar_url) as string}
                          alt="avatar"
                          className="w-8 h-8 rounded-full border-2 border-brand-pink"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-pink/20 border-2 border-brand-pink flex items-center justify-center">
                          <span className="text-brand-pink text-xs font-bold">
                            {(profileDisplayName || user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {t.nav.logout}
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="bg-brand-pink text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-brand-pink/90 transition-colors"
                  >
                    {t.nav.login}
                  </Link>
                )
              )}
            </div>

            {/* Mobile right — hamburger button */}
            <div className="md:hidden flex items-center gap-3">
              <LanguageToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white p-1.5 z-[60] relative"
                aria-label="Toggle menu"
              >
                <div className="w-5 flex flex-col gap-[5px]">
                  <span className={`block h-0.5 bg-white rounded transition-all duration-300 origin-center ${isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                  <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                  <span className={`block h-0.5 bg-white rounded transition-all duration-300 origin-center ${isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full-screen overlay menu */}
      <div
        className={`md:hidden fixed inset-0 z-[55] transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dark backdrop */}
        <div
          className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu content */}
        <div
          className={`relative h-full flex flex-col px-8 pt-28 pb-12 transition-transform duration-300 ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
        >
          {/* Pink accent bar at top */}
          <div className="absolute top-20 left-0 right-0 h-px bg-gradient-pink opacity-60" />

          <nav className="flex flex-col gap-2 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`text-2xl font-semibold py-3 border-b border-white/10 transition-colors ${
                  pathname === link.href
                    ? 'text-brand-pink'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {authReady && (
              user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-2xl font-semibold py-3 border-b border-white/10 transition-colors ${
                      pathname === '/profile' ? 'text-brand-pink' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {t.nav.profile}
                  </Link>
                  <Link
                    href="/checkin"
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-2xl font-semibold py-3 border-b border-white/10 transition-colors ${
                      pathname === '/checkin' ? 'text-brand-pink' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Scan QR Check-in
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-2xl font-semibold py-3 border-b border-white/10 text-brand-pink hover:text-brand-pink/80 text-left transition-colors w-full"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <div className="pt-6">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block bg-brand-pink text-white text-lg font-bold px-8 py-4 rounded-full text-center hover:bg-brand-pink/90 transition-colors"
                  >
                    {t.nav.login}
                  </Link>
                </div>
              )
            )}
          </nav>

          {/* Bottom brand mark */}
          <p className="text-white/20 text-xs text-center mt-8 tracking-widest uppercase">
            Strong Together Run Club
          </p>
        </div>
      </div>
    </>
  )
}
