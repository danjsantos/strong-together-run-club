'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4

interface RunProfile {
  displayName: string
  bio: string
  city: string
  experienceLevel: string
  weeklyMileage: string
  avgPace: string
  preferredDistance: string
  shoeBrand: string
  goals: string[]
  avatarUrl: string
  avatarFile: File | null
}

// ─── Option chips ─────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onClick,
  emoji,
}: {
  label: string
  selected: boolean
  onClick: () => void
  emoji?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
        selected
          ? 'bg-brand-pink border-brand-pink text-white shadow-lg shadow-brand-pink/30 scale-[1.03]'
          : 'bg-white/5 border-white/20 text-white/70 hover:border-brand-pink/60 hover:text-white'
      }`}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </button>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < step ? 'bg-brand-pink' : 'bg-white/15'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [profile, setProfile] = useState<RunProfile>({
    displayName: '',
    bio: '',
    city: '',
    experienceLevel: '',
    weeklyMileage: '',
    avgPace: '',
    preferredDistance: '',
    shoeBrand: '',
    goals: [],
    avatarUrl: '',
    avatarFile: null,
  })

  // Load current user — also guard against already-onboarded users
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      // If the user has already completed onboarding, send them to /dashboard
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('onboarding_complete, display_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profileRow?.onboarding_complete) {
        router.replace('/dashboard')
        return
      }

      setUserId(user.id)
      // Pre-fill name from auth metadata or existing profile
      const name = profileRow?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || ''
      const avatar = profileRow?.avatar_url || user.user_metadata?.avatar_url || ''
      setProfile((p) => ({ ...p, displayName: name, avatarUrl: avatar }))
    })
  }, [router])

  const set = <K extends keyof RunProfile>(key: K, value: RunProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }))

  const toggleGoal = (goal: string) => {
    setProfile((p) => ({
      ...p,
      goals: p.goals.includes(goal)
        ? p.goals.filter((g) => g !== goal)
        : [...p.goals, goal],
    }))
  }

  // ── Avatar preview ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setProfile((p) => ({ ...p, avatarFile: file, avatarUrl: url }))
  }

  // ── Final save ──────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()

    let finalAvatarUrl = profile.avatarUrl

    // Upload avatar if a new file was chosen
    if (profile.avatarFile) {
      const ext = profile.avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, profile.avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        finalAvatarUrl = urlData.publicUrl
      }
    }

    // Save ALL collected data including city, goals (jsonb), and mark onboarding complete
    await supabase.from('profiles').upsert({
      id: userId,
      display_name: profile.displayName || null,
      name: profile.displayName || null,
      bio: profile.bio || null,
      avatar_url: finalAvatarUrl || null,
      city: profile.city || null,
      goals: profile.goals.length > 0 ? profile.goals : null,
      experience_level: profile.experienceLevel || null,
      weekly_mileage: profile.weeklyMileage || null,
      avg_pace: profile.avgPace || null,
      preferred_distance: profile.preferredDistance || null,
      shoe_brand: profile.shoeBrand || null,
      running_goals: profile.goals.length > 0 ? profile.goals : null,
      onboarding_complete: true,
    }, { onConflict: 'id' })

    setSaving(false)
    router.push('/dashboard')
  }

  // ── Skip (marks onboarding complete so it won't show again) ─────────────────
  const handleSkip = async () => {
    if (!userId) { router.push('/dashboard'); return }
    const supabase = createClient()
    await supabase.from('profiles').upsert(
      { id: userId, onboarding_complete: true },
      { onConflict: 'id' }
    )
    router.push('/dashboard')
  }

  const canNext = () => {
    if (step === 1) return true // avatar optional
    if (step === 2) return profile.displayName.trim().length > 0
    if (step === 3) return true // all optional
    return true
  }

  const next = () => {
    if (step < 4) setStep((s) => (s + 1) as Step)
    else handleFinish()
  }

  const back = () => {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  // ── STEP LABELS ─────────────────────────────────────────────────────────────
  const stepLabels = ['Photo', 'About You', 'Running Stats', 'Your Goals']

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-pink/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo className="h-12 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-brand-dark/85 backdrop-blur-xl rounded-3xl border border-brand-wine/40 p-8 shadow-2xl">
          {/* Step label */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-brand-pink text-xs font-bold uppercase tracking-widest">
              Step {step} of 4
            </span>
            <span className="text-white/30 text-xs">{stepLabels[step - 1]}</span>
          </div>

          <ProgressBar step={step} total={4} />

          {/* ── STEP 1: Avatar ── */}
          {step === 1 && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-2xl font-black text-white mb-1">Add Your Photo</h2>
                <p className="text-white/50 text-sm">Put a face to your name — show the community who you are!</p>
              </div>

              {/* Avatar circle */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-brand-pink/60 hover:border-brand-pink transition-all duration-200 shadow-xl shadow-brand-pink/20"
              >
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt="avatar preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-brand-pink/10 flex items-center justify-center">
                    <svg className="w-12 h-12 text-brand-pink/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <p className="text-white/40 text-xs text-center">
                Tap the circle to upload a photo
                <br />
                <span className="text-brand-pink/60">You can skip this and add it later</span>
              </p>
            </div>
          )}

          {/* ── STEP 2: About You ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-white mb-1">Tell Us About You</h2>
                <p className="text-white/50 text-sm">How should the community know you?</p>
              </div>

              {/* Display name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Display Name *</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => set('displayName', e.target.value)}
                  placeholder="e.g. Ana Cristina"
                  maxLength={40}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">City / Location</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Myrtle Beach, SC"
                  maxLength={60}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
                />
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Short Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  placeholder="e.g. Mom of 3, running since 2020. Love early morning miles and coffee after!"
                  maxLength={160}
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors resize-none"
                />
                <span className="text-white/25 text-xs text-right">{profile.bio.length}/160</span>
              </div>
            </div>
          )}

          {/* ── STEP 3: Running Stats ── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-white mb-1">Your Running Stats</h2>
                <p className="text-white/50 text-sm">Help us match you with the right group pace</p>
              </div>

              {/* Experience level */}
              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Experience Level</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'beginner', label: 'Beginner', emoji: '🌱', sub: '< 1 year' },
                    { value: 'intermediate', label: 'Intermediate', emoji: '🏃', sub: '1–3 years' },
                    { value: 'advanced', label: 'Advanced', emoji: '⚡', sub: '3+ years' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('experienceLevel', opt.value)}
                      className={`flex-1 min-w-[90px] flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all duration-200 ${
                        profile.experienceLevel === opt.value
                          ? 'bg-brand-pink/20 border-brand-pink text-white shadow-lg shadow-brand-pink/20'
                          : 'bg-white/5 border-white/15 text-white/60 hover:border-brand-pink/40'
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] text-white/40">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly mileage */}
              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Weekly Mileage</label>
                <div className="flex flex-wrap gap-2">
                  {['0–10 mi', '10–20 mi', '20–30 mi', '30–40 mi', '40+ mi'].map((m) => (
                    <Chip
                      key={m}
                      label={m}
                      selected={profile.weeklyMileage === m}
                      onClick={() => set('weeklyMileage', m)}
                    />
                  ))}
                </div>
              </div>

              {/* Preferred distance */}
              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Favorite Distance</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '5K', emoji: '🏅' },
                    { label: '10K', emoji: '🥈' },
                    { label: 'Half Marathon', emoji: '🥇' },
                    { label: 'Marathon', emoji: '🏆' },
                    { label: 'Ultra', emoji: '🦁' },
                  ].map((d) => (
                    <Chip
                      key={d.label}
                      label={d.label}
                      emoji={d.emoji}
                      selected={profile.preferredDistance === d.label}
                      onClick={() => set('preferredDistance', d.label)}
                    />
                  ))}
                </div>
              </div>

              {/* Avg pace */}
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Average Pace (optional)</label>
                <input
                  type="text"
                  value={profile.avgPace}
                  onChange={(e) => set('avgPace', e.target.value)}
                  placeholder="e.g. 9:30 min/mi  or  5:55 min/km"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
                />
              </div>

              {/* Shoe brand */}
              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Go-to Shoe Brand</label>
                <div className="flex flex-wrap gap-2">
                  {['Nike', 'Adidas', 'Brooks', 'ASICS', 'Hoka', 'New Balance', 'Saucony', 'Other'].map((b) => (
                    <Chip
                      key={b}
                      label={b}
                      selected={profile.shoeBrand === b}
                      onClick={() => set('shoeBrand', b)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Goals ── */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-white mb-1">What Are Your Goals?</h2>
                <p className="text-white/50 text-sm">Pick all that apply — we&apos;ll help you get there</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Run my first 5K', emoji: '🎯' },
                  { label: 'Complete a half marathon', emoji: '🏅' },
                  { label: 'Run a full marathon', emoji: '🏆' },
                  { label: 'Improve my pace', emoji: '⚡' },
                  { label: 'Run consistently', emoji: '📅' },
                  { label: 'Lose weight', emoji: '🔥' },
                  { label: 'Build endurance', emoji: '💪' },
                  { label: 'Meet running friends', emoji: '👥' },
                  { label: 'Stay healthy', emoji: '❤️' },
                  { label: 'Run an ultra', emoji: '🦁' },
                  { label: 'PR a race', emoji: '🥇' },
                  { label: 'Just have fun', emoji: '😄' },
                ].map((g) => (
                  <Chip
                    key={g.label}
                    label={g.label}
                    emoji={g.emoji}
                    selected={profile.goals.includes(g.label)}
                    onClick={() => toggleGoal(g.label)}
                  />
                ))}
              </div>
              {profile.goals.length > 0 && (
                <p className="text-brand-pink text-xs text-center font-semibold">
                  {profile.goals.length} goal{profile.goals.length > 1 ? 's' : ''} selected ✓
                </p>
              )}
              {/* Motivational quote */}
              <div className="bg-brand-pink/10 border border-brand-pink/20 rounded-2xl p-4 text-center mt-2">
                <p className="text-white/70 text-xs italic">
                  &ldquo;Every mile is a gift. Lace up and go earn it.&rdquo;
                </p>
                <p className="text-brand-pink text-xs font-semibold mt-1">— Strong Together Run Club</p>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="flex-1 py-3 rounded-full border border-white/20 text-white/60 text-sm font-semibold hover:border-white/40 hover:text-white transition-all"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canNext() || saving}
              className={`flex-1 py-3 rounded-full text-white font-bold text-sm transition-all duration-200 ${
                canNext() && !saving
                  ? 'bg-brand-pink hover:bg-brand-pink/90 shadow-lg shadow-brand-pink/30'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </span>
              ) : step === 4 ? (
                "Let's Run! 🏃"
              ) : (
                'Continue →'
              )}
            </button>
          </div>

          {/* Skip link — shown on ALL steps */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-6 h-1.5 bg-brand-pink'
                  : s < step
                  ? 'w-1.5 h-1.5 bg-brand-pink/50'
                  : 'w-1.5 h-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
