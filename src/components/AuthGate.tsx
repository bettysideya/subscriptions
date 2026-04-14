import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import AuthPage from './AuthPage'

const PROJECT_SLUG = 'subs'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setHasAccess(false); return }
    const checkAccess = async () => {
      const { data: project } = await supabase
        .from('app_projects')
        .select('id, visibility')
        .eq('slug', PROJECT_SLUG)
        .single()
      if (!project) { setHasAccess(false); return }
      if (project.visibility === 'public') { setHasAccess(true); return }
      if (project.visibility === 'register') { setHasAccess(true); return }
      const { data: access } = await supabase
        .from('user_access')
        .select('access_level')
        .eq('user_id', session.user.id)
        .eq('project_id', project.id)
        .single()
      setHasAccess(!!access && access.access_level !== 'none')
    }
    checkAccess()
  }, [session])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1117' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    )
  }

  if (!session) return <AuthPage />

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0f1117' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">No Access</h2>
          <p className="text-gray-400 mb-4">You don't have access to this application.</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 rounded-lg text-white hover:opacity-80 transition-opacity"
            style={{ background: '#4f46e5' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
