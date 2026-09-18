import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDefaultRoute } from '../config/nav'
import AuthLayout from './AuthLayout'
import { Field, Input } from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.success) {
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      navigate(getDefaultRoute(stored.role))
    } else {
      setError(result.message)
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-2xl font-bold text-ink">Welcome back</h2>
      <p className="mt-1 text-sm text-slate">Sign in to your hospital account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.com" required />
        </Field>
        <Field label="Password" required>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
        </Field>

        {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary-500 hover:underline">Create one</Link>
      </p>
    </AuthLayout>
  )
}
