'use client'

import { useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  eventId: string
  eventTitle: string
}

export default function QRGenerator({ eventId, eventTitle }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const generateQR = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate QR')
        setLoading(false)
        return
      }
      // Generate QR image client-side from the URL
      const dataUrl = await QRCode.toDataURL(data.qrUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      setQrDataUrl(dataUrl)
      setShowModal(true)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={generateQR}
        disabled={loading}
        className="flex items-center gap-1.5 bg-brand-pink/10 border border-brand-pink/30 text-brand-pink text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-pink/20 transition-colors disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        {loading ? 'Generating...' : 'Generate Check-in QR'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {/* Full-screen QR modal */}
      {showModal && qrDataUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-black font-black text-lg text-center">{eventTitle}</h2>
            <p className="text-gray-500 text-xs text-center">Valid 5:00 AM – 10:00 AM on event day</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Check-in QR Code" className="w-full max-w-[300px]" />
            <p className="text-gray-400 text-xs text-center">Show this QR code at the event for participants to scan</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-black text-white font-bold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
