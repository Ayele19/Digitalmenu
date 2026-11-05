import React from 'react'
import '../../styles/CategoryFilter.css'

/**
 * CategoryFilter
 *
 * Props:
 *   categories     - Array<{ id, name, icon? }> — parent categories only
 *   activeCategory - category id | 'all'
 *   onSelect       - (id: string | 'all') => void
 */
export default function CategoryFilter({ categories = [], activeCategory, onSelect }) {
  const allIsActive = activeCategory === 'all' || activeCategory == null

  return (
    <nav className="category-filter-wrapper" aria-label="Filter by category">
      <div className="category-filter-row">
        {/* "All" pill */}
        <button
          type="button"
          className={`category-pill ${allIsActive ? 'category-pill-active' : 'category-pill-inactive'}`}
          onClick={() => onSelect('all')}
          aria-pressed={allIsActive}
        >
          <span className="category-pill-emoji" aria-hidden="true">🍽️</span>
          All
        </button>

        {/* One pill per parent category */}
        {categories.map((cat) => {
          const isActive = String(activeCategory) === String(cat.id)
          return (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${isActive ? 'category-pill-active' : 'category-pill-inactive'}`}
              onClick={() => onSelect(cat.id)}
              aria-pressed={isActive}
            >
              {cat.icon && (
                <span className="category-pill-emoji" aria-hidden="true">
                  {cat.icon}
                </span>
              )}
              {cat.name}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
