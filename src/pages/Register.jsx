import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from './AuthLayout'
import { Field, Input } from '../components/ui/Input'
import Button from '../components/ui/Button'

const initial = { first_name: '', last_name: '', email: '', phone: '', password: '' }

export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    const result = await register(values)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } else {
      setError(result.message)
      setFieldErrors(result.errors || {})
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-display text-2xl font-bold text-ink">Create your account</h2>
      <p className="mt-1 text-sm text-slate">Register to access MediCore HMS.</p>

      {success ? (
        <p className="mt-6 rounded-lg bg-success-50 px-3 py-3 text-sm text-success-500">
          Account created! Redirecting you to sign in…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required error={fieldErrors.first_name?.[0]}>
              <Input value={values.first_name} onChange={(e) => setField('first_name', e.target.value)} required />
            </Field>
            <Field label="Last Name" required error={fieldErrors.last_name?.[0]}>
              <Input value={values.last_name} onChange={(e) => setField('last_name', e.target.value)} required />
            </Field>
          </div>
          <Field label="Email" required error={fieldErrors.email?.[0]}>
            <Input type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} required />
          </Field>
          <Field label="Phone">
            <Input value={values.phone} onChange={(e) => setField('phone', e.target.value)} />
          </Field>
          <Field label="Password" required error={fieldErrors.password?.[0]} hint="8+ chars, upper, lower, digit, symbol">
            <Input type="password" value={values.password} onChange={(e) => setField('password', e.target.value)} required />
          </Field>

          <p className="text-xs text-slate">
            This creates a <span className="font-medium text-ink">Patient</span> account. Staff
            accounts (doctor, receptionist, etc.) are created by an admin from the Users section.
          </p>

          {error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            <UserPlus size={16} /> {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-500 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
