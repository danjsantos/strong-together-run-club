import type { Language } from './translations'

export function formatDate(dateStr: string, language: Language): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(dateStr: string, language: Language): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(dateStr: string, language: Language): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date()
}

export function getWeatherDescription(code: number, language: Language): string {
  const descriptions: Record<number, { en: string; pt: string }> = {
    0: { en: 'Clear sky', pt: 'Céu limpo' },
    1: { en: 'Mainly clear', pt: 'Principalmente limpo' },
    2: { en: 'Partly cloudy', pt: 'Parcialmente nublado' },
    3: { en: 'Overcast', pt: 'Nublado' },
    45: { en: 'Foggy', pt: 'Neblina' },
    48: { en: 'Icy fog', pt: 'Neblina gelada' },
    51: { en: 'Light drizzle', pt: 'Garoa leve' },
    53: { en: 'Drizzle', pt: 'Garoa' },
    55: { en: 'Heavy drizzle', pt: 'Garoa intensa' },
    61: { en: 'Light rain', pt: 'Chuva leve' },
    63: { en: 'Rain', pt: 'Chuva' },
    65: { en: 'Heavy rain', pt: 'Chuva intensa' },
    71: { en: 'Light snow', pt: 'Neve leve' },
    73: { en: 'Snow', pt: 'Neve' },
    75: { en: 'Heavy snow', pt: 'Neve intensa' },
    80: { en: 'Rain showers', pt: 'Pancadas de chuva' },
    81: { en: 'Rain showers', pt: 'Pancadas de chuva' },
    82: { en: 'Heavy showers', pt: 'Pancadas intensas' },
    95: { en: 'Thunderstorm', pt: 'Tempestade' },
    96: { en: 'Thunderstorm', pt: 'Tempestade com granizo' },
    99: { en: 'Thunderstorm', pt: 'Tempestade severa' },
  }
  const entry = descriptions[code]
  if (!entry) return language === 'pt' ? 'Desconhecido' : 'Unknown'
  return entry[language]
}

export function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
