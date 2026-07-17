import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useI18n, LanguageSwitcher } from '../i18n'
import { Lock } from 'lucide-react'

export function LoginScreen() {
  const { login } = useAuth()
  const { t } = useI18n()
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(false)
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pw || busy) return
    setBusy(true)
    setErr(false)
    const ok = await login(pw, remember)
    setBusy(false)
    if (!ok) {
      setErr(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f14] text-gray-200 flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-gray-900/70 border border-gray-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">{t.login.title}</h1>
          <p className="text-sm text-gray-400 text-center">{t.login.subtitle}</p>
        </div>

        <label htmlFor="admin-password" className="block text-sm text-gray-400 mb-1">{t.login.password}</label>
        <input
          id="admin-password"
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder={t.login.placeholder}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {err && <p className="text-red-400 text-sm mt-2">{t.login.error}</p>}

        <label className="flex items-center gap-2 mt-3 text-sm text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-emerald-500 w-4 h-4"
          />
          {t.login.remember}
        </label>

        <button
          type="submit"
          disabled={busy || !pw}
          className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium disabled:opacity-50 hover:opacity-90 transition"
        >
          {busy ? t.login.signingIn : t.login.submit}
        </button>
      </form>
    </div>
  )
}
