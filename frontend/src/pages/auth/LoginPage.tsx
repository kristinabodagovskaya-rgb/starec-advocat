import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        navigate('/')
      } else {
        setError('Неверный email или пароль')
      }
    } catch (err) {
      setError('Ошибка подключения к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = () => {
    localStorage.setItem('token', 'dev-token')
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full apple-animate-scaleIn">
        <div className="apple-glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
              STAREC ADVOCAT
            </h1>
            <p className="text-[#6e6e73]">
              Система анализа уголовных дел
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="apple-input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="apple-input"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="rounded border-[#d2d2d7] text-[#1d1d1f] focus:ring-[#1d1d1f]" />
                <span className="ml-2 text-[#6e6e73]">Запомнить меня</span>
              </label>
              <a href="#" className="text-[#1d1d1f] hover:text-[#1d1d1f] transition-colors">
                Забыли пароль?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full apple-btn-secondary disabled:bg-[#86868b] disabled:cursor-not-allowed"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Development Bypass */}
          <div className="mt-4">
            <button
              onClick={handleDevLogin}
              className="w-full apple-btn-primary"
            >
              Войти без авторизации (DEV)
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#d2d2d7]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/80 text-[#86868b]">Или войти через</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center px-4 py-3 border border-[#d2d2d7] rounded-xl hover:bg-black/5 transition-colors">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-[#1d1d1f]">Google</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-[#d2d2d7] rounded-xl hover:bg-black/5 transition-colors">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#FC3F1D" d="M13 12l8-8-5 13-3-5z"/>
                <path fill="#FF0000" d="M13 12l-8 8 13-5-5-3z"/>
              </svg>
              <span className="text-sm font-medium text-[#1d1d1f]">Яндекс</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-[#6e6e73]">
            Нет аккаунта?{' '}
            <a href="/register" className="text-[#1d1d1f] hover:text-[#1d1d1f] font-medium transition-colors">
              Зарегистрироваться
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-[#86868b]">
          © 2026 Starec AI. Все права защищены.
        </div>
      </div>
    </div>
  )
}
