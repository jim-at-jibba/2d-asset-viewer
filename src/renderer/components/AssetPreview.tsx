import React, { useState, useEffect, useRef } from 'react'
import './AssetPreview.css'
import { Play, Pause, ChevronLeft, ChevronRight, FastForward, Rewind, Music } from 'lucide-react'

// Add global window type declaration to include the new function
declare global {
  interface Window {
    api: {
      navigateToFolder: (folderPath: string) => Promise<{
        success: boolean
        folderPath?: string
        folderName?: string
        message?: string
        children?: FileTreeItem[]
      }>
      selectFolder: () => Promise<{
        success: boolean
        folderPath?: string
        message?: string
      }>
      getAnimationFrames: (
        folderPath: string,
        baseName: string,
        extension: string
      ) => Promise<{
        success: boolean
        frames: Array<{ path: string; name: string }>
        message?: string
      }>
    }
  }

  // Define the FileTreeItem interface
  interface FileTreeItem {
    id: string
    name: string
    type: 'folder' | 'file'
    path?: string
    children?: FileTreeItem[]
  }
}

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
  folderPath?: string // Added to access sibling files for animation sequence detection
}

// Animation related types
interface AnimationFrame {
  path: string
  name: string
}

interface SpriteSheetFrame {
  x: number
  y: number
  width: number
  height: number
}

// Add this new interface for sprite sheet config
interface SpriteSheetConfig {
  rows: number
  columns: number
}

// Helper to check if a file is audio
const isAudioFile = (filename: string): boolean => /\.(mp3|wav|ogg|m4a|flac)$/i.test(filename)

