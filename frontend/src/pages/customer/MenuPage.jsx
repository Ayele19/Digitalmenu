import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublicSettings, getPublicMenu } from '../../api/public'
import SearchBar from '../../components/menu/SearchBar'
import CategoryFilter from '../../components/menu/CategoryFilter'
import MenuCard from '../../components/menu/MenuCard'
import '../../styles/MenuPage.css'

// ---------- Skeleton card ----------
function SkeletonCard() {
  return (
    <div className="menu-skeleton-card">
      <div className="menu-skeleton-image" />
      <div className="menu-skeleton-body">
        <div className="menu-skeleton-line menu-skeleton-line-title" />
        <div className="menu-skeleton-line" />
        <div className="menu-skeleton-line menu-skeleton-line-short" />
        <div className="menu-skeleton-line menu-skeleton-line-price" />
      </div>
    </div>
  )
}

// ---------- MenuPage ----------
export default function MenuPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const {
    data: settings,
    isLoading: settingsLoading,
  } = useQuery({
    queryKey: ['public-settings'],
    queryFn: getPublicSettings,
    staleTime: 60000,
  })

  const {
    data: menuData,
    isLoading: menuLoading,
  } = useQuery({
    queryKey: ['public-menu'],
    queryFn: getPublicMenu,
    staleTime: 30000,
  })

  const isLoading = settingsLoading || menuLoading

  // Build flat list of all items and parent categories from menu data
  const { allItems, parentCategories, categoryMap } = useMemo(() => {
    const cats = menuData?.categories ?? []
    const items = menuData?.items ?? []

    const map = {}
    cats.forEach((c) => { map[String(c.id)] = c })

    const parents = cats.filter((c) => !c.parent_id)

    return { allItems: items, parentCategories: parents, categoryMap: map }
  }, [menuData])

  // Collect all category ids that belong to the selected parent (parent + its children)
  const activeCategoryIds = useMemo(() => {
    if (activeCategory === 'all') return null
    const selected = String(activeCategory)
    const all = menuData?.categories ?? []
    const children = all
      .filter((c) => String(c.parent_id) === selected)
      .map((c) => String(c.id))
    return new Set([selected, ...children])
  }, [activeCategory, menuData])

  // Filter items
  const filteredItems = useMemo(() => {
    let items = allItems

    if (activeCategoryIds) {
      items = items.filter((item) =>
        activeCategoryIds.has(String(item.category_id))
      )
    }

    if (search.trim()) {
      const term = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
      )
    }

    return items
  }, [allItems, activeCategoryIds, search])

  const cafeName = settings?.cafe_name ?? 'Ethiopian Café'
  const welcomeMsg = settings?.welcome_message ?? 'Welcome, enjoy our menu'
  const logoUrl = settings?.logo_url ?? null

  return (
    <div className="menu-page">
      {/* ── Sticky header ── */}
      <header className="menu-header">
        <div className="menu-header-logo" aria-hidden="true">
          {logoUrl ? (
            <img src={logoUrl} alt={`${cafeName} logo`} />
          ) : (
            <span className="menu-header-logo-fallback">☕</span>
          )}
        </div>
        <div className="menu-header-text">
          <div className="menu-header-name">{cafeName}</div>
          <div className="menu-header-welcome">{welcomeMsg}</div>
        </div>
      </header>

      <main className="menu-main">
        {/* ── Search ── */}
        <SearchBar value={search} onChange={setSearch} />

        {/* ── Category filter ── */}
        <CategoryFilter
          categories={parentCategories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        {/* ── Content ── */}
        {isLoading ? (
          <div className="menu-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="menu-empty" role="status">
            <span className="menu-empty-emoji">🍵</span>
            <p className="menu-empty-title">No items found</p>
            <p className="menu-empty-suggestion">
              Try a different search term or select another category.
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => {
              const cat = categoryMap[String(item.category_id)]
              return (
                <MenuCard
                  key={item.id}
                  item={{ ...item, emoji: cat?.icon ?? '🍽️' }}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="menu-footer">
        <span className="menu-footer-name">{cafeName}</span>
        <span className="menu-footer-powered">Powered by Digital Menu</span>
      </footer>
    </div>
  )
}
