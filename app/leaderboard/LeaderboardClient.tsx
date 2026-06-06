'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/components/providers/LanguageProvider'
import type { LeaderboardEntry } from './page'

interface Props {
  monthly: LeaderboardEntry[]
  yearly: LeaderboardEntry[]
  allTime: LeaderboardEntry[]
  currentUserId: string | null
}

type Tab = 'monthly' | 'yearly' | 'allTime'

function getInitials(entry: LeaderboardEntry): string {
  const name = entry.display_name || entry.name || '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function PositionNumber({ position }: { position: number }) {
  if (position === 1)
    return (
      <span className="text-yellow-400 font-black text-lg w-8 text-center flex-shrink-0">
        #1
      </span>
    )
  if (position === 2)
    return (
      <span className="text-slate-300 font-black text-base w-8 text-center flex-shrink-0">
        #2
      </span>
    )
  if (position === 3)
    return (
      <span className="text-amber-600 font-black text-base w-8 text-center flex-shrink-0">
        #3
      </span>
    )
  return (
    <span className="text-white/30 font-bold text-sm w-8 text-center flex-shrink-0">
      #{position}
    </span>
  )
}

function LeaderboardRow({
  entry,
  position,
  isCurrentUser,
}: {
  entry: LeaderboardEntry
  position: number
  isCurrentUser: boolean
}) {
  const { t } = useLanguage()
  const isFirst = position === 1
  const displayName = entry.display_name || entry.name || 'Runner'

  const rowClass = isCurrentUser
    ? 'bg-brand-pink/15 border-brand-pink/50 shadow-lg shadow-brand-pink/15 ring-1 ring-brand-pink/30'
    : isFirst
    ? 'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
    : position === 2
    ? 'bg-slate-400/10 border-slate-400/20'
    : position === 3
    ? 'bg-amber-700/10 border-amber-700/20'
    : 'bg-white/[0.03] border-white/5'

  const avatarBorderClass = isCurrentUser
    ? 'border-brand-pink'
    : isFirst
    ? 'border-yellow-400'
    : position === 2
    ? 'border-slate-300'
    : position === 3
    ? 'border-amber-600'
    : 'border-white/20'

  const countColorClass = isCurrentUser
    ? 'text-brand-pink'
    : isFirst
    ? 'text-yellow-400'
    : position === 2
    ? 'text-slate-300'
    : position === 3
    ? 'text-amber-500'
    : 'text-white/70'

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl px-4 py-4 border transition-all ${rowClass}`}
    >
      {/* Position */}
      <PositionNumber position={position} />

      {/* Avatar */}
      <div className="flex-shrink-0">
        {entry.avatar_url ? (
          <Image
            src={entry.avatar_url}
            alt={displayName}
            width={44}
            height={44}
            className={`w-11 h-11 rounded-full object-cover border-2 ${avatarBorderClass}`}
            unoptimized
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
              isCurrentUser
                ? 'bg-brand-pink/20 border-brand-pink text-brand-pink'
                : isFirst
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400'
                : 'bg-white/10 border-white/20 text-white/60'
            }`}
          >
            <span className="text-sm font-bold">{getInitials(entry)}</span>
          </div>
        )}
      </div>

      {/* Name + Leader badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`font-bold text-sm truncate ${
              isCurrentUser ? 'text-brand-pink' : isFirst ? 'text-yellow-300' : 'text-white/80'
            }`}
          >
            {displayName}
            {isCurrentUser && ' (You)'}
          </p>
          {isFirst && (
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/30 flex-shrink-0">
              {t.leaderboard.currentLeader}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {position === 1 && <span className="text-base">🥇</span>}
          {position === 2 && <span className="text-base">🥈</span>}
          {position === 3 && <span className="text-base">🥉</span>}
        </div>
      </div>

      {/* Run count */}
      <div className="flex-shrink-0 text-right">
        <p className={`text-2xl font-black ${countColorClass}`}>{entry.run_count}</p>
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">
          {t.leaderboard.runs}
        </p>
      </div>
    </div>
  )
}

export default function LeaderboardClient({
  monthly,
  yearly,
  allTime,
  currentUserId,
}: Props) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<Tab>('allTime')

  const data: Record<Tab, LeaderboardEntry[]> = { monthly, yearly, allTime }
  const entries = data[activeTab]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'monthly', label: t.leaderboard.monthly },
    { key: 'yearly', label: t.leaderboard.yearly },
    { key: 'allTime', label: t.leaderboard.allTime },
  ]

  // Find the current user's position in the list (may be > 10)
  const currentUserIndex = currentUserId
    ? entries.findIndex((e) => e.profile_id === currentUserId)
    : -1
  const currentUserEntry = currentUserIndex >= 0 ? entries[currentUserIndex] : null
  const currentUserPosition = currentUserIndex >= 0 ? currentUserIndex + 1 : null

  // Show top 10 in the main list
  const topEntries = entries.slice(0, 10)
  // Show pinned user row only if they exist and are outside top 10
  const showPinnedUser =
    currentUserEntry && currentUserPosition !== null && currentUserPosition > 10

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
            {t.leaderboard.subtitle}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            {t.leaderboard.title}
          </h1>
          {entries.length > 0 && (
            <p className="text-white/40 text-sm">
              {entries.length} runner{entries.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center">
          <div className="flex bg-white/5 rounded-full p-1 gap-1 border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/30'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard list */}
        {entries.length === 0 ? (
          <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-12 text-center">
            <div className="text-5xl mb-4">🏃</div>
            <p className="text-white/40 text-sm">{t.leaderboard.empty}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {topEntries.map((entry, index) => (
              <LeaderboardRow
                key={entry.profile_id}
                entry={entry}
                position={index + 1}
                isCurrentUser={entry.profile_id === currentUserId}
              />
            ))}

            {/* Pinned current user row if outside top 10 */}
            {showPinnedUser && currentUserEntry && currentUserPosition && (
              <>
                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/20 text-xs">···</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <LeaderboardRow
                  entry={currentUserEntry}
                  position={currentUserPosition}
                  isCurrentUser
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
