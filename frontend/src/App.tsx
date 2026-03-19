import { useEffect, useId, useMemo, useState } from 'react'
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
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [hasSuggestionAttempt, setHasSuggestionAttempt] = useState(false)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<CitySuggestion | null>(null)
  const listboxId = useId()

  useEffect(() => {
    const q = cityInput.trim()
    const hasSelectedLabel = selectedLocation && q === selectedLocation.displayName

    if (hasSelectedLabel) {
      setSuggestions([])
      setSelectedIndex(-1)
      setIsDropdownOpen(false)
      setSuggestionError(null)
      setIsFetchingSuggestions(false)
      setHasSuggestionAttempt(false)
      return
    }

    if (q.length < 2) {
      const resetTimer = window.setTimeout(() => {
        setSuggestions([])
        setSelectedIndex(-1)
        setIsDropdownOpen(false)
        setSuggestionError(null)
        setIsFetchingSuggestions(false)
        setHasSuggestionAttempt(false)
      }, 0)

      return () => {
        window.clearTimeout(resetTimer)
      }
    }

    const timer = window.setTimeout(async () => {
      setIsFetchingSuggestions(true)
      setHasSuggestionAttempt(true)

      try {
        const items = await fetchCitySuggestions(q)
        setSuggestions(items)
        setSelectedIndex(items.length > 0 ? 0 : -1)
        setIsDropdownOpen(items.length > 0)
        setSuggestionError(null)
      } catch (err) {
        if (err instanceof Error && err.message === 'CITY_SEARCH_RATE_LIMIT') {
          setSuggestionError(t(locale, 'citySearchRateLimited'))
        } else if (err instanceof Error && err.message === 'CITY_SEARCH_INVALID') {
          setSuggestionError(t(locale, 'citySearchFailed'))
        } else {
          setSuggestionError(t(locale, 'citySearchFailed'))
        }
        setSuggestions([])
        setSelectedIndex(-1)
        setIsDropdownOpen(false)
      } finally {
        setIsFetchingSuggestions(false)
      }
    }, 280)

    return () => {
      window.clearTimeout(timer)
    }
  }, [cityInput, fetchCitySuggestions, locale, selectedLocation])

  const selectedSuggestion = useMemo(() => {
    if (selectedIndex < 0) return null
    return suggestions[selectedIndex] ?? null
  }, [selectedIndex, suggestions])

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
      return
    }

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

    if (event.key === 'Home') {
      event.preventDefault()
      setSelectedIndex(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setSelectedIndex(suggestions.length - 1)
      return
    }

    if (event.key === 'Enter' && selectedSuggestion) {
      event.preventDefault()
      chooseSuggestion(selectedSuggestion)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setIsDropdownOpen(false)
    }
  }

  const chooseSuggestion = (item: CitySuggestion) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10)
    }

    setCityInput(item.displayName)
    setSelectedLocation(item)
    setSuggestions([])
    setSelectedIndex(-1)
    setIsDropdownOpen(false)
    setSuggestionError(null)
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

    if (selectedLocation && value === selectedLocation.displayName) {
      setManualLocation(selectedLocation)
      setIsDropdownOpen(false)
      return
    }

    const normalizedCity = value.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
    if (!normalizedCity) {
      setCityError(t(locale, 'cityRequired'))
      setIsDropdownOpen(false)
      return
    }

    setSelectedLocation(null)
    setManualCity(normalizedCity)
    setSuggestions([])
    setSelectedIndex(-1)
    setIsDropdownOpen(false)
  }

  const showNoResults = hasSuggestionAttempt && !isFetchingSuggestions && !suggestionError && suggestions.length === 0 && cityInput.trim().length >= 2
  const showSuggestionDropdown = cityInput.trim().length >= 2 && (isFetchingSuggestions || Boolean(suggestionError) || suggestions.length > 0 || showNoResults)

  const renderSuggestionDropdown = (variant: 'main' | 'floating') => {
    if (!showSuggestionDropdown) return null

    const isMain = variant === 'main'

    return (
      <div
        id={listboxId}
        role="listbox"
        style={{
          position: 'absolute',
          top: isMain ? '44px' : '42px',
          left: 0,
          right: 0,
          zIndex: isMain ? 20 : 70,
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: isMain ? '12px' : '10px',
          background: isMain ? 'rgba(5, 16, 28, 0.96)' : 'rgba(3, 13, 24, 0.96)',
          backdropFilter: isMain ? 'blur(8px)' : undefined,
          maxHeight: '220px',
          overflowY: 'auto',
        }}
      >
        {isFetchingSuggestions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 12px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTop: '2px solid #74b9ff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            {t(locale, 'searchingCities')}
          </div>
        )}

        {!isFetchingSuggestions && suggestionError && (
          <p style={{ margin: 0, padding: '12px', color: '#ffc6c6', fontSize: '12px' }}>{suggestionError}</p>
        )}

        {!isFetchingSuggestions && !suggestionError && showNoResults && (
          <p style={{ margin: 0, padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{t(locale, 'noCitiesFound')}</p>
        )}

        {!isFetchingSuggestions && !suggestionError && suggestions.map((item, idx) => (
          <button
            key={`${item.displayName}-${variant}-${idx}`}
            type="button"
            id={`${listboxId}-option-${idx}`}
            role="option"
            aria-selected={selectedIndex === idx}
            onClick={() => chooseSuggestion(item)}
            style={{
              width: '100%',
              minHeight: '44px',
              textAlign: 'left',
              padding: isMain ? '10px 12px' : '9px 10px',
              border: 'none',
              borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              background: selectedIndex === idx
                ? (isMain ? 'rgba(90, 167, 255, 0.2)' : 'rgba(126, 192, 255, 0.2)')
                : 'transparent',
              color: isMain ? '#eaf4ff' : '#e5f0ff',
              fontSize: isMain ? '13px' : '12px',
              transition: 'background 0.15s ease',
            }}
          >
            {item.displayName}
          </button>
        ))}
      </div>
    )
  }

  const renderSelectedLocationChip = () => {
    if (!selectedLocation) return null

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(90, 167, 255, 0.18)',
          border: '1px solid rgba(90, 167, 255, 0.35)',
          borderRadius: '999px',
          padding: '6px 12px',
          color: '#dff0ff',
          fontSize: '12px',
          maxWidth: '100%',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {selectedLocation.displayName}</span>
        <button
          type="button"
          onClick={() => {
            setSelectedLocation(null)
            setCityInput('')
            setSuggestions([])
            setSelectedIndex(-1)
            setIsDropdownOpen(false)
            setSuggestionError(null)
            setHasSuggestionAttempt(false)
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#dff0ff',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
            padding: '0 2px',
          }}
          aria-label="Clear selected location"
        >
          ×
        </button>
      </div>
    )
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
                const nextValue = e.target.value
                setCityInput(nextValue)
                if (cityError) setCityError(null)
                if (suggestionError) setSuggestionError(null)
                if (selectedLocation && nextValue !== selectedLocation.displayName) {
                  setSelectedLocation(null)
                }
              }}
              onKeyDown={onInputKeyDown}
              placeholder={t(locale, 'cityPlaceholder')}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestionDropdown}
              aria-haspopup="listbox"
              aria-controls={listboxId}
              aria-activedescendant={selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined}
              style={{
                border: '1px solid rgba(255,255,255,0.24)',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.16)',
                color: '#fff',
                padding: '10px 12px',
                outline: 'none',
              }}
            />
            {renderSuggestionDropdown('main')}
            {renderSelectedLocationChip()}
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
                const nextValue = e.target.value
                setCityInput(nextValue)
                if (cityError) setCityError(null)
                if (suggestionError) setSuggestionError(null)
                if (selectedLocation && nextValue !== selectedLocation.displayName) {
                  setSelectedLocation(null)
                }
              }}
              onKeyDown={onInputKeyDown}
              placeholder={t(locale, 'cityPlaceholder')}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestionDropdown}
              aria-haspopup="listbox"
              aria-controls={listboxId}
              aria-activedescendant={selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined}
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
            {renderSuggestionDropdown('floating')}
          </form>
          {selectedLocation && <div style={{ marginTop: '8px' }}>{renderSelectedLocationChip()}</div>}
          {cityError && <p style={{ margin: '8px 0 0', color: '#ffc6c6', fontSize: '12px' }}>{cityError}</p>}
          {isFetching && <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{t(locale, 'updating')}</p>}
        </div>
      )}
    </>
  )
}

export default App
