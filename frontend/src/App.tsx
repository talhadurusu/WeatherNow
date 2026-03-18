import { useState } from 'react'
import type { FormEvent } from 'react'
import { useWeather } from './hooks/useWeather'
import WeatherCard from './components/WeatherCard'

function App() {
  const {
    data,
    isLoading,
    isError,
    isFetching,
    error,
    needsManualCity,
    locationMode,
    setManualCity,
    requestGeolocation,
  } = useWeather()
  const [cityInput, setCityInput] = useState('')
  const [cityError, setCityError] = useState<string | null>(null)

  const handleManualCitySubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = cityInput.trim()
    if (!value) {
      setCityError('Lutfen bir sehir adi girin.')
      return
    }

    setCityError(null)
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
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
          Hava durumu yükleniyor…
        </p>
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
        <h2 style={{ color: '#ff7675', margin: 0, fontSize: '20px' }}>Bağlantı Hatası</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>
          {error?.message ?? 'Hava durumu verisi alınamadı. Lütfen tekrar deneyin.'}
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
          Konumu Tekrar Dene
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
          <h2 style={{ margin: 0, fontSize: '20px', color: '#f0f6ff' }}>Konum Secimi</h2>
          <p style={{ margin: '10px 0 14px', color: 'rgba(255,255,255,0.72)', fontSize: '14px' }}>
            Konum izni vermezsen, sehir yazarak devam edebilirsin. Konum bilgisi kaydedilmez.
          </p>

          <form onSubmit={handleManualCitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value)
                if (cityError) setCityError(null)
              }}
              placeholder="Ornek: Istanbul"
              style={{
                border: '1px solid rgba(255,255,255,0.24)',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.16)',
                color: '#fff',
                padding: '10px 12px',
                outline: 'none',
              }}
            />
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
                Sehirle Devam Et
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
                Konumu Tekrar Dene
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <WeatherCard data={data} />

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
            Konum paylasmadan da kullanabilirsin. Lutfen sehir gir.
          </p>
          <form onSubmit={handleManualCitySubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value)
                if (cityError) setCityError(null)
              }}
              placeholder="Sehir"
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
              Git
            </button>
          </form>
          {cityError && <p style={{ margin: '8px 0 0', color: '#ffc6c6', fontSize: '12px' }}>{cityError}</p>}
          {isFetching && <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Guncelleniyor...</p>}
        </div>
      )}
    </>
  )
}

export default App
