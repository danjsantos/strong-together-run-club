'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RecentCheckin } from './page'

// ─── Badge definitions ────────────────────────────────────────────────────────
const BADGE_DEFS = [
  { id: 'first_steps', emoji: '👟', label: 'First Steps', threshold: 1 },
  { id: 'consistent_runner', emoji: '🏅', label: 'Consistent Runner', threshold: 5 },
  { id: 'strong_together', emoji: '💪', label: 'Strong Together', threshold: 10 },
  { id: 'dedicated', emoji: '🔥', label: 'Dedicated', threshold: 25 },
  { id: 'community_champion', emoji: '🏆', label: 'Community Champion', threshold: 50 },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  id: string
  name: string | null
  email: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  city: string | null
  goals: string[] | null
  badges: string[] | null
  onboarding_complete: boolean | null
  is_admin: boolean | null
}

interface NextEvent {
  id: string
  title: string
  date: string
  location: string
  google_maps_url: string | null
}

interface Props {
  profile: Profile | null
  totalCheckins: number
  recentCheckins: RecentCheckin[]
  nextEvent: NextEvent | null
  hasRsvp: boolean
  leaderboardPosition: number | null
  streak: number
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function SidebarLink({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/30'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      {children}
    </div>
  )
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(profile: Profile | null) {
  const name = profile?.display_name || profile?.name || '?'
  return name.charAt(0).toUpperCase()
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardClient({
  profile,
  totalCheckins,
  recentCheckins,
  nextEvent,
  hasRsvp: initialHasRsvp,
  leaderboardPosition,
  streak,
}: Props) {
  const router = useRouter()
  const [hasRsvp, setHasRsvp] = useState(initialHasRsvp)
  const [rsvping, setRsvping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Dashboard name fix: prefer display_name, then name, then the part of the
  // email address before the '@' sign.  Never fall back to the generic 'Runner'.
  const emailPrefix = profile?.email ? profile.email.split('@')[0] : null
  const displayName = profile?.display_name || profile?.name || emailPrefix || 'Runner'
  const earnedBadges = BADGE_DEFS.filter((b) => totalCheckins >= b.threshold)

  const handleRsvp = async () => {
    if (!nextEvent || hasRsvp) return
    setRsvping(true)
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: nextEvent.id, name: displayName }),
      })
      if (res.ok || res.status === 409) {
        setHasRsvp(true)
      }
    } finally {
      setRsvping(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // ── Sidebar content ─────────────────────────────────────────────────────────
  const sidebar = (
    <aside className="flex flex-col gap-2 h-full">
      {/* Avatar + name */}
      <div className="flex items-center gap-3 px-4 py-4 mb-2">
        <div className="flex-shrink-0">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url.includes('?') ? profile.avatar_url : `${profile.avatar_url}?t=${Date.now()}`}
              alt={displayName}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-brand-pink"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-pink/20 border-2 border-brand-pink flex items-center justify-center text-brand-pink font-bold text-sm">
              {getInitials(profile)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{displayName}</p>
          {profile?.city && (
            <p className="text-white/40 text-xs truncate">{profile.city}</p>
          )}
        </div>
      </div>

      <div className="h-px bg-white/10 mx-4 mb-2" />

      <SidebarLink
        href="/dashboard"
        label="Dashboard"
        active
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }
      />
      <SidebarLink
        href="/next-run"
        label="My Runs"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <SidebarLink
        href="/profile"
        label="Profile"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />

      <div className="flex-1" />

      <div className="h-px bg-white/10 mx-4 mb-2" />
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white hover:bg-white/5 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-64 flex-shrink-0 bg-brand-dark/80 backdrop-blur-xl border-r border-white/10 flex-col p-4 pt-20 sticky top-0 h-screen">
        {sidebar}
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-brand-dark border-r border-white/10 p-4 pt-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile header bar */}
        <div className="md:hidden flex items-center gap-3 mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white font-bold text-lg">Dashboard</h1>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          {/* Page title */}
          <div className="hidden md:block">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Welcome back</p>
            <h1 className="text-2xl font-black text-white">{displayName} 👋</h1>
          </div>

          {/* ── Onboarding nudge (soft — never blocks access) ─────────────────── */}
          {!profile?.onboarding_complete && (
            <div className="flex items-center justify-between gap-4 bg-brand-pink/10 border border-brand-pink/30 rounded-2xl px-5 py-4">
              <div>
                <p className="text-brand-pink font-bold text-sm">Complete your profile 🏃</p>
                <p className="text-white/50 text-xs mt-0.5">Add your name, photo and running goals so the community knows you!</p>
              </div>
              <a
                href="/onboarding"
                className="flex-shrink-0 bg-brand-pink text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-brand-pink/90 transition-colors"
              >
                Set up
              </a>
            </div>
          )}

          {/* ── Top cards ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Card 1: Total check-ins */}
            <StatCard>
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Total Check-ins</p>
                <span className="text-2xl">👟</span>
              </div>
              <p className="text-4xl font-black text-white">{totalCheckins}</p>
              <p className="text-white/40 text-xs">runs attended</p>
            </StatCard>

            {/* Card: Week streak */}
            <StatCard>
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Week Streak</p>
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-4xl font-black text-white">{streak}</p>
              <p className="text-white/40 text-xs">
                {streak === 0
                  ? 'check in weekly to start a streak'
                  : streak === 1
                  ? 'week in a row'
                  : 'weeks in a row'}
              </p>
            </StatCard>

            {/* Card 2: Next upcoming run */}
            <StatCard>
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Next Run</p>
                <span className="text-2xl">📅</span>
              </div>
              {nextEvent ? (
                <>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{nextEvent.title}</p>
                    <p className="text-white/50 text-xs mt-1">{formatDate(nextEvent.date)} · {formatTime(nextEvent.date)}</p>
                    <p className="text-white/40 text-xs">{nextEvent.location}</p>
                  </div>
                  {hasRsvp ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 bg-brand-pink/10 border border-brand-pink/30 rounded-xl px-3 py-2">
                        <svg className="w-4 h-4 text-brand-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-brand-pink text-xs font-bold">You&apos;re Going ✓</span>
                      </div>
                      {nextEvent.google_maps_url && (
                        <a
                          href={nextEvent.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-xs text-white/40 hover:text-brand-pink transition-colors underline"
                        >
                          Get Directions →
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleRsvp}
                      disabled={rsvping}
                      className="w-full bg-brand-pink text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-pink/90 transition-colors disabled:opacity-50"
                    >
                      {rsvping ? 'RSVPing...' : "I'm Going →"}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-white/30 text-sm">No upcoming runs scheduled.</p>
              )}
            </StatCard>

            {/* Card 3: Leaderboard position */}
            <StatCard>
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Leaderboard</p>
                <span className="text-2xl">🏆</span>
              </div>
              {leaderboardPosition ? (
                <>
                  <p className="text-4xl font-black text-white">
                    #{leaderboardPosition}
                  </p>
                  <p className="text-white/40 text-xs">your all-time rank</p>
                  <Link
                    href="/leaderboard"
                    className="text-brand-pink text-xs font-semibold hover:underline"
                  >
                    View full leaderboard →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-white/30 text-sm">Check in to a run to appear on the leaderboard!</p>
                  <Link href="/leaderboard" className="text-brand-pink text-xs font-semibold hover:underline">
                    View leaderboard →
                  </Link>
                </>
              )}
            </StatCard>
          </div>

          {/* ── Badges ──────────────────────────────────────────────────────── */}
          {earnedBadges.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Your Badges</p>
              <div className="flex flex-wrap gap-3">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 bg-brand-pink/10 border border-brand-pink/20 rounded-full px-4 py-2"
                  >
                    <span className="text-lg">{badge.emoji}</span>
                    <span className="text-white text-xs font-semibold">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent check-in history ──────────────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Recent Check-ins</p>
            {recentCheckins.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🏃</p>
                <p className="text-white/30 text-sm">No check-ins yet. Join a run to get started!</p>
                <Link href="/next-run" className="inline-block mt-4 bg-brand-pink text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-brand-pink/90 transition-colors">
                  See Next Run
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentCheckins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className="flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-pink/10 border border-brand-pink/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {checkin.events?.title ?? 'Run Event'}
                      </p>
                      <p className="text-white/40 text-xs">
                        {formatDate(checkin.checked_in_at)}
                      </p>
                    </div>
                    <span className="text-green-400 text-xs font-semibold flex-shrink-0">✓ Checked in</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
