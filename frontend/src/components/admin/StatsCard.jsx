import React from 'react'
import '../../styles/StatsCard.css'

const COLOR_VARIANTS = ['brown', 'green', 'blue', 'gold', 'red', 'purple']

/**
 * StatsCard
 *
 * Props:
 *   icon  - Lucide icon component
 *   label - string
 *   value - string | number
 *   color - 'brown' | 'green' | 'blue' | 'gold' | 'red' | 'purple'  (default: 'brown')
 */
export default function StatsCard({ icon: Icon, label, value, color = 'brown' }) {
  const safeColor = COLOR_VARIANTS.includes(color) ? color : 'default'

  return (
    <div className="stats-card">
      <div className={`stats-icon-wrapper stats-icon-${safeColor}`} aria-hidden="true">
        {Icon && <Icon size={22} />}
      </div>
      <div className="stats-text">
        <span className="stats-label">{label}</span>
        <span className="stats-value">{value ?? '—'}</span>
      </div>
    </div>
  )
}
