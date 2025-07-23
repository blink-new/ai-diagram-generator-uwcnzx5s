import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { DiagramGenerator } from './components/DiagramGenerator'
import { Header } from './components/Header'
import { AuthGuard } from './components/AuthGuard'
import { Toaster } from './components/ui/toaster'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      console.log('App: Auth state changed:', state)
      setUser(state.user)
      setLoading(state.isLoading)
      
      // If there's an error, try to handle it
      if (state.error) {
        console.error('Auth error:', state.error)
        setError(state.error)
      }
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">Error: {error.message || error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <AuthGuard user={user}>
        <Header user={user} />
        <main className="container mx-auto px-4 py-8">
          <DiagramGenerator />
        </main>
      </AuthGuard>
      <Toaster />
    </div>
  )
}

export default App