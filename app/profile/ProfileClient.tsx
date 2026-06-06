'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { CheckinWithEvent } from './page'

const BADGE_DEFS = [
  { id: 'first_steps', emoji: '👟', label: 'First Steps' },
  { id: 'consistent_runner', emoji: '🏅', label: 'Consistent Runner' },
  { id: 'strong_together', emoji: '💪', label: 'Strong Together' },
  { id: 'dedicated', emoji: '🔥', label: 'Dedicated' },
  { id: 'community_champion', emoji: '🏆', label: 'Community Champion' },
]

interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  display_name: string | null
  bio: string | null
  badges?: string[] | null
}

interface Props {
  profile: Profile
  checkins: CheckinWithEvent[]
}

export default function ProfileClient({ profile, checkins }: Props) {
  const { t, language } = useLanguage()
  const [displayName, setDisplayName] = useState(profile.display_name || profile.name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/'
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const initials = (displayName || profile.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }
    setUploading(true)
    setUploadError('')
    setUploadMsg('')

    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${profile.id}/avatar_${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('avatars')
      .upload(filename, file, { contentType: file.type, upsert: true })

    if (storageError) {
      setUploadError(storageError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id)

    if (updateError) {
      setUploadError(updateError.message)
    } else {
      setAvatarUrl(publicUrl + '?t=' + Date.now())
      setUploadMsg(t.profile.avatarUploaded)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null, bio: bio.trim() || null })
      .eq('id', profile.id)

    if (error) {
      setSaveMsg(t.common.error)
    } else {
      setSaveMsg(t.profile.saveSuccess)
      setTimeout(() => setSaveMsg(''), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="text-center">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
            {t.profile.title}
          </p>
          <h1 className="text-3xl font-black text-white">
            {displayName || profile.email}
          </h1>
        </div>

        {/* Avatar + Upload */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title={t.profile.uploadAvatar}
            className="relative group cursor-pointer disabled:cursor-not-allowed focus:outline-none"
            aria-label={t.profile.uploadAvatar}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName || 'Avatar'}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-brand-pink"
                unoptimized
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-pink/20 border-4 border-brand-pink flex items-center justify-center">
                <span className="text-brand-pink text-2xl font-black">{initials}</span>
              </div>
            )}

            <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity duration-200 ${
              uploading
                ? 'bg-black/50 opacity-100'
                : 'bg-black/40 opacity-0 group-hover:opacity-100'
            }`}>
              {uploading ? (
                <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>

            <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-pink rounded-full flex items-center justify-center border-2 border-brand-dark shadow">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </button>

          <p className="text-white/40 text-xs">{t.profile.uploadAvatar}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          {uploadMsg && <p className="text-green-400 text-xs text-center">{uploadMsg}</p>}
          {uploadError && <p className="text-red-400 text-xs text-center">{uploadError}</p>}
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="bg-gradient-card rounded-2xl p-6 border border-brand-wine/40 flex flex-col gap-4">
          <div>
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              {t.profile.displayName}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={profile.name || profile.email || ''}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              {t.profile.bio}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell the community about yourself..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors resize-none"
            />
          </div>
          {saveMsg && (
            <p className={`text-xs ${saveMsg === t.common.error ? 'text-red-400' : 'text-green-400'}`}>
              {saveMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-pink text-white font-bold py-3 px-6 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
          >
            {saving ? t.profile.saving : t.common.save}
          </button>
        </form>

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="bg-gradient-card rounded-2xl p-6 border border-brand-wine/40">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Badges Earned</p>
            <div className="flex flex-wrap gap-3">
              {BADGE_DEFS.filter((b) => profile.badges?.includes(b.id)).map((badge) => (
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

        {/* Stats */}
        <div className="bg-gradient-card rounded-2xl p-6 border border-brand-wine/40 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{t.profile.totalRuns}</p>
            <p className="text-4xl font-black text-brand-pink">{checkins.length}</p>
          </div>
          <Link
            href="/leaderboard"
            className="text-white/50 text-xs hover:text-brand-pink transition-colors underline"
          >
            {t.nav.leaderboard} →
          </Link>
        </div>

        {/* Check-in History */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">{t.profile.recentCheckins}</h2>
          {checkins.length === 0 ? (
            <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-8 text-center">
              <div className="text-4xl mb-3">🏃</div>
              <p className="text-white/40 text-sm">{t.profile.noCheckins}</p>
              <Link
                href="/next-run"
                className="inline-block mt-4 bg-brand-pink text-white font-bold px-6 py-2.5 rounded-full hover:bg-brand-pink/90 transition-colors text-sm"
              >
                {t.nav.nextRun}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {checkins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-pink/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {checkin.events?.title ?? 'Run'}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {checkin.events?.date
                        ? formatDate(checkin.events.date, language)
                        : formatDate(checkin.checked_in_at, language)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-brand-pink text-xs font-bold bg-brand-pink/10 px-2.5 py-1 rounded-full">
                      ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
