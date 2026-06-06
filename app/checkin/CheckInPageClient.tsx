'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Status = 'idle' | 'scanning' | 'loading' | 'success' | 'error' | 'already'

export default function CheckInPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromUrl = searchParams.get('token')

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const scannerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null)

  // If a token was passed in the URL, verify it immediately
  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl])

  const verifyToken = async (token: string) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/qr/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
      } else if (res.status === 409) {
        setStatus('already')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Check-in failed')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  const startScanner = async () => {
    setStatus('scanning')
    // Dynamically import html5-qrcode to avoid SSR issues
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-reader')
    html5QrRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await scanner.stop()
          html5QrRef.current = null
          // The QR encodes a URL like /checkin?token=...
          try {
            const url = new URL(decodedText)
            const token = url.searchParams.get('token')
            if (token) {
              await verifyToken(token)
            } else {
              setStatus('error')
              setErrorMsg('Invalid QR code format')
            }
          } catch {
            // If it's not a URL, treat the whole string as a token
            await verifyToken(decodedText)
          }
        },
        () => { /* ignore frame errors */ }
      )
    } catch {
      setStatus('error')
      setErrorMsg('Could not access camera. Please allow camera access and try again.')
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop() } catch { /* ignore */ }
      html5QrRef.current = null
    }
    setStatus('idle')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-brand-dark/85 backdrop-blur-xl rounded-3xl border border-brand-wine/40 p-8 shadow-2xl text-center">

          {/* Success */}
          {(status === 'success') && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white">Check-in confirmed! 🎉</h2>
              <p className="text-white/50 text-sm">You&apos;re officially checked in. Have a great run!</p>
              <Link
                href="/dashboard"
                className="mt-2 bg-brand-pink text-white font-bold px-8 py-3 rounded-full hover:bg-brand-pink/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {/* Already checked in */}
          {status === 'already' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-2xl font-black text-white">Already Checked In</h2>
              <p className="text-white/50 text-sm">You&apos;re already checked in for this event.</p>
              <Link href="/dashboard" className="mt-2 bg-brand-pink text-white font-bold px-8 py-3 rounded-full hover:bg-brand-pink/90 transition-colors">
                Go to Dashboard
              </Link>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white">Check-in Failed</h2>
              <p className="text-white/50 text-sm">{errorMsg}</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-2 bg-brand-pink text-white font-bold px-8 py-3 rounded-full hover:bg-brand-pink/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <svg className="w-12 h-12 text-brand-pink animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-white font-semibold">Verifying check-in...</p>
            </div>
          )}

          {/* Scanning */}
          {status === 'scanning' && (
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-xl font-black text-white">Scan QR Code</h2>
              <p className="text-white/50 text-xs">Point your camera at the event QR code</p>
              <div
                id="qr-reader"
                ref={scannerRef}
                className="w-full rounded-2xl overflow-hidden border border-brand-wine/40"
              />
              <button
                onClick={stopScanner}
                className="text-white/40 text-xs hover:text-white/70 transition-colors underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Idle */}
          {status === 'idle' && !tokenFromUrl && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">📷</div>
              <h2 className="text-2xl font-black text-white">Scan to Check In</h2>
              <p className="text-white/50 text-sm">
                Tap the button below to open your camera and scan the event QR code.
              </p>
              <button
                onClick={startScanner}
                className="w-full bg-brand-pink text-white font-bold py-4 rounded-2xl hover:bg-brand-pink/90 transition-colors shadow-lg shadow-brand-pink/30"
              >
                Open Camera
              </button>
              <Link href="/dashboard" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                Back to Dashboard
              </Link>
            </div>
          )}

          {/* Idle with token (waiting for auth redirect) */}
          {status === 'idle' && tokenFromUrl && (
            <div className="flex flex-col items-center gap-4">
              <svg className="w-12 h-12 text-brand-pink animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-white font-semibold">Processing check-in...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
