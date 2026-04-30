'use client'

import { useState } from 'react'
import { login } from './actions'
import { KeyRound, Mail, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon-large">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--accent)' }}>
              <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/>
              <path d="M21 8H3l2 13h14l2-13Z"/>
              <path d="M10 12h4"/>
            </svg>
          </div>
          <h1>La Soda Stock</h1>
          <p>Bienvenido. Inicia sesión para gestionar el inventario.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Contraseña</label>
            <div className="input-with-icon">
              <KeyRound className="input-icon" size={18} />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary login-btn">
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Accediendo...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Si no tienes acceso, contacta con un superusuario.</p>
          <Link 
            href="/login/forgot-password" 
            style={{ 
              display: 'block',
              marginTop: 12,
              fontSize: '0.85rem', 
              color: 'var(--accent)', 
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            ¿Has olvidado tu contraseña?
          </Link>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          position: fixed;
          inset: 0;
          background: var(--bg-base);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 40px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-icon-large {
          width: 56px;
          height: 56px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .login-header h1 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .login-header p {
          font-size: 0.9rem;
          color: var(--text-tertiary);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .input-with-icon .input {
          padding-left: 40px;
        }

        .login-btn {
          width: 100%;
          justify-content: center;
          height: 44px;
          margin-top: 8px;
        }

        .login-error {
          background: rgba(194, 107, 107, 0.1);
          border: 1px solid rgba(194, 107, 107, 0.2);
          color: var(--status-danger);
          padding: 12px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
