import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  UtensilsCrossed,
  Tags,
  CheckCircle,
  XCircle,
  Salad,
  Coffee,
} from 'lucide-react'
import { getMenuItems } from '../../api/menuItems'
import { getCategories } from '../../api/categories'
import StatsCard from '../../components/admin/StatsCard'
import { formatPrice, formatDate } from '../../utils/formatters'
import '../../styles/DashboardPage.css'

// Category names considered "drinks"
const DRINK_KEYWORDS = ['drink', 'beverage', 'coffee', 'tea', 'juice', 'hot drink', 'cold drink']

function isDrinkCategory(name = '') {
  const lower = name.toLowerCase()
  return DRINK_KEYWORDS.some((kw) => lower.includes(kw))
}

export default function DashboardPage() {
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: getMenuItems,
  })

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const isLoading = itemsLoading || catsLoading

  // Build a category id → name map
  const catMap = useMemo(() => {
    const m = {}
    categories.forEach((c) => { m[String(c.id)] = c.name })
    return m
  }, [categories])

  // Compute stats
  const stats = useMemo(() => {
    const drinkCatIds = new Set(
      categories
        .filter((c) => isDrinkCategory(c.name))
        .map((c) => String(c.id))
    )
    const drinkCount = items.filter((i) => drinkCatIds.has(String(i.category_id))).length
    const foodCount = items.length - drinkCount

    return {
      total: items.length,
      food: foodCount,
      drinks: drinkCount,
      totalCats: categories.length,
      available: items.filter((i) => i.is_available !== false).length,
      unavailable: items.filter((i) => i.is_available === false).length,
    }
  }, [items, categories])

  // Recent 5 items (last added = highest id or created_at)
  const recentItems = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at)
        }
        return b.id - a.id
      })
      .slice(0, 5)
  }, [items])

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>

      {isLoading ? (
        <div className="dashboard-loading" role="status">Loading…</div>
      ) : (
        <>
          {/* ── Stats grid ── */}
          <div className="dashboard-stats-grid">
            <StatsCard
              icon={UtensilsCrossed}
              label="Total Menu Items"
              value={stats.total}
              color="brown"
            />
            <StatsCard
              icon={Salad}
              label="Food Items"
              value={stats.food}
              color="gold"
            />
            <StatsCard
              icon={Coffee}
              label="Drink Items"
              value={stats.drinks}
              color="blue"
            />
            <StatsCard
              icon={Tags}
              label="Total Categories"
              value={stats.totalCats}
              color="purple"
            />
            <StatsCard
              icon={CheckCircle}
              label="Available Items"
              value={stats.available}
              color="green"
            />
            <StatsCard
              icon={XCircle}
              label="Unavailable Items"
              value={stats.unavailable}
              color="red"
            />
          </div>

          {/* ── Recent items table ── */}
          <div className="dashboard-recent-card">
            <div className="dashboard-recent-header">
              <h2 className="dashboard-recent-title">Recently Added Items</h2>
              <span className="dashboard-recent-subtitle">Last 5 items</span>
            </div>

            {recentItems.length === 0 ? (
              <p className="dashboard-empty">No menu items yet.</p>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentItems.map((item) => (
                      <tr key={item.id}>
                        <td className="dashboard-item-name">{item.name}</td>
                        <td className="dashboard-item-category">
                          {catMap[String(item.category_id)] ?? '—'}
                        </td>
                        <td className="dashboard-item-price">
                          {formatPrice(item.price)}
                        </td>
                        <td>
                          <span
                            className={`dashboard-badge ${
                              item.is_available !== false
                                ? 'dashboard-badge-available'
                                : 'dashboard-badge-unavailable'
                            }`}
                          >
                            {item.is_available !== false ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
