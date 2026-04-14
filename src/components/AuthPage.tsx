import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup' | 'reset'

interface AuthPageProps {
  allowSignup?: boolean
  title?: string
  subtitle?: string
}

export default function AuthPage({ allowSignup = false, title = 'Subscriptions', subtitle = 'bettyside.com' }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const reset = () => { setError(''); setSuccess('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        else setSuccess('Account created! Check your email to confirm.')
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        })
        if (error) setError(error.message)
        else setSuccess('Check your email for a password reset link.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0f1117' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-white font-semibold text-lg mb-5">
            {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
              style={{ background: '#4f46e5' }}
            >
              {loading ? '...' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-center">
            {mode === 'login' && (
              <>
                {allowSignup && (
                  <button
                    onClick={() => { setMode('signup'); reset() }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                )}
                <button
                  onClick={() => { setMode('reset'); reset() }}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Forgot password?
                </button>
              </>
            )}
            {mode === 'signup' && (
              <button
                onClick={() => { setMode('login'); reset() }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => { setMode('login'); reset() }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
