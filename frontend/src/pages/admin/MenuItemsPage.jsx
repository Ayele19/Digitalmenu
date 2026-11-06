import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} from '../../api/menuItems'
import { getCategories } from '../../api/categories'
import MenuItemForm from '../../components/admin/MenuItemForm'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatPrice } from '../../utils/formatters'
import '../../styles/MenuItemsPage.css'

export default function MenuItemsPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: getMenuItems,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 0,        // always fresh — categories change rarely but must reflect deletes
  })

  const catMap = useMemo(() => {
    const m = {}
    categories.forEach((c) => {
      m[String(c.id)] = c.name
      // also map children
      if (c.children) {
        c.children.forEach((child) => { m[String(child.id)] = child.name })
      }
    })
    return m
  }, [categories])

  // Flatten the nested category tree into a flat list for the form select
  // Only include active categories
  const flatCategories = useMemo(() => {
    const flat = []
    categories.forEach((parent) => {
      if (parent.is_active === false) return
      flat.push({ id: parent.id, name: parent.name, parent_id: null })
      if (parent.children) {
        parent.children.forEach((child) => {
          if (child.is_active === false) return
          flat.push({ id: child.id, name: child.name, parent_id: parent.id })
        })
      }
    })
    return flat
  }, [categories])

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Item created successfully.')
      setFormOpen(false)
      setEditItem(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to create item.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => updateMenuItem(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Item updated successfully.')
      setFormOpen(false)
      setEditItem(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to update item.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Item deleted.')
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to delete item.')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: toggleAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to update availability.')
    },
  })

  // ── Filter ──
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const term = search.toLowerCase()
    return items.filter(
      (i) =>
        i.name?.toLowerCase().includes(term) ||
        flatCategories.find((c) => String(c.id) === String(i.category_id))?.name?.toLowerCase().includes(term)
    )
  }, [items, search, catMap])

  // ── Handlers ──
  function handleOpenAdd() {
    setEditItem(null)
    setFormOpen(true)
  }

  function handleOpenEdit(item) {
    setEditItem(item)
    setFormOpen(true)
  }

  async function handleFormSave(formData) {
    if (editItem) {
      await updateMutation.mutateAsync({ id: editItem.id, formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  function handleToggle(item) {
    toggleMutation.mutate(item.id)
  }

  return (
    <div className="menu-items-page">
      {/* ── Header ── */}
      <div className="menu-items-header">
        <h1 className="menu-items-title">Menu Items</h1>
        <button
          type="button"
          className="menu-items-add-btn"
          onClick={handleOpenAdd}
        >
          <Plus size={16} aria-hidden="true" />
          Add New Item
        </button>
      </div>

      {/* ── Search ── */}
      <div className="menu-items-search-wrapper">
        <span className="menu-items-search-icon" aria-hidden="true">
          <Search size={16} />
        </span>
        <input
          type="search"
          className="menu-items-search-input"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search menu items"
        />
      </div>

      {itemsLoading ? (
        <div className="menu-items-loading" role="status">Loading…</div>
      ) : filteredItems.length === 0 ? (
        <div className="menu-items-empty">No items found.</div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="menu-items-table-wrapper desktop-only">
            <table className="menu-items-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="menu-items-thumb"
                        />
                      ) : (
                        <div className="menu-items-thumb-placeholder" aria-hidden="true">
                          🍽️
                        </div>
                      )}
                    </td>
                    <td className="menu-items-name">{item.name}</td>
                    <td>{catMap[String(item.category_id)] ?? '—'}</td>
                    <td className="menu-items-price">{formatPrice(item.price)}</td>
                    <td>
                      <button
                        type="button"
                        className={`menu-items-status-badge ${
                          item.is_available !== false
                            ? 'menu-items-badge-available'
                            : 'menu-items-badge-unavailable'
                        }`}
                        onClick={() => handleToggle(item)}
                        aria-label={`Toggle availability for ${item.name}`}
                        title="Click to toggle availability"
                      >
                        {item.is_available !== false ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td>
                      <div className="menu-items-actions">
                        <button
                          type="button"
                          className="menu-items-action-btn"
                          onClick={() => handleOpenEdit(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="menu-items-action-btn menu-items-action-btn-delete"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="menu-items-cards mobile-only">
            {filteredItems.map((item) => (
              <div key={item.id} className="menu-items-card">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="menu-items-thumb"
                  />
                ) : (
                  <div className="menu-items-thumb-placeholder" aria-hidden="true">
                    🍽️
                  </div>
                )}
                <div className="menu-items-card-info">
                  <div className="menu-items-card-name">{item.name}</div>
                  <div className="menu-items-card-meta">
                    {catMap[String(item.category_id)] ?? '—'}
                  </div>
                  <div className="menu-items-card-footer">
                    <span className="menu-items-price">{formatPrice(item.price)}</span>
                    <button
                      type="button"
                      className={`menu-items-status-badge ${
                        item.is_available !== false
                          ? 'menu-items-badge-available'
                          : 'menu-items-badge-unavailable'
                      }`}
                      onClick={() => handleToggle(item)}
                      aria-label={`Toggle availability for ${item.name}`}
                    >
                      {item.is_available !== false ? 'Available' : 'Unavailable'}
                    </button>
                    <div className="menu-items-actions">
                      <button
                        type="button"
                        className="menu-items-action-btn"
                        onClick={() => handleOpenEdit(item)}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="menu-items-action-btn menu-items-action-btn-delete"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Add/Edit form modal ── */}
      <MenuItemForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        onSave={handleFormSave}
        categories={flatCategories}
        editItem={editItem}
      />

      {/* ── Delete confirm dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
