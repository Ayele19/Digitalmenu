import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronRight, X, Save, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategory,
} from '../../api/categories'
import { getMenuItems } from '../../api/menuItems'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import '../../styles/CategoriesPage.css'

const EMPTY_FORM = { name: '', icon: '', parent_id: '' }

// ── Category form modal ──
function CategoryModal({ isOpen, onClose, onSave, parentCategories, editCategory, defaultParentId }) {
  const [fields, setFields] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      if (editCategory) {
        setFields({
          name: editCategory.name ?? '',
          icon: editCategory.icon ?? '',
          parent_id: editCategory.parent_id != null ? String(editCategory.parent_id) : '',
        })
      } else {
        setFields({ ...EMPTY_FORM, parent_id: defaultParentId ?? '' })
      }
    }
  }, [isOpen, editCategory, defaultParentId])

  React.useEffect(() => {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving || !fields.name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: fields.name.trim(),
        icon: fields.icon.trim() || null,
        parent_id: fields.parent_id ? Number(fields.parent_id) : null,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="cat-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="cat-modal-card">
        <div className="cat-modal-header">
          <h2 className="cat-modal-title" id="cat-modal-title">
            {editCategory ? 'Edit Category' : 'Add Category'}
          </h2>
          <button type="button" className="cat-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="cat-modal-body">
            <div className="cat-field">
              <label htmlFor="cat-name" className="cat-label">
                Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                className="cat-input"
                value={fields.name}
                onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="cat-field">
              <label htmlFor="cat-icon" className="cat-label">Icon (emoji)</label>
              <input
                id="cat-icon"
                type="text"
                className="cat-input"
                placeholder="e.g. 🍛"
                value={fields.icon}
                onChange={(e) => setFields((p) => ({ ...p, icon: e.target.value }))}
                maxLength={4}
              />
            </div>
            <div className="cat-field">
              <label htmlFor="cat-parent" className="cat-label">Parent Category</label>
              <select
                id="cat-parent"
                className="cat-input"
                value={fields.parent_id}
                onChange={(e) => setFields((p) => ({ ...p, parent_id: e.target.value }))}
              >
                <option value="">— Top-level category —</option>
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="cat-modal-footer">
            <button type="button" className="cat-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="cat-btn-save" disabled={saving || !fields.name.trim()}>
              {saving ? <LoadingSpinner size="sm" variant="inline" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ──
export default function CategoriesPage() {
  const queryClient = useQueryClient()

  const [openParents, setOpenParents] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [defaultParentId, setDefaultParentId] = useState('')

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: items = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: getMenuItems,
  })

  // Map category id → item count
  const itemCountMap = useMemo(() => {
    const m = {}
    items.forEach((item) => {
      const key = String(item.category_id)
      m[key] = (m[key] ?? 0) + 1
    })
    return m
  }, [items])

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  )

  function childrenOf(parentId) {
    return categories.filter((c) => String(c.parent_id) === String(parentId))
  }

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created.')
      setModalOpen(false)
    },
    onError: (err) => toast.error(err?.response?.data?.detail ?? 'Failed to create.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated.')
      setModalOpen(false)
      setEditCategory(null)
    },
    onError: (err) => toast.error(err?.response?.data?.detail ?? 'Failed to update.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted.')
    },
    onError: (err) => toast.error(err?.response?.data?.detail ?? 'Failed to delete.'),
  })

  const reorderMutation = useMutation({
    mutationFn: ({ id, order }) => reorderCategory(id, order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: () => toast.error('Failed to reorder.'),
  })

  // ── Handlers ──
  function handleOpenAdd() {
    setEditCategory(null)
    setDefaultParentId('')
    setModalOpen(true)
  }

  function handleOpenAddSub(parentId) {
    setEditCategory(null)
    setDefaultParentId(String(parentId))
    setModalOpen(true)
  }

  function handleOpenEdit(cat) {
    setEditCategory(cat)
    setDefaultParentId('')
    setModalOpen(true)
  }

  function handleDelete(cat) {
    const assignedCount = itemCountMap[String(cat.id)] ?? 0
    const children = childrenOf(cat.id)

    if (assignedCount > 0) {
      toast.error(
        `Cannot delete: ${assignedCount} item${assignedCount > 1 ? 's' : ''} assigned to "${cat.name}". Reassign them first.`,
        { duration: 5000 }
      )
      return
    }

    if (children.length > 0) {
      if (!window.confirm(`"${cat.name}" has ${children.length} subcategorie(s). Delete them all?`)) {
        return
      }
    }

    deleteMutation.mutate(cat.id)
  }

  async function handleSave(data) {
    if (editCategory) {
      await updateMutation.mutateAsync({ id: editCategory.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  function toggleParent(id) {
    setOpenParents((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleReorder(cat, direction) {
    const siblings = categories
      .filter((c) => {
        if (cat.parent_id) return String(c.parent_id) === String(cat.parent_id)
        return !c.parent_id
      })
      .sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id))

    const idx = siblings.findIndex((c) => c.id === cat.id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === siblings.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const swapWith = siblings[swapIdx]

    const newOrder = swapWith.display_order ?? swapIdx + 1
    reorderMutation.mutate({ id: cat.id, order: newOrder })
  }

  return (
    <div className="categories-page">
      {/* ── Header ── */}
      <div className="categories-header">
        <h1 className="categories-title">Categories</h1>
        <button type="button" className="categories-add-btn" onClick={handleOpenAdd}>
          <Plus size={16} aria-hidden="true" />
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="categories-loading" role="status">Loading…</div>
      ) : parentCategories.length === 0 ? (
        <div className="categories-empty">No categories yet. Add one to get started.</div>
      ) : (
        <div className="categories-tree">
          {parentCategories
            .sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id))
            .map((parent, pIdx, pArr) => {
              const children = childrenOf(parent.id)
              const isOpen = openParents.has(parent.id)
              const itemCount = itemCountMap[String(parent.id)] ?? 0

              return (
                <div key={parent.id} className="category-parent-row">
                  {/* ── Parent row header ── */}
                  <div className="category-row-header" onClick={() => toggleParent(parent.id)}>
                    <ChevronRight
                      size={16}
                      className={`category-expand-icon ${isOpen ? 'category-expand-icon-open' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="category-row-emoji" aria-hidden="true">
                      {parent.icon || '📁'}
                    </span>
                    <span className="category-row-name">{parent.name}</span>
                    {itemCount > 0 && (
                      <span className="category-item-count">{itemCount}</span>
                    )}
                    {/* ── Row actions ── */}
                    <div
                      className="category-row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="category-reorder-btn"
                        onClick={() => handleReorder(parent, 'up')}
                        disabled={pIdx === 0}
                        aria-label="Move up"
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        className="category-reorder-btn"
                        onClick={() => handleReorder(parent, 'down')}
                        disabled={pIdx === pArr.length - 1}
                        aria-label="Move down"
                        title="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="category-add-sub-btn"
                        onClick={() => handleOpenAddSub(parent.id)}
                        title="Add subcategory"
                      >
                        <Plus size={12} />
                        Add Sub
                      </button>
                      <button
                        type="button"
                        className="category-action-btn"
                        onClick={() => handleOpenEdit(parent)}
                        aria-label={`Edit ${parent.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="category-action-btn category-action-btn-delete"
                        onClick={() => handleDelete(parent)}
                        aria-label={`Delete ${parent.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* ── Children ── */}
                  {isOpen && children.length > 0 && (
                    <div className="category-children-list">
                      {children
                        .sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id))
                        .map((child, cIdx, cArr) => {
                          const childCount = itemCountMap[String(child.id)] ?? 0
                          return (
                            <div key={child.id} className="category-child-row">
                              <span className="category-child-emoji" aria-hidden="true">
                                {child.icon || '▸'}
                              </span>
                              <span className="category-child-name">{child.name}</span>
                              {childCount > 0 && (
                                <span className="category-child-count">{childCount}</span>
                              )}
                              <div className="category-row-actions">
                                <button
                                  type="button"
                                  className="category-reorder-btn"
                                  onClick={() => handleReorder(child, 'up')}
                                  disabled={cIdx === 0}
                                  aria-label="Move up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="category-reorder-btn"
                                  onClick={() => handleReorder(child, 'down')}
                                  disabled={cIdx === cArr.length - 1}
                                  aria-label="Move down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="category-action-btn"
                                  onClick={() => handleOpenEdit(child)}
                                  aria-label={`Edit ${child.name}`}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="category-action-btn category-action-btn-delete"
                                  onClick={() => handleDelete(child)}
                                  aria-label={`Delete ${child.name}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* ── Category form modal ── */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditCategory(null) }}
        onSave={handleSave}
        parentCategories={parentCategories}
        editCategory={editCategory}
        defaultParentId={defaultParentId}
      />
    </div>
  )
}
