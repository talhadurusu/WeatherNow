import { useWeather } from './hooks/useWeather'
import WeatherCard from './components/WeatherCard'

function App() {
  const { data, isLoading, isError, error } = useWeather()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #0d1b2a 0%, #1a2a3a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}
      >
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
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #1a0a0a 0%, #2a1010 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2 style={{ color: '#ff7675', margin: 0, fontSize: '20px' }}>Bağlantı Hatası</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '14px' }}>
          {error?.message ?? 'Hava durumu verisi alınamadı. Lütfen tekrar deneyin.'}
        </p>
      </div>
    )
  }

  if (!data) return null

  return <WeatherCard data={data} />
}

export default App
