import { useState } from 'react'
import { Field, Input, Textarea, Select } from './Input'
import EntityPicker from './EntityPicker'
import Button from './Button'

/**
 * Renders a form from a field-definition array and calls onSubmit(values).
 * Field def: { name, label, type: 'text'|'number'|'date'|'time'|'select'|'textarea'|'checkbox',
 *               required, options (for select): [{value,label}], placeholder }
 */
export default function ResourceForm({ fields, initialValues = {}, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [values, setValues] = useState(() => {
    const initial = {}
    fields.forEach((f) => {
      initial[f.name] = initialValues[f.name] ?? (f.type === 'checkbox' ? false : '')
    })
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function setValue(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})

    // Required "lookup" fields (patient/doctor/etc pickers) need an actual
    // selection, not just typed search text — check that here since the
    // browser's native `required` only validates the visible search box,
    // not whether something was actually picked.
    const missing = {}
    fields.forEach((f) => {
      if (f.type === 'lookup' && f.required && !values[f.name]) {
        missing[f.name] = [`Please select a ${f.label.toLowerCase()} from the list.`]
      }
    })
    if (Object.keys(missing).length > 0) {
      setErrors(missing)
      return
    }

    setSaving(true)
    const result = await onSubmit(values)
    setSaving(false)
    if (result?.errors) setErrors(result.errors)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const span = f.fullWidth ? 'sm:col-span-2' : ''
          const fieldError = errors[f.name]?.[0] || errors[f.name]

          if (f.type === 'checkbox') {
            return (
              <label key={f.name} className={`flex items-center gap-2 ${span}`}>
                <input
                  type="checkbox"
                  checked={!!values[f.name]}
                  onChange={(e) => setValue(f.name, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-ink">{f.label}</span>
              </label>
            )
          }

          if (f.type === 'static') {
            return (
              <div key={f.name} className={span}>
                <Field label={f.label} hint={f.hint}>
                  <div className="rounded-lg border border-slate-100 bg-canvas px-3 py-2 text-sm text-ink">
                    {f.displayValue}
                  </div>
                </Field>
              </div>
            )
          }

          if (f.type === 'lookup') {
            return (
              <div key={f.name} className={span}>
                <Field label={f.label} required={f.required} error={fieldError} hint={f.hint}>
                  <EntityPicker
                    endpoint={f.endpoint}
                    value={values[f.name]}
                    onChange={(id) => setValue(f.name, id)}
                    getLabel={f.getLabel}
                    getSubLabel={f.getSubLabel}
                    searchable={f.searchable !== false}
                    extraParams={f.extraParams}
                    placeholder={f.placeholder || `Search ${f.label.toLowerCase()}…`}
                    required={f.required}
                    invalid={!!fieldError}
                  />
                </Field>
              </div>
            )
          }

          if (f.type === 'select') {
            return (
              <div key={f.name} className={span}>
                <Field label={f.label} required={f.required} error={fieldError}>
                  <Select value={values[f.name]} onChange={(e) => setValue(f.name, e.target.value)} required={f.required}>
                    <option value="">Select…</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            )
          }

          if (f.type === 'textarea') {
            return (
              <div key={f.name} className={span}>
                <Field label={f.label} required={f.required} error={fieldError}>
                  <Textarea
                    value={values[f.name]}
                    placeholder={f.placeholder}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    required={f.required}
                  />
                </Field>
              </div>
            )
          }

          return (
            <div key={f.name} className={span}>
              <Field label={f.label} required={f.required} error={fieldError} hint={f.hint}>
                <Input
                  type={f.type || 'text'}
                  step={f.step}
                  value={values[f.name]}
                  placeholder={f.placeholder}
                  onChange={(e) => setValue(f.name, e.target.value)}
                  required={f.required}
                  autoComplete={f.type === 'password' ? 'new-password' : f.type === 'email' ? 'off' : undefined}
                />
              </Field>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
