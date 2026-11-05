import React from 'react'
import { Search } from 'lucide-react'
import '../../styles/SearchBar.css'

/**
 * SearchBar
 *
 * Props:
 *   value    - string (controlled value)
 *   onChange - (value: string) => void
 *   placeholder - string (optional)
 */
export default function SearchBar({ value, onChange, placeholder = 'Search menu…' }) {
  return (
    <div className="search-bar-sticky">
      <div className="search-bar-wrapper">
        <span className="search-bar-icon" aria-hidden="true">
          <Search size={18} />
        </span>
        <input
          type="search"
          className="search-bar-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search menu items"
        />
      </div>
    </div>
  )
}
