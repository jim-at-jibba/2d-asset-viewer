import React, { useState, useEffect, useRef, useCallback } from 'react'
import './AssetPreview.css'
import { Play, Pause, ChevronLeft, ChevronRight, FastForward, Rewind } from 'lucide-react'

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

  // Animation related states
  const [isAnimationSequence, setIsAnimationSequence] = useState<boolean>(false)
  const [animationFrames, setAnimationFrames] = useState<AnimationFrame[]>([])
  const [spriteSheetFrames, setIsSpriteSheetFrames] = useState<SpriteSheetFrame[]>([])
  const [isSpriteSheet, setIsSpriteSheet] = useState<boolean>(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [animationSpeed, setAnimationSpeed] = useState<number>(10) // frames per second
  const animationTimerRef = useRef<number | null>(null)

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

    try {
      // First check if this is a sprite sheet by looking for special naming patterns
      // For example: "character_sheet.png" or "animation_spritesheet.png"
      if (
        currentAssetPath.toLowerCase().includes('sheet') ||
        currentAssetPath.toLowerCase().includes('sprite')
      ) {
        await detectSpriteSheet(currentAssetPath)
        return
      }

      // Otherwise, look for sequence patterns in the filename
      const fileName = currentAssetPath.split('/').pop() || ''
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
      // filePath would be used in a real implementation to load metadata
      console.log(`Detecting sprite sheet from: ${filePath}`)

      // In a real implementation, we would:
      // 1. Check if there's a metadata JSON file with the same name that describes the frames
      // 2. Or use some heuristics to detect uniform grid patterns in the image

      // For demo purposes, we'll assume a simple grid layout
      if (imageRef.current && imageDimensions) {
        const imgWidth = imageDimensions.width
        const imgHeight = imageDimensions.height

        // Assume frames are arranged in a grid
        // For demo, we'll assume 4 rows x 4 columns
        const framesPerRow = 4
        const numRows = 4

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
    if (imageRef.current) {
      // Store the natural (actual) dimensions of the image
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      })

      // If this is a potential sprite sheet, try to detect frames
      if (
        assetPath &&
        (assetPath.toLowerCase().includes('sheet') || assetPath.toLowerCase().includes('sprite'))
      ) {
        detectSpriteSheet(assetPath)
      }
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

  // Get image style for sprite sheet frames
  const getSpriteSheetImageStyle = (): React.CSSProperties => {
    if (!isSpriteSheet || spriteSheetFrames.length === 0 || !imageDimensions) {
      return {}
    }

    const frame = spriteSheetFrames[currentFrameIndex]

    return {
      width: `${frame.width * (zoomLevel / 100)}px`,
      height: `${frame.height * (zoomLevel / 100)}px`,
      objectFit: 'none',
      objectPosition: `-${frame.x * (zoomLevel / 100)}px -${frame.y * (zoomLevel / 100)}px`,
      transform: `scale(${zoomLevel / 100})`,
      transformOrigin: 'top left'
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
        style={getBackgroundStyle()}
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
                    : 'auto'
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
