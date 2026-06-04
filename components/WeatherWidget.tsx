'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { getWeatherDescription, getWeatherEmoji } from '@/lib/utils'

interface WeatherData {
  current: {
    temperature_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
    relative_humidity_2m: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

// Myrtle Beach, SC coordinates
const LAT = 33.6891
const LON = -78.8867

export default function WeatherWidget() {
  const { t, language } = useLanguage()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&timezone=America%2FNew_York&forecast_days=3`

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setWeather(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-card rounded-2xl p-5 border border-brand-wine/40 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-32 mb-4" />
        <div className="h-10 bg-white/10 rounded w-24 mb-2" />
        <div className="h-3 bg-white/10 rounded w-40" />
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-card rounded-2xl p-5 border border-brand-wine/40 text-white/40 text-sm">
        {t.weather.error}
      </div>
    )
  }

  const { current, daily } = weather

  const dayLabels = daily.time.map((d) => {
    const date = new Date(d + 'T12:00:00')
    return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'short' })
  })

  return (
    <div className="bg-gradient-card rounded-2xl p-5 border border-brand-wine/40">
      <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">
        {t.weather.forecast}
      </h3>

      {/* Current conditions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">
              {Math.round(current.temperature_2m)}°F
            </span>
            <span className="text-3xl mb-1">{getWeatherEmoji(current.weather_code)}</span>
          </div>
          <p className="text-white/60 text-sm mt-1">
            {getWeatherDescription(current.weather_code, language)}
          </p>
        </div>
        <div className="text-right text-white/50 text-xs flex flex-col gap-1">
          <span>{t.weather.feelsLike} {Math.round(current.apparent_temperature)}°F</span>
          <span>{t.weather.humidity} {current.relative_humidity_2m}%</span>
          <span>{t.weather.wind} {Math.round(current.wind_speed_10m)} mph</span>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
        {daily.time.map((_, i) => (
          <div key={i} className="text-center">
            <p className="text-white/40 text-xs uppercase">{dayLabels[i]}</p>
            <p className="text-xl my-1">{getWeatherEmoji(daily.weather_code[i])}</p>
            <p className="text-white text-xs font-semibold">
              {Math.round(daily.temperature_2m_max[i])}°
            </p>
            <p className="text-white/40 text-xs">
              {Math.round(daily.temperature_2m_min[i])}°
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
