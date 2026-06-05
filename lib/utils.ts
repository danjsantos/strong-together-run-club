import type { Language } from './translations'

export function formatDate(dateStr: string, language: Language): string {
  const date = new Date(dateStr)
  const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US'
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(dateStr: string, language: Language): string {
  const date = new Date(dateStr)
  const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US'
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(dateStr: string, language: Language): string {
  const date = new Date(dateStr)
  const locale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US'
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

export function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date()
}

export function getWeatherDescription(code: number, language: Language): string {
  const descriptions: Record<number, { en: string; pt: string; es: string }> = {
    0: { en: 'Clear sky', pt: 'Céu limpo', es: 'Cielo despejado' },
    1: { en: 'Mainly clear', pt: 'Principalmente limpo', es: 'Principalmente despejado' },
    2: { en: 'Partly cloudy', pt: 'Parcialmente nublado', es: 'Parcialmente nublado' },
    3: { en: 'Overcast', pt: 'Nublado', es: 'Nublado' },
    45: { en: 'Foggy', pt: 'Neblina', es: 'Neblina' },
    48: { en: 'Icy fog', pt: 'Neblina gelada', es: 'Niebla helada' },
    51: { en: 'Light drizzle', pt: 'Garoa leve', es: 'Llovizna ligera' },
    53: { en: 'Drizzle', pt: 'Garoa', es: 'Llovizna' },
    55: { en: 'Heavy drizzle', pt: 'Garoa intensa', es: 'Llovizna intensa' },
    61: { en: 'Light rain', pt: 'Chuva leve', es: 'Lluvia ligera' },
    63: { en: 'Rain', pt: 'Chuva', es: 'Lluvia' },
    65: { en: 'Heavy rain', pt: 'Chuva intensa', es: 'Lluvia intensa' },
    71: { en: 'Light snow', pt: 'Neve leve', es: 'Nieve ligera' },
    73: { en: 'Snow', pt: 'Neve', es: 'Nieve' },
    75: { en: 'Heavy snow', pt: 'Neve intensa', es: 'Nieve intensa' },
    80: { en: 'Rain showers', pt: 'Pancadas de chuva', es: 'Chubascos' },
    81: { en: 'Rain showers', pt: 'Pancadas de chuva', es: 'Chubascos' },
    82: { en: 'Heavy showers', pt: 'Pancadas intensas', es: 'Chubascos intensos' },
    95: { en: 'Thunderstorm', pt: 'Tempestade', es: 'Tormenta' },
    96: { en: 'Thunderstorm', pt: 'Tempestade com granizo', es: 'Tormenta con granizo' },
    99: { en: 'Thunderstorm', pt: 'Tempestade severa', es: 'Tormenta severa' },
  }
  const entry = descriptions[code]
  if (!entry) return language === 'pt' ? 'Desconhecido' : language === 'es' ? 'Desconocido' : 'Unknown'
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
