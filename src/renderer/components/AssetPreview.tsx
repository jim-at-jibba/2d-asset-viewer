import React, { useState, useEffect, useRef, useCallback } from 'react'
import './AssetPreview.css'

// Predefined background options
const BACKGROUND_OPTIONS = [
  { id: 'checkered', label: 'Checkered', color1: '#ffffff', color2: '#cccccc' },
  { id: 'black', label: 'Black', color: '#000000' },
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'gray', label: 'Gray', color: '#808080' },
  { id: 'transparent', label: 'Transparent', color: 'transparent' }
]

interface AssetPreviewProps {
  assetPath?: string
  altText?: string
}

const AssetPreview: React.FC<AssetPreviewProps> = ({ assetPath, altText = 'Asset preview' }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    null
  )
  const [zoomLevel, setZoomLevel] = useState<number>(100) // Default 100% zoom
  const [backgroundOption, setBackgroundOption] = useState<string>('checkered') // Default to checkered
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (assetPath) {
      setIsLoading(true)
      setError(null)
      // Reset image dimensions and zoom level when a new asset is loaded
      setImageDimensions(null)
      setZoomLevel(100)
    }
  }, [assetPath])

  // Handle image load to set actual dimensions
  const handleImageLoad = (): void => {
    setIsLoading(false)
    if (imageRef.current) {
      // Store the natural (actual) dimensions of the image
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      })
    }
  }

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>): void => {
      e.preventDefault()

      // Calculate new zoom level - zooming in/out by 10% per wheel movement
      const zoomDelta = e.deltaY < 0 ? 10 : -10
      const newZoom = Math.max(10, Math.min(500, zoomLevel + zoomDelta)) // Limit zoom between 10% and 500%

      setZoomLevel(newZoom)
    },
    [zoomLevel]
  )

  // Get background style based on selected option
  const getBackgroundStyle = (): React.CSSProperties => {
    const option = BACKGROUND_OPTIONS.find((opt) => opt.id === backgroundOption)

    if (!option) {
      return {} // Default empty style
    }

    if (backgroundOption === 'checkered') {
      return {
        backgroundImage: `
          linear-gradient(45deg, ${option.color2} 25%, transparent 25%), 
          linear-gradient(-45deg, ${option.color2} 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, ${option.color2} 75%), 
          linear-gradient(-45deg, transparent 75%, ${option.color2} 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: option.color1
      }
    }

    return {
      // For non-checkered backgrounds, remove the checkered pattern
      backgroundImage: 'none',
      backgroundColor: option.color
    }
  }

  // Handle background change
  const handleBackgroundChange = (optionId: string): void => {
    setBackgroundOption(optionId)
  }

  if (!assetPath) {
    return (
      <div className="asset-preview empty-state">
        <p>No asset selected</p>
        <p className="text-sm text-muted-foreground">Select an image from the file tree</p>
      </div>
    )
  }

  return (
    <div className="asset-preview">
      {isLoading && (
        <div className="loading-indicator">
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Controls panel */}
      <div className="controls-panel">
        {/* Zoom info */}
        {imageDimensions && (
          <div className="zoom-info">
            <span>
              {imageDimensions.width} × {imageDimensions.height} px
            </span>
            <span>|</span>
            <span>{zoomLevel}%</span>
          </div>
        )}

        {/* Background options */}
        <div className="background-options">
          <label>Background:</label>
          <div className="background-buttons">
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`bg-option ${backgroundOption === option.id ? 'active' : ''}`}
                title={option.label}
                onClick={() => handleBackgroundChange(option.id)}
                style={{
                  backgroundColor: option.color || (option.id === 'checkered' ? '#ccc' : undefined),
                  backgroundImage:
                    option.id === 'checkered'
                      ? 'linear-gradient(45deg, #fff 50%, transparent 50%)'
                      : undefined
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="image-container"
        onWheel={handleWheel}
        style={getBackgroundStyle()}
      >
        <img
          ref={imageRef}
          src={assetPath}
          alt={altText}
          className="preview-image"
          style={{
            // Set the image size based on zoom level while maintaining aspect ratio
            width: imageDimensions ? `${imageDimensions.width * (zoomLevel / 100)}px` : 'auto',
            height: imageDimensions ? `${imageDimensions.height * (zoomLevel / 100)}px` : 'auto'
          }}
          onLoad={handleImageLoad}
          onError={(e) => {
            console.error('Image failed to load:', e)
            setIsLoading(false)
            setError(`Failed to load image: ${assetPath}`)
          }}
        />
      </div>
    </div>
  )
}

export default AssetPreview
