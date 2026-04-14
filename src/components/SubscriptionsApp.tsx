import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RotateCcw, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Subscription {
  id: string
  name: string
  amount: string
  renewalMonth: string
  renewalDay: string
  frequency: 'monthly' | 'annual'
  assignee: 'ACM' | 'AMPA' | 'Betty'
}

interface AppState {
  subscriptions: Subscription[]
}

const STORAGE_KEY = 'subscriptions-app-state'

function newId() {
  return crypto.randomUUID()
}

function defaultState(): AppState {
  return { subscriptions: [] }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return defaultState()
}

const num = (v: string) => {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

const fmt = (n: number) => n.toFixed(2)

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export default function SubscriptionsApp() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateSub = useCallback((id: string, field: keyof Subscription, value: string) => {
    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }))
  }, [])

  const addSub = useCallback(() => {
    setState(prev => ({
      ...prev,
      subscriptions: [
        ...prev.subscriptions,
        {
          id: newId(),
          name: '',
          amount: '',
          renewalMonth: '1',
          renewalDay: '1',
          frequency: 'monthly',
          assignee: 'ACM',
        },
      ],
    }))
  }, [])

  const removeSub = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(s => s.id !== id),
    }))
  }, [])

  const handleReset = () => {
    if (confirm('Clear all subscriptions?')) {
      setState(defaultState())
    }
  }

  // Summaries per assignee
  const assignees = ['ACM', 'AMPA', 'Betty'] as const
  const summaries = assignees.map(a => {
    const subs = state.subscriptions.filter(s => s.assignee === a)
    const monthlyTotal = subs.reduce((sum, s) => {
      const amt = num(s.amount)
      return sum + (s.frequency === 'monthly' ? amt : amt / 12)
    }, 0)
    const annualTotal = subs.reduce((sum, s) => {
      const amt = num(s.amount)
      return sum + (s.frequency === 'annual' ? amt : amt * 12)
    }, 0)
    return { assignee: a, count: subs.length, monthlyTotal, annualTotal }
  })

  const totalMonthly = summaries.reduce((s, a) => s + a.monthlyTotal, 0)
  const totalAnnual = summaries.reduce((s, a) => s + a.annualTotal, 0)

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#0f1117' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-red-500/10 transition-all text-sm"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-300 hover:text-white transition-all text-sm"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaries.map(s => (
            <div
              key={s.assignee}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h3 className="text-sm font-semibold text-indigo-400 mb-2">{s.assignee}</h3>
              <p className="text-xs text-gray-500">{s.count} subscription{s.count !== 1 ? 's' : ''}</p>
              <p className="text-white font-mono text-sm mt-1">${fmt(s.monthlyTotal)}<span className="text-gray-500">/mo</span></p>
              <p className="text-gray-400 font-mono text-xs">${fmt(s.annualTotal)}<span className="text-gray-600">/yr</span></p>
            </div>
          ))}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-sm font-semibold text-white mb-2">Total</h3>
            <p className="text-xs text-gray-500">{state.subscriptions.length} subscription{state.subscriptions.length !== 1 ? 's' : ''}</p>
            <p className="text-white font-mono text-sm mt-1">${fmt(totalMonthly)}<span className="text-gray-500">/mo</span></p>
            <p className="text-gray-400 font-mono text-xs">${fmt(totalAnnual)}<span className="text-gray-600">/yr</span></p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-400 uppercase text-xs tracking-wider" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <th className="py-3 px-3 text-left">Name</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                  <th className="py-3 px-2 text-center">Frequency</th>
                  <th className="py-3 px-2 text-center">Renewal</th>
                  <th className="py-3 px-2 text-center">Assignee</th>
                  <th className="py-3 px-2 text-right">Monthly</th>
                  <th className="py-3 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {state.subscriptions.map(sub => {
                  const amt = num(sub.amount)
                  const monthly = sub.frequency === 'monthly' ? amt : amt / 12
                  return (
                    <tr
                      key={sub.id}
                      className="border-b hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={e => updateSub(sub.id, 'name', e.target.value)}
                          placeholder="Subscription name"
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          value={sub.amount}
                          onChange={e => updateSub(sub.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="w-24 px-2 py-1.5 text-sm rounded-lg border border-white/10 text-white text-right placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={sub.frequency}
                          onChange={e => updateSub(sub.id, 'frequency', e.target.value)}
                          className="px-2 py-1.5 text-sm rounded-lg border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none text-center"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <select
                            value={sub.renewalMonth}
                            onChange={e => updateSub(sub.id, 'renewalMonth', e.target.value)}
                            className="px-1.5 py-1.5 text-sm rounded-lg border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none text-center"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                          >
                            {MONTHS.map((m, i) => (
                              <option key={i} value={String(i + 1)}>{m}</option>
                            ))}
                          </select>
                          <span className="text-gray-500">/</span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={sub.renewalDay}
                            onChange={e => updateSub(sub.id, 'renewalDay', e.target.value)}
                            className="w-12 px-1.5 py-1.5 text-sm rounded-lg border border-white/10 text-white text-center placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={sub.assignee}
                          onChange={e => updateSub(sub.id, 'assignee', e.target.value)}
                          className="px-2 py-1.5 text-sm rounded-lg border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none text-center"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <option value="ACM">ACM</option>
                          <option value="AMPA">AMPA</option>
                          <option value="Betty">Betty</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-gray-300">
                        ${fmt(monthly)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeSub(sub.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <td className="py-3 px-3 text-gray-300">
                    <button
                      onClick={addSub}
                      className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
                    >
                      <Plus size={14} />
                      Add Subscription
                    </button>
                  </td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2"></td>
                  <td className="py-3 px-2 text-right text-gray-400 text-xs">Total</td>
                  <td className="py-3 px-2 text-right font-mono text-white">${fmt(totalMonthly)}</td>
                  <td className="py-3 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
