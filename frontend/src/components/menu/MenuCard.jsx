import React from 'react'
import '../../styles/MenuCard.css'

// Default food emoji when no category icon is provided
const DEFAULT_FOOD_EMOJI = '🍽️'

/**
 * MenuCard
 *
 * Props:
 *   item - {
 *     name         : string
 *     description  : string
 *     price        : number
 *     image_url    : string | null
 *     is_available : boolean
 *     emoji        : string (optional, fallback placeholder emoji)
 *   }
 */
export default function MenuCard({ item }) {
  const {
    name,
    description,
    price,
    image_url,
    is_available = true,
    emoji = DEFAULT_FOOD_EMOJI,
  } = item

  return (
    <article className="menu-card">
      {/* Image section */}
      <div className="menu-card-image-wrapper">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="menu-card-image"
            loading="lazy"
          />
        ) : (
          <div className="menu-card-placeholder" aria-hidden="true">
            <span className="menu-card-placeholder-emoji">{emoji}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="menu-card-body">
        <h3 className="menu-card-name" title={name}>{name}</h3>
        {description && (
          <p className="menu-card-description">{description}</p>
        )}
        <p className="menu-card-price">ETB {Number(price).toFixed(2)}</p>
      </div>

      {/* Unavailable overlay */}
      {!is_available && (
        <div className="menu-card-unavailable-overlay" aria-label="Item unavailable">
          <span className="menu-card-unavailable-badge">Unavailable</span>
        </div>
      )}
    </article>
  )
}
