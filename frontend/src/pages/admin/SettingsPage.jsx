import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSettings, updateSettings, uploadLogo } from '../../api/settings'
import ImageUpload from '../../components/common/ImageUpload'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import '../../styles/SettingsPage.css'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const [fields, setFields] = useState({
    cafe_name: '',
    welcome_message: '',
    address: '',
    phone: '',
    is_menu_active: true,
  })
  const [logoFile, setLogoFile] = useState(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 60000,
  })

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setFields({
        cafe_name: settings.cafe_name ?? '',
        welcome_message: settings.welcome_message ?? '',
        address: settings.address ?? '',
        phone: settings.phone ?? '',
        is_menu_active: settings.is_menu_active !== false,
      })
      setCurrentLogoUrl(settings.logo_url ?? null)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const logoMutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  async function handleSave(e) {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    try {
      // Upload logo first if a new file was selected
      if (logoFile) {
        await logoMutation.mutateAsync(logoFile)
      }
      await updateMutation.mutateAsync(fields)
      toast.success('Settings saved successfully.')
      setLogoFile(null)
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  function setField(name, value) {
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return <div className="settings-loading" role="status">Loading settings…</div>
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>

      <form onSubmit={handleSave} noValidate>
        {/* ── Section 1: Café Information ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Café Information</h2>
          <div className="settings-fields-grid">
            <div className="settings-field">
              <label htmlFor="s-cafe-name" className="settings-label">Café Name</label>
              <input
                id="s-cafe-name"
                type="text"
                className="settings-input"
                value={fields.cafe_name}
                onChange={(e) => setField('cafe_name', e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="s-phone" className="settings-label">Phone</label>
              <input
                id="s-phone"
                type="tel"
                className="settings-input"
                value={fields.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>
            <div className="settings-field settings-field-full">
              <label htmlFor="s-welcome" className="settings-label">Welcome Message</label>
              <textarea
                id="s-welcome"
                className="settings-input settings-textarea"
                value={fields.welcome_message}
                onChange={(e) => setField('welcome_message', e.target.value)}
                rows={2}
              />
            </div>
            <div className="settings-field settings-field-full">
              <label htmlFor="s-address" className="settings-label">Address</label>
              <input
                id="s-address"
                type="text"
                className="settings-input"
                value={fields.address}
                onChange={(e) => setField('address', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ── Section 2: Logo ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Logo</h2>
          <div className="settings-logo-row">
            <div className="settings-logo-preview" aria-hidden="true">
              {currentLogoUrl && !logoFile ? (
                <img src={currentLogoUrl} alt="Current logo" />
              ) : (
                <span className="settings-logo-placeholder">☕</span>
              )}
            </div>
            <div className="settings-logo-upload-area">
              <ImageUpload
                value={currentLogoUrl}
                onChange={(file) => setLogoFile(file)}
                onClear={() => { setLogoFile(null); setCurrentLogoUrl(null) }}
              />
            </div>
          </div>
        </section>

        {/* ── Section 3: Menu Status ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Menu Status</h2>
          <div className="settings-toggle-row">
            <div className="settings-toggle-description">
              <div className="settings-toggle-label">Menu Active</div>
              <div className="settings-toggle-sublabel">
                {fields.is_menu_active
                  ? 'Your menu is currently visible to customers.'
                  : 'Your menu is hidden from customers.'}
              </div>
            </div>
            <label className="settings-toggle-switch" aria-label="Menu active toggle">
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={fields.is_menu_active}
                onChange={(e) => setField('is_menu_active', e.target.checked)}
              />
              <span className={`settings-toggle-track ${fields.is_menu_active ? 'settings-toggle-track-on' : ''}`}>
                <span className={`settings-toggle-thumb ${fields.is_menu_active ? 'settings-toggle-thumb-on' : ''}`} />
              </span>
            </label>
          </div>
        </section>

        {/* ── Save button ── */}
        <button
          type="submit"
          className="settings-save-btn"
          disabled={saving}
        >
          {saving ? <LoadingSpinner size="sm" variant="inline" /> : <Save size={16} aria-hidden="true" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
