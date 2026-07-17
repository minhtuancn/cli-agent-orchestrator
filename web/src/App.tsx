import { lazy, useEffect, useState, Suspense } from 'react'
import { api } from './api'
import { useStore } from './store'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DashboardHome } from './components/DashboardHome'
const AgentPanel = lazy(() => import('./components/AgentPanel').then((m) => ({ default: m.AgentPanel })))
const FlowsPanel = lazy(() => import('./components/FlowsPanel').then((m) => ({ default: m.FlowsPanel })))
const MemoryPanel = lazy(() => import('./components/MemoryPanel').then((m) => ({ default: m.MemoryPanel })))
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then((m) => ({ default: m.SettingsPanel })))
const GuidePanel = lazy(() => import('./components/GuidePanel').then((m) => ({ default: m.GuidePanel })))
import { LoginScreen } from './components/LoginScreen'
import { useAuth } from './auth/AuthContext'
import { useI18n, LanguageSwitcher } from './i18n'
import { Bot, Home, Clock, Settings, Brain, CheckCircle, XCircle, Info, Wifi, WifiOff, LogOut } from 'lucide-react'
import { LanguageProvider } from './i18n'
import { AuthProvider } from './auth/AuthContext'

type TabKey = 'home' | 'agents' | 'flows' | 'settings' | 'memory' | 'guide'

function Snackbar() {
  const { snackbar, hideSnackbar } = useStore()

  useEffect(() => {
    if (snackbar) {
      const timer = setTimeout(hideSnackbar, 3000)
      return () => clearTimeout(timer)
    }
  }, [snackbar, hideSnackbar])

  if (!snackbar) return null

  const colors = {
    success: 'bg-emerald-600 border-emerald-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500',
  }
  const icons = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  }

  return (
    <div role="alert" className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg flex items-center gap-2 text-white ${colors[snackbar.type]}`}>
      {icons[snackbar.type]}
      <span className="text-sm">{snackbar.message}</span>
    </div>
  )
}

function AppShell() {
  const [tab, setTab] = useState<TabKey>('home')
  // Default false (fail-closed): a dead backend hides the tab rather than showing a broken panel
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const { sessions, connected, fetchSessions } = useStore()
  const { authenticated, loading, logout } = useAuth()
  const { t } = useI18n()

  // Memory appended last so Alt+N numbering of existing tabs never shifts
  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: t.nav.home, icon: <Home size={16} /> },
    { key: 'agents', label: t.nav.agents, icon: <Bot size={16} /> },
    { key: 'flows', label: t.nav.flows, icon: <Clock size={16} /> },
    { key: 'settings', label: t.nav.settings, icon: <Settings size={16} /> },
    { key: 'memory', label: t.nav.memory, icon: <Brain size={16} /> },
    { key: 'guide', label: t.nav.guide, icon: <Info size={16} /> },
  ]

  const visibleTabs = TABS.filter((tt) => tt.key !== 'memory' || memoryEnabled)

  useEffect(() => {
    fetchSessions()
    api
      .getMemoryStatus()
      .then((s) => setMemoryEnabled(s.enabled))
      .catch(() => {})
    const interval = setInterval(fetchSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcuts: Alt+1-N over the visible tabs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= String(visibleTabs.length)) {
        e.preventDefault()
        setTab(visibleTabs[parseInt(e.key) - 1].key)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [memoryEnabled])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f14] text-gray-400 flex items-center justify-center text-sm">
        {t.common.loading}
      </div>
    )
  }

  if (!authenticated) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-[#0f0f14] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-white truncate">{t.appTitle}</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="hidden sm:inline text-xs text-gray-500">
              {sessions.length} {t.header.sessions}
              {sessions.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1.5" title={connected ? t.header.live : t.header.offline}>
              {connected ? (
                <Wifi size={14} className="text-emerald-400" />
              ) : (
                <WifiOff size={14} className="text-red-400" />
              )}
              <span className={`hidden sm:inline text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {connected ? t.header.live : t.header.offline}
              </span>
            </div>
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => logout()}
              title={t.logout}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 py-2 overflow-x-auto" role="tablist">
            {visibleTabs.map((tt, i) => (
              <button
                key={tt.key}
                role="tab"
                aria-selected={tab === tt.key}
                onClick={() => setTab(tt.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shrink-0 whitespace-nowrap ${
                  tab === tt.key
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
                title={`Alt+${i + 1}`}
              >
                {tt.icon}
                {tt.label}
                {tt.key === 'agents' && sessions.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${tab === tt.key ? 'bg-white/20' : 'bg-gray-700'}`}>
                    {sessions.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ErrorBoundary>
          <Suspense fallback={<div className="text-gray-500 text-sm py-12 text-center">{t.common.loading}</div>}>
            {tab === 'home' && <DashboardHome onNavigate={(tt) => setTab(tt as TabKey)} />}
            {tab === 'agents' && <AgentPanel />}
            {tab === 'flows' && <FlowsPanel />}
            {tab === 'settings' && <SettingsPanel />}
            {tab === 'memory' && <MemoryPanel />}
            {tab === 'guide' && <GuidePanel />}
          </Suspense>
        </ErrorBoundary>
      </main>

      <Snackbar />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </LanguageProvider>
  )
}
