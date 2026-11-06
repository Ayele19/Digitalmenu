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

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['public-settings'],
    queryFn: getPublicSettings,
    staleTime: 60000,
  })

  // API returns: [{ id, name, slug, icon, display_order, items: [...], subcategories: [...] }]
  const { data: menuSections = [], isLoading: menuLoading } = useQuery({
    queryKey: ['public-menu'],
    queryFn: getPublicMenu,
    staleTime: 30000,
  })

  const isLoading = settingsLoading || menuLoading

  // Flatten the menu tree into:
  //   - parentCategories: top-level categories (for filter pills)
  //   - allItems: every item with its category_id attached
  const { parentCategories, allItems } = useMemo(() => {
    if (!menuSections || menuSections.length === 0) {
      return { parentCategories: [], allItems: [] }
    }

    const parents = []
    const items = []

    menuSections.forEach((section) => {
      // Parent category pill
      parents.push({
        id: section.id,
        name: section.name,
        icon: section.icon,
        slug: section.slug,
        display_order: section.display_order,
      })

      // Items directly on this parent category
      if (section.items) {
        section.items.forEach((item) => {
          items.push({ ...item, category_id: section.id, _parentId: section.id })
        })
      }

      // Subcategory items
      if (section.subcategories) {
        section.subcategories.forEach((sub) => {
          if (sub.items) {
            sub.items.forEach((item) => {
              items.push({ ...item, category_id: sub.id, _parentId: section.id })
            })
          }
        })
      }
    })

    return { parentCategories: parents, allItems: items }
  }, [menuSections])

  // Filter items by selected category and search term
  const filteredItems = useMemo(() => {
    let items = allItems

    if (activeCategory !== 'all') {
      const selectedId = String(activeCategory)
      // Show items whose parent category matches OR items directly in the sub
      items = items.filter(
        (item) =>
          String(item._parentId) === selectedId ||
          String(item.category_id) === selectedId
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
  }, [allItems, activeCategory, search])

  const cafeName = settings?.cafe_name ?? 'Habesha Café'
  const welcomeMsg = settings?.welcome_message ?? 'Welcome! Enjoy our authentic Ethiopian flavors.'
  const logoUrl = settings?.logo_url ?? null
  const videoUrl = settings?.video_url ?? null

  // Build the full image/video URL — backend serves from /uploads/
  function getImageUrl(url) {
    if (!url) return null
    if (url.startsWith('http')) return url
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${base}${url}`
  }

  return (
    <div className="menu-page">
      {/* ── Sticky header ── */}
      <header className="menu-header">
        <div className="menu-header-logo" aria-hidden="true">
          {logoUrl ? (
            <img src={getImageUrl(logoUrl)} alt={`${cafeName} logo`} className="menu-header-logo-img" />
          ) : (
            <span className="menu-header-logo-fallback">☕</span>
          )}
        </div>
        <div className="menu-header-text">
          <div className="menu-header-name">{cafeName}</div>
          <div className="menu-header-welcome">{welcomeMsg}</div>
        </div>
      </header>

      {/* ── Cinematic hero video ── */}
      {videoUrl && (
        <div className="menu-hero-video-wrapper" aria-hidden="true">
          <video
            className="menu-hero-video"
            src={getImageUrl(videoUrl)}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          {/* Dark overlay for cinematic depth */}
          <div className="menu-hero-video-overlay" />
          {/* Bottom fade into page background */}
          <div className="menu-hero-video-fade" />
        </div>
      )}

      <main className="menu-main">
        {/* ── Search ── */}
        <div className="menu-search-wrapper">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* ── Category filter pills ── */}
        <div className="menu-filter-wrapper">
          <CategoryFilter
            categories={parentCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* ── Item grid ── */}
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
              {search
                ? 'Try a different search term or select another category.'
                : 'No menu items are available right now. Please check back soon.'}
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={{
                  ...item,
                  image_url: getImageUrl(item.image_url),
                }}
              />
            ))}
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
