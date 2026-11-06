import React from 'react'
import '../../styles/MenuCard.css'

const DEFAULT_EMOJI = '🍽️'

export default function MenuCard({ item }) {
  const {
    name,
    description,
    price,
    image_url,
    is_available = true,
    emoji = DEFAULT_EMOJI,
  } = item

  return (
    <article className="menu-card" tabIndex={0} role="button" aria-label={name}>
      {/* ── Image ── */}
      <div className="menu-card-image-wrapper">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="menu-card-image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="menu-card-placeholder" aria-hidden="true">
            <span className="menu-card-placeholder-emoji">{emoji}</span>
          </div>
        )}
        {/* Price badge that appears on hover */}
        <div className="menu-card-price-badge" aria-hidden="true">
          ETB {Number(price).toFixed(2)}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="menu-card-body">
        <h3 className="menu-card-name" title={name}>{name}</h3>
        {description && (
          <p className="menu-card-description">{description}</p>
        )}
        <div className="menu-card-footer">
          <p className="menu-card-price">ETB {Number(price).toFixed(2)}</p>
        </div>
      </div>

      {/* ── Unavailable overlay ── */}
      {!is_available && (
        <div className="menu-card-unavailable-overlay" aria-label="Item unavailable">
          <span className="menu-card-unavailable-badge">Unavailable</span>
        </div>
      )}
    </article>
  )
}