const AssetPreview: React.FC<AssetPreviewProps> = ({
  assetPath,
  folderPath,
  altText = 'Asset preview'
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    null
  )
  const [zoomLevel, setZoomLevel] = useState<number>(100) // Default 100% zoom
  const [backgroundOption, setBackgroundOption] = useState<string>('checkered') // Default to checkered
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Add pan related states
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [startPanPoint, setStartPanPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Animation related states
  const [isAnimationSequence, setIsAnimationSequence] = useState<boolean>(false)
  const [animationFrames, setAnimationFrames] = useState<AnimationFrame[]>([])
  const [spriteSheetFrames, setIsSpriteSheetFrames] = useState<SpriteSheetFrame[]>([])
  const [isSpriteSheet, setIsSpriteSheet] = useState<boolean>(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [animationSpeed, setAnimationSpeed] = useState<number>(10) // frames per second
  const animationTimerRef = useRef<number | null>(null)

  // Add sprite sheet configuration state
  const [spriteSheetConfig, setSpriteSheetConfig] = useState<SpriteSheetConfig>({
    rows: 4,
    columns: 4
  })
  const [showSpriteSheetConfig, setShowSpriteSheetConfig] = useState<boolean>(false)

  // Clean up animation timer when component unmounts
  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (assetPath) {
      setIsLoading(true)
      setError(null)
      // Reset image dimensions and zoom level when a new asset is loaded
      setImageDimensions(null)
      setZoomLevel(100)

      // Stop any existing animation
      stopAnimation()

      // Detect animation sequences when a new asset is loaded
      detectAnimationSequence(assetPath)
    }
  }, [assetPath])

  // Detect animation sequences in the same folder as the selected asset
  const detectAnimationSequence = async (currentAssetPath: string): Promise<void> => {
    if (!folderPath || !currentAssetPath) return

    // Reset animation states
    setIsAnimationSequence(false)
    setAnimationFrames([])
    setIsSpriteSheet(false)
    setIsSpriteSheetFrames([])
    setCurrentFrameIndex(0)
    setIsPlaying(false)
    setShowSpriteSheetConfig(false)

    try {
      // First check if this is a sprite sheet by looking for special naming patterns
      // For example: "character_sheet.png" or "animation_spritesheet.png"
      const fileName = currentAssetPath.split('/').pop()?.toLowerCase() || ''

      if (
        fileName.includes('sheet') ||
        fileName.includes('sprite') ||
        fileName.includes('atlas') ||
        fileName.includes('tileset')
      ) {
        console.log('Detected potential sprite sheet based on filename')
        // We need to wait for the image to load before detecting sprite sheet
        // The actual sprite sheet detection happens in handleImageLoad
        return
      }

      // Otherwise, look for sequence patterns in the filename
      const baseNameMatch = fileName.match(/^(.*?)(?:[-_]?(?:0*(\d+)))?(\.[^.]+)?$/)

      if (baseNameMatch) {
        const baseName = baseNameMatch[1]
        const numberPart = baseNameMatch[2]
        const extension = baseNameMatch[3] || ''

        if (numberPart) {
          // If this file has a number in it, look for other files with the same pattern

          // Use the IPC function to get all animation frames
          try {
            // First, normalize the current asset path to remove the asset:// protocol
            currentAssetPath.replace('asset://', '')

            // Call the IPC function to get animation frames
            // Note: The API type in window.api needs to be updated in the TypeScript definition
            // @ts-ignore - getAnimationFrames is defined in preload but TypeScript doesn't see it
            const result = await window.api.getAnimationFrames(folderPath, baseName, extension)

            if (result.success && result.frames.length > 1) {
              // Map the frames to include the asset:// protocol
              const frames = result.frames.map((frame) => ({
                path: `asset://${frame.path}`,
                name: frame.name
              }))

              setAnimationFrames(frames)
              setIsAnimationSequence(true)
              console.log(`Detected animation sequence with ${frames.length} frames`)
            } else {
              console.log('No animation sequence detected or only one frame found')

              // Fallback to demo mode - this can be removed in production
              if (import.meta.env.DEV) {
                console.log('Using dummy frames for demonstration purposes')
                const dummyFrames: AnimationFrame[] = []
                const frameCount = 5 // For demo purposes
                for (let i = 0; i < frameCount; i++) {
                  dummyFrames.push({
                    path: currentAssetPath, // In a real app, these would be different paths
                    name: `${baseName}_${String(i).padStart(2, '0')}${extension}`
                  })
                }
                setAnimationFrames(dummyFrames)
                setIsAnimationSequence(true)
              }
            }
          } catch (error) {
            console.error('Error calling getAnimationFrames:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error detecting animation sequence:', error)
    }
  }

  // Detect sprite sheet animation frames
  const detectSpriteSheet = async (filePath: string): Promise<void> => {
    try {
      console.log(`Detecting sprite sheet from: ${filePath}`)

      // Only process if we have image dimensions
      if (imageRef.current && imageDimensions) {
        const imgWidth = imageDimensions.width
        const imgHeight = imageDimensions.height

        // Use the configuration from state
        const framesPerRow = spriteSheetConfig.columns
        const numRows = spriteSheetConfig.rows

        const frameWidth = imgWidth / framesPerRow
        const frameHeight = imgHeight / numRows

        const frames: SpriteSheetFrame[] = []

        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < framesPerRow; col++) {
            frames.push({
              x: col * frameWidth,
              y: row * frameHeight,
              width: frameWidth,
              height: frameHeight
            })
          }
        }

        if (frames.length > 0) {
          setIsSpriteSheetFrames(frames)
          setIsSpriteSheet(true)
          console.log(`Detected sprite sheet with ${frames.length} frames`)
          // Show the configuration UI when a sprite sheet is detected
          setShowSpriteSheetConfig(true)
        }
      }
    } catch (error) {
      console.error('Error detecting sprite sheet:', error)
    }
  }

  // Start animation playback
  const startAnimation = (): void => {
    if (animationTimerRef.current !== null) {
      window.clearInterval(animationTimerRef.current)
    }

    const intervalMs = 1000 / animationSpeed

    animationTimerRef.current = window.setInterval(() => {
      setCurrentFrameIndex((prev) => {
        const maxFrames = isSpriteSheet ? spriteSheetFrames.length : animationFrames.length

        return (prev + 1) % maxFrames
      })
    }, intervalMs)

    setIsPlaying(true)
  }

  // Stop animation playback
  const stopAnimation = (): void => {
    if (animationTimerRef.current !== null) {
      window.clearInterval(animationTimerRef.current)
      animationTimerRef.current = null
    }

    setIsPlaying(false)
  }

  // Go to next frame
  const nextFrame = (): void => {
    const maxFrames = isSpriteSheet ? spriteSheetFrames.length : animationFrames.length

    setCurrentFrameIndex((prev) => (prev + 1) % maxFrames)
  }

  // Go to previous frame
  const prevFrame = (): void => {
    const maxFrames = isSpriteSheet ? spriteSheetFrames.length : animationFrames.length

    setCurrentFrameIndex((prev) => (prev - 1 + maxFrames) % maxFrames)
  }

  // Handle speed change
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newSpeed = parseInt(e.target.value, 10)
    setAnimationSpeed(newSpeed)

    // If already playing, restart with new speed
    if (isPlaying) {
      stopAnimation()
      startAnimation()
    }
  }

  // Toggle play/pause
  const togglePlayPause = (): void => {
    if (isPlaying) {
      stopAnimation()
    } else {
      startAnimation()
    }
  }

  // Handle image load to set actual dimensions
  const handleImageLoad = (): void => {
    setIsLoading(false)
    setError(null)

    if (imageRef.current) {
      // Get natural dimensions of the image
      const { naturalWidth, naturalHeight } = imageRef.current
      setImageDimensions({ width: naturalWidth, height: naturalHeight })

      // If this might be a sprite sheet based on the filename, try to detect it now
      if (assetPath) {
        const fileName = assetPath.split('/').pop()?.toLowerCase() || ''
        if (
          fileName.includes('sheet') ||
          fileName.includes('sprite') ||
          fileName.includes('atlas') ||
          fileName.includes('tileset')
        ) {
          detectSpriteSheet(assetPath)
        }
      }
    }
  }

  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    // Prevent the default scroll behavior
    e.preventDefault()

    // Determine the direction of the wheel
    const delta = Math.sign(e.deltaY) * -1

    // Calculate the new zoom level
    // Delta is either 1 or -1
    // For zoom in/out, change by 10% per wheel tick
    const zoomChange = delta * 10
    const newZoom = Math.max(10, Math.min(400, zoomLevel + zoomChange))

    // Update the zoom level
    setZoomLevel(newZoom)
  }

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

  // Add handler for sprite sheet config changes
  const handleSpriteSheetConfigChange = (field: keyof SpriteSheetConfig, value: number): void => {
    // Ensure value is at least 1
    const validValue = Math.max(1, value)

    setSpriteSheetConfig((prev) => ({
      ...prev,
      [field]: validValue
    }))

    // Re-detect the sprite sheet with the new configuration
    if (assetPath && isSpriteSheet) {
      detectSpriteSheet(assetPath)
    }
  }

  // Get image style for sprite sheet frames
  const getSpriteSheetImageStyle = (): React.CSSProperties => {
    if (
      !isSpriteSheet ||
      spriteSheetFrames.length === 0 ||
      !imageDimensions || // Ensure image metadata is loaded
      currentFrameIndex < 0 ||
      currentFrameIndex >= spriteSheetFrames.length
    ) {
      return {}
    }

    const currentDisplayFrame = spriteSheetFrames[currentFrameIndex]
    // Assuming all frames in a spritesheet share the same dimensions.
    // Use the first frame to determine the size of our "masking" viewport.
    const maskFrameDimensions = spriteSheetFrames[0]
    const zoom = zoomLevel / 100

    return {
      // Set the <img> element's dimensions to that of a single frame (the "mask").
      width: `${maskFrameDimensions.width}px`,
      height: `${maskFrameDimensions.height}px`,
      objectFit: 'none', // This is critical for objectPosition to work as intended.

      // Shift the full spritesheet image. The part of the image at
      // (currentDisplayFrame.x, currentDisplayFrame.y) will be aligned
      // with the top-left of our (now smaller) <img> element.
      // This animates the content within the mask.
      objectPosition: `-${currentDisplayFrame.x}px -${currentDisplayFrame.y}px`,

      // Apply zoom and pan transformations to the masked, animating frame.
      transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
      transformOrigin: 'top left' // Ensures transforms originate from the top-left of the mask.
    }
  }

  // Add a manual toggle for sprite sheet mode
  const toggleSpriteSheetMode = (): void => {
    if (isSpriteSheet) {
      // Turn off sprite sheet mode
      setIsSpriteSheet(false)
      setIsSpriteSheetFrames([])
      setShowSpriteSheetConfig(false)
    } else if (assetPath && imageDimensions) {
      // Turn on sprite sheet mode
      detectSpriteSheet(assetPath)
    }
  }

  // Add mouse down handler for starting panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Only start panning if we're zoomed in (zoomLevel > 100)
    if (zoomLevel <= 100) return

    // Set panning flag and capture start position
    setIsPanning(true)
    setStartPanPoint({ x: e.clientX, y: e.clientY })
  }

  // Add mouse move handler for panning
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Only pan if we're in panning mode
    if (!isPanning) return

    // Calculate the movement delta
    const dx = e.clientX - startPanPoint.x
    const dy = e.clientY - startPanPoint.y

    // Update the pan offset
    setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })

    // Update the start point for the next move
    setStartPanPoint({ x: e.clientX, y: e.clientY })
  }

  // Add mouse up/out handler to stop panning
  const handleMouseUp = (): void => {
    setIsPanning(false)
  }

  // Reset pan offset when zoom level or asset changes
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 })
  }, [zoomLevel, assetPath])

  // Get style for the image-container div
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle = getBackgroundStyle()
    return {
      ...baseStyle,
      cursor: isPanning ? 'grabbing' : zoomLevel > 100 ? 'grab' : 'default'
    }
  }

  if (!assetPath) {
    return (
      <div className="asset-preview empty-state">
        <p>No asset selected</p>
        <p className="text-sm text-muted-foreground">Select an image from the file tree</p>
      </div>
    )
  }

  // AUDIO PREVIEW: If the asset is an audio file, show an audio player
  if (isAudioFile(assetPath)) {
    return (
      <div className="asset-preview audio-preview">
        <div className="audio-meta">
          <Music style={{ marginRight: 8 }} />
          <span className="audio-filename">{assetPath.split('/').pop()}</span>
        </div>
        <audio controls style={{ width: '100%', marginTop: 16 }}>
          <source src={`asset://${assetPath}`} />
          Your browser does not support the audio element.
        </audio>
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
            {/* Add sprite sheet toggle button */}
            <button
              className="sprite-sheet-toggle"
              onClick={toggleSpriteSheetMode}
              title={isSpriteSheet ? 'Disable Sprite Sheet Mode' : 'Enable Sprite Sheet Mode'}
            >
              {isSpriteSheet ? 'Exit Sprite Sheet' : 'Sprite Sheet'}
            </button>
          </div>
        )}

        {/* Sprite Sheet Configuration */}
        {showSpriteSheetConfig && (
          <div className="sprite-sheet-config">
            <div className="config-title">Sprite Sheet Settings</div>
            <div className="config-controls">
              <label>
                Rows:
                <input
                  type="number"
                  min="1"
                  value={spriteSheetConfig.rows}
                  onChange={(e) =>
                    handleSpriteSheetConfigChange('rows', parseInt(e.target.value, 10))
                  }
                />
              </label>
              <label>
                Columns:
                <input
                  type="number"
                  min="1"
                  value={spriteSheetConfig.columns}
                  onChange={(e) =>
                    handleSpriteSheetConfigChange('columns', parseInt(e.target.value, 10))
                  }
                />
              </label>
              <button
                className="apply-button"
                onClick={() => {
                  if (assetPath) detectSpriteSheet(assetPath)
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Animation controls - only show if animation sequence detected */}
        {(isAnimationSequence || isSpriteSheet) && (
          <div className="animation-controls">
            <button className="icon-button" onClick={prevFrame} title="Previous Frame">
              <ChevronLeft size={16} />
            </button>

            <button
              className="icon-button"
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button className="icon-button" onClick={nextFrame} title="Next Frame">
              <ChevronRight size={16} />
            </button>

            <div className="speed-control">
              <Rewind size={14} />
              <input
                type="range"
                min="1"
                max="30"
                value={animationSpeed}
                onChange={handleSpeedChange}
                title={`Animation Speed: ${animationSpeed} FPS`}
              />
              <FastForward size={14} />
            </div>

            <div className="frame-counter">
              Frame {currentFrameIndex + 1} of{' '}
              {isSpriteSheet ? spriteSheetFrames.length : animationFrames.length}
            </div>
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={getContainerStyle()}
      >
        <img
          ref={imageRef}
          src={
            isSpriteSheet
              ? assetPath
              : isAnimationSequence
                ? animationFrames[currentFrameIndex]?.path
                : assetPath
          }
          alt={altText}
          className="preview-image"
          style={
            isSpriteSheet
              ? getSpriteSheetImageStyle()
              : {
                  // Set the image size based on zoom level while maintaining aspect ratio
                  width: imageDimensions
                    ? `${imageDimensions.width * (zoomLevel / 100)}px`
                    : 'auto',
                  height: imageDimensions
                    ? `${imageDimensions.height * (zoomLevel / 100)}px`
                    : 'auto',
                  transform:
                    zoomLevel > 100 ? `translate(${panOffset.x}px, ${panOffset.y}px)` : 'none'
                }
          }
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
