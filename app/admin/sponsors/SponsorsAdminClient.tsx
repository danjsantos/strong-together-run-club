'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Sponsor } from './page'

export default function SponsorsAdminClient({ initialSponsors }: { initialSponsors: Sponsor[] }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function addSponsor() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
          link_url: linkUrl.trim() || null,
          sort_order: Number(sortOrder) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add sponsor')
      setSponsors((prev) =>
        [...prev, data.sponsor].sort((a, b) => a.sort_order - b.sort_order),
      )
      setName('')
      setLogoUrl('')
      setLinkUrl('')
      setSortOrder('0')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add sponsor')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s: Sponsor) {
    const res = await fetch('/api/admin/sponsors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    })
    if (res.ok) {
      const data = await res.json()
      setSponsors((prev) => prev.map((x) => (x.id === s.id ? data.sponsor : x)))
    }
  }

  async function removeSponsor(s: Sponsor) {
    if (!confirm(`Remove "${s.name}"?`)) return
    const res = await fetch('/api/admin/sponsors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    })
    if (res.ok) setSponsors((prev) => prev.filter((x) => x.id !== s.id))
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">Sponsors</h1>
          <Link href="/admin" className="text-brand-pink text-sm font-semibold hover:underline">
            ← Back to admin
          </Link>
        </div>

        {/* Add form */}
        <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-5 flex flex-col gap-3">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Add sponsor</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sponsor name"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm"
          />
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Logo image URL (optional)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm"
          />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Website link (optional)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm"
          />
          <div className="flex items-center gap-3">
            <label className="text-white/50 text-xs">Order</label>
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              inputMode="numeric"
              className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={addSponsor}
            disabled={saving}
            className="bg-brand-pink text-white font-bold text-sm py-3 rounded-xl hover:bg-brand-pink/90 transition disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add sponsor'}
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {sponsors.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No sponsors yet.</p>
          ) : (
            sponsors.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                  {s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo_url} alt={s.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-white/40 text-xs">{s.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{s.name}</p>
                  {s.link_url && (
                    <p className="text-white/40 text-xs truncate">{s.link_url}</p>
                  )}
                  <p className={`text-xs font-semibold ${s.active ? 'text-green-400' : 'text-white/30'}`}>
                    {s.active ? 'Active' : 'Hidden'}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  className="text-xs font-semibold text-white/70 border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/10 transition"
                >
                  {s.active ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => removeSponsor(s)}
                  className="text-red-400/80 hover:text-red-400 transition"
                  aria-label={`Remove ${s.name}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
