import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { useWeather } from './hooks/useWeather'
import WeatherCard from './components/WeatherCard'
import type { CitySuggestion } from './types/weather'
import { t } from './i18n'

function App() {
  const {
    data,
    isLoading,
    isError,
    isFetching,
    error,
    needsManualCity,
    locationMode,
    locale,
    setManualCity,
    setManualLocation,
    fetchCitySuggestions,
    requestGeolocation,
  } = useWeather()
  const [cityInput, setCityInput] = useState('')
  const [cityError, setCityError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const q = cityInput.trim()
    if (q.length < 2) {
      const resetTimer = window.setTimeout(() => {
        setSuggestions([])
        setSelectedIndex(-1)
        setIsDropdownOpen(false)
      }, 0)

      return () => {
        window.clearTimeout(resetTimer)
      }

      return
    }

    const timer = window.setTimeout(async () => {
      const items = await fetchCitySuggestions(q)
      setSuggestions(items)
      setSelectedIndex(items.length > 0 ? 0 : -1)
      setIsDropdownOpen(items.length > 0)
    }, 280)

    return () => {
      window.clearTimeout(timer)
    }
  }, [cityInput, fetchCitySuggestions])

  const selectedSuggestion = useMemo(() => {
    if (selectedIndex < 0) return null
    return suggestions[selectedIndex] ?? null
  }, [selectedIndex, suggestions])

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Enter' && selectedSuggestion) {
      event.preventDefault()
      setCityInput(selectedSuggestion.displayName)
      setManualLocation(selectedSuggestion)
      setSuggestions([])
      setIsDropdownOpen(false)
      return
    }

    if (event.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  const chooseSuggestion = (item: CitySuggestion) => {
    setCityInput(item.displayName)
    setManualLocation(item)
    setSuggestions([])
    setIsDropdownOpen(false)
    setCityError(null)
  }

  const handleManualCitySubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = cityInput.trim()
    if (!value) {
      setCityError(t(locale, 'cityRequired'))
      return
    }

    setCityError(null)

    if (selectedSuggestion) {
      setManualLocation(selectedSuggestion)
      setIsDropdownOpen(false)
      return
    }

    setManualCity(value)
  }

  const baseWrapperStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0d1b2a 0%, #1a2a3a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    padding: '20px',
  }

  const showManualCityPanel = needsManualCity || (locationMode === 'none' && !data)

  if (isLoading) {
    return (
      <div style={baseWrapperStyle}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255,255,255,0.15)',
            borderTop: '4px solid #74b9ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>{t(locale, 'loadingWeather')}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        style={{
          ...baseWrapperStyle,
          background: 'linear-gradient(160deg, #1a0a0a 0%, #2a1010 100%)',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2 style={{ color: '#ff7675', margin: 0, fontSize: '20px' }}>{t(locale, 'connectionError')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>
          {error?.message ?? t(locale, 'fetchErrorFallback')}
        </p>
        <button
          onClick={requestGeolocation}
          style={{
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            padding: '10px 14px',
            cursor: 'pointer',
          }}
        >
          {t(locale, 'retryLocation')}
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={baseWrapperStyle}>
        <div
          style={{
            width: 'min(420px, 100%)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '18px',
            backdropFilter: 'blur(10px)',
            padding: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', color: '#f0f6ff' }}>{t(locale, 'locationSelection')}</h2>
          <p style={{ margin: '10px 0 14px', color: 'rgba(255,255,255,0.72)', fontSize: '14px' }}>
            {t(locale, 'locationSelectionHint')}
          </p>

          <form onSubmit={handleManualCitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
            <input
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value)
                if (cityError) setCityError(null)
              }}
              onKeyDown={onInputKeyDown}
              placeholder={t(locale, 'cityPlaceholder')}
              style={{
                border: '1px solid rgba(255,255,255,0.24)',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.16)',
                color: '#fff',
                padding: '10px 12px',
                outline: 'none',
              }}
            />
            {isDropdownOpen && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  background: 'rgba(5, 16, 28, 0.96)',
                  backdropFilter: 'blur(8px)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.displayName}-${idx}`}
                    type="button"
                    onClick={() => chooseSuggestion(item)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      background: selectedIndex === idx ? 'rgba(90, 167, 255, 0.2)' : 'transparent',
                      color: '#eaf4ff',
                      fontSize: '13px',
                    }}
                  >
                    {item.displayName}
                  </button>
                ))}
              </div>
            )}
            {cityError && <span style={{ color: '#ffb4b4', fontSize: '12px' }}>{cityError}</span>}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                style={{
                  border: 'none',
                  borderRadius: '12px',
                  background: '#5aa7ff',
                  color: '#0b1c31',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {t(locale, 'continueWithCity')}
              </button>
              <button
                type="button"
                onClick={requestGeolocation}
                style={{
                  border: '1px solid rgba(255,255,255,0.24)',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                {t(locale, 'retryGeo')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <WeatherCard data={data} locale={locale} />

      {showManualCityPanel && (
        <div
          style={{
            position: 'fixed',
            right: '16px',
            top: '16px',
            zIndex: 50,
            width: 'min(340px, calc(100vw - 32px))',
            background: 'rgba(8, 20, 34, 0.85)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '14px',
            backdropFilter: 'blur(12px)',
            padding: '14px',
            color: '#e7f2ff',
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: '13px', lineHeight: 1.4 }}>
            {t(locale, 'manualHint')}
          </p>
          <form onSubmit={handleManualCitySubmit} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <input
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value)
                if (cityError) setCityError(null)
              }}
              onKeyDown={onInputKeyDown}
              placeholder={t(locale, 'cityPlaceholder')}
              style={{
                flex: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.2)',
                color: '#fff',
                padding: '8px 10px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                border: 'none',
                borderRadius: '10px',
                background: '#7ec0ff',
                color: '#0a1a2d',
                fontWeight: 700,
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              {t(locale, 'go')}
            </button>
            {isDropdownOpen && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: 0,
                  right: 0,
                  zIndex: 70,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  background: 'rgba(3, 13, 24, 0.96)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.displayName}-floating-${idx}`}
                    type="button"
                    onClick={() => chooseSuggestion(item)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 10px',
                      border: 'none',
                      borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      background: selectedIndex === idx ? 'rgba(126, 192, 255, 0.2)' : 'transparent',
                      color: '#e5f0ff',
                      fontSize: '12px',
                    }}
                  >
                    {item.displayName}
                  </button>
                ))}
              </div>
            )}
          </form>
          {cityError && <p style={{ margin: '8px 0 0', color: '#ffc6c6', fontSize: '12px' }}>{cityError}</p>}
          {isFetching && <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{t(locale, 'updating')}</p>}
        </div>
      )}
    </>
  )
}

export default App
