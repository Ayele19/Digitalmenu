import React, { useState, useEffect, useCallback } from 'react'
import { X, Save } from 'lucide-react'
import ImageUpload from '../common/ImageUpload'
import LoadingSpinner from '../common/LoadingSpinner'
import '../../styles/MenuItemForm.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category_id: '',
  is_available: true,
}

/**
 * MenuItemForm
 *
 * Props:
 *   isOpen     - boolean
 *   onClose    - () => void
 *   onSave     - (formData: FormData) => Promise<void>
 *   categories - Array<{ id, name, parent_id? }>  (flat list)
 *   editItem   - object | null  (if provided, pre-fills form)
 */
export default function MenuItemForm({ isOpen, onClose, onSave, categories = [], editItem = null }) {
  const [fields, setFields] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(null)
  const [saving, setSaving] = useState(false)

  // Pre-fill when editItem changes
  useEffect(() => {
    if (editItem) {
      setFields({
        name: editItem.name ?? '',
        description: editItem.description ?? '',
        price: editItem.price != null ? String(editItem.price) : '',
        category_id: editItem.category_id != null ? String(editItem.category_id) : '',
        is_available: editItem.is_available !== false,
      })
      setCurrentImageUrl(editItem.image_url ?? null)
    } else {
      setFields(EMPTY_FORM)
      setCurrentImageUrl(null)
    }
    setImageFile(null)
  }, [editItem, isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  function setField(name, value) {
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = useCallback((file) => {
    setImageFile(file)
  }, [])

  const handleImageClear = useCallback(() => {
    setImageFile(null)
    setCurrentImageUrl(null)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return

    const formData = new FormData()
    formData.append('name', fields.name.trim())
    formData.append('description', fields.description.trim())
    formData.append('price', fields.price)
    formData.append('category_id', fields.category_id)
    formData.append('is_available', fields.is_available ? 'true' : 'false')

    if (imageFile) {
      formData.append('image', imageFile)
    }

    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  // Split categories into parents and children for select tree rendering
  const parents = categories.filter((c) => !c.parent_id)
  const childrenOf = (parentId) =>
    categories.filter((c) => String(c.parent_id) === String(parentId))

  return (
    <div
      className="menu-item-form-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mif-title"
    >
      <div className="menu-item-form-card">
        {/* Header */}
        <div className="menu-item-form-header">
          <h2 className="menu-item-form-title" id="mif-title">
            {editItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button
            type="button"
            className="menu-item-form-close-btn"
            onClick={onClose}
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="menu-item-form-body">
            {/* Item Name */}
            <div className="mif-field">
              <label htmlFor="mif-name" className="mif-label">
                Item Name <span className="mif-required" aria-hidden="true">*</span>
              </label>
              <input
                id="mif-name"
                type="text"
                className="mif-input"
                placeholder="e.g. Tibs, Injera Combo…"
                value={fields.name}
                onChange={(e) => setField('name', e.target.value)}
                required
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div className="mif-field">
              <label htmlFor="mif-description" className="mif-label">
                Description
              </label>
              <textarea
                id="mif-description"
                className="mif-textarea"
                placeholder="Short description of the item…"
                value={fields.description}
                onChange={(e) => setField('description', e.target.value)}
                maxLength={500}
              />
            </div>

            {/* Price */}
            <div className="mif-field">
              <label htmlFor="mif-price" className="mif-label">
                Price (ETB) <span className="mif-required" aria-hidden="true">*</span>
              </label>
              <input
                id="mif-price"
                type="number"
                className="mif-input"
                placeholder="0.00"
                value={fields.price}
                onChange={(e) => setField('price', e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Category */}
            <div className="mif-field">
              <label htmlFor="mif-category" className="mif-label">
                Category
              </label>
              <select
                id="mif-category"
                className="mif-select"
                value={fields.category_id}
                onChange={(e) => setField('category_id', e.target.value)}
              >
                <option value="">— Select a category —</option>
                {parents.map((parent) => {
                  const subs = childrenOf(parent.id)
                  return (
                    <React.Fragment key={parent.id}>
                      <option value={parent.id}>{parent.name}</option>
                      {subs.map((sub) => (
                        <option
                          key={sub.id}
                          value={sub.id}
                          className="mif-option-sub"
                        >
                          {'  '}↳ {sub.name}
                        </option>
                      ))}
                    </React.Fragment>
                  )
                })}
                {/* Categories with no recognised parent (edge case) */}
                {categories
                  .filter(
                    (c) =>
                      c.parent_id &&
                      !parents.find((p) => String(p.id) === String(c.parent_id))
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Is Available toggle */}
            <div className="mif-toggle-row">
              <div>
                <div className="mif-toggle-label-text">Available</div>
                <div className="mif-toggle-sublabel">
                  Show this item on the public menu
                </div>
              </div>
              <label className="mif-toggle-switch" aria-label="Is available">
                <input
                  type="checkbox"
                  className="mif-toggle-input"
                  checked={fields.is_available}
                  onChange={(e) => setField('is_available', e.target.checked)}
                />
                <span className={`mif-toggle-track${fields.is_available ? ' mif-toggle-on' : ''}`}>
                  <span className={`mif-toggle-thumb${fields.is_available ? ' mif-toggle-thumb-on' : ''}`} />
                </span>
              </label>
            </div>

            {/* Image upload */}
            <div className="mif-field">
              <span className="mif-label">Item Image</span>
              <ImageUpload
                value={currentImageUrl}
                onChange={handleImageChange}
                onClear={handleImageClear}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="menu-item-form-footer">
            <button
              type="button"
              className="mif-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mif-btn-save"
              disabled={saving || !fields.name.trim() || !fields.price}
            >
              {saving ? (
                <LoadingSpinner size="sm" variant="inline" />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
