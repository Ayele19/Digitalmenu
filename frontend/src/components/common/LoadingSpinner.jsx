import React from 'react'
import '../../styles/LoadingSpinner.css'

/**
 * LoadingSpinner
 *
 * Props:
 *   size     - 'sm' | 'md' | 'lg'  (default: 'md')
 *   variant  - 'fullscreen' | 'centered' | 'inline'  (default: 'centered')
 */
export default function LoadingSpinner({ size = 'md', variant = 'centered' }) {
  const sizeClass = `spinner-${size}`
  const circle = <span className={`spinner-circle ${sizeClass}`} aria-hidden="true" />

  if (variant === 'fullscreen') {
    return (
      <div className="spinner-fullscreen" role="status" aria-label="Loading">
        {circle}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <span className="spinner-inline" role="status" aria-label="Loading">
        {circle}
      </span>
    )
  }

  // default: centered block
  return (
    <div className="spinner-centered" role="status" aria-label="Loading">
      {circle}
    </div>
  )
}
