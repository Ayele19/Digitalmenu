import React, { useRef, useState, useCallback } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import '../../styles/ImageUpload.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * ImageUpload
 *
 * Props:
 *   value    - current image URL (string | null)
 *   onChange - (file: File) => void
 *   onClear  - () => void
 */
export default function ImageUpload({ value, onChange, onClear }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [localFile, setLocalFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleFile = useCallback(
    (file) => {
      if (!file) return
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Image must be 5 MB or less.')
        return
      }
      const url = URL.createObjectURL(file)
      setPreview(url)
      setLocalFile(file)
      onChange(file)
    },
    [onChange]
  )

  function handleInputChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleClear() {
    setPreview(null)
    setLocalFile(null)
    onClear()
  }

  // Determine what to show in the preview area
  const displaySrc = preview || value || null

  return (
    <div className="image-upload-wrapper">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="image-upload-input"
        onChange={handleInputChange}
        aria-label="Upload image"
      />

      {displaySrc ? (
        /* Preview */
        <div className="image-upload-preview">
          <img
            src={displaySrc}
            alt="Selected preview"
            className="image-upload-preview-img"
          />
          <button
            type="button"
            className="image-upload-clear-btn"
            onClick={handleClear}
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          className={`image-upload-dropzone${dragOver ? ' drag-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Drag and drop an image, or click to select"
        >
          <Upload className="image-upload-icon" aria-hidden="true" />
          <span className="image-upload-primary-text">
            Click or drag &amp; drop an image
          </span>
          <span className="image-upload-secondary-text">PNG, JPG, WEBP — max 5 MB</span>
        </div>
      )}

      {/* File info row */}
      {localFile && (
        <div className="image-upload-file-info">
          <ImageIcon size={14} aria-hidden="true" />
          <span className="image-upload-filename">{localFile.name}</span>
          <span className="image-upload-filesize">({formatFileSize(localFile.size)})</span>
        </div>
      )}
    </div>
  )
}
