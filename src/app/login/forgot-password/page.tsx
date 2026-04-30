'use client'

import { useState } from 'react'
import { requestPasswordResetAction } from '@/app/actions'
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    
    const result = await requestPasswordResetAction(email)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Ocurrió un error al enviar el enlace.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="brand-icon-large" style={{ background: 'var(--status-ok-dim)', color: 'var(--status-ok)', border: '1px solid var(--status-ok-border)' }}>
            <CheckCircle2 size={32} />
          </div>
          <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>¡Enlace enviado!</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: 24 }}>
            Revisa tu bandeja de entrada. Te hemos enviado un enlace para restablecer tu contraseña.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Volver al inicio
          </Link>
        </div>
        <style jsx>{`
          .login-container { position: fixed; inset: 0; background: var(--bg-base); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
          .login-card { width: 100%; max-width: 400px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: 40px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); }
          .brand-icon-large { width: 56px; height: 56px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Link href="/login" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            fontSize: '0.75rem', 
            color: 'var(--text-tertiary)', 
            textDecoration: 'none',
            marginBottom: 20
          }}>
            <ArrowLeft size={14} />
            Volver
          </Link>
          <h1>Restablecer contraseña</h1>
          <p>Introduce tu email y te enviaremos un enlace de recuperación.</p>
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

          <button type="submit" disabled={loading} className="btn btn-primary login-btn">
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Enviando...
              </>
            ) : (
              'Enviar enlace'
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container { position: fixed; inset: 0; background: var(--bg-base); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
        .login-card { width: 100%; max-width: 400px; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: 40px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); }
        .login-header { text-align: left; margin-bottom: 32px; }
        .login-header h1 { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 8px; }
        .login-header p { font-size: 0.9rem; color: var(--text-tertiary); }
        .login-form { display: flex; flex-direction: column; gap: 20px; }
        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); pointer-events: none; }
        .input-with-icon .input { padding-left: 40px; }
        .login-btn { width: 100%; justify-content: center; height: 44px; margin-top: 8px; }
        .login-error { background: rgba(194, 107, 107, 0.1); border: 1px solid rgba(194, 107, 107, 0.2); color: var(--status-danger); padding: 12px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 10px; font-size: 0.85rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
