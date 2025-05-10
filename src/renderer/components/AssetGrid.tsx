import React, { useState, useEffect } from 'react'
import './AssetGrid.css'
import { FileText, Loader2, Music } from 'lucide-react'

// Import the FileTreeItem type from global window namespace
// @ts-ignore: The global window.api type is extended elsewhere
declare global {
  interface Window {
    api: any
  }
}

interface FileTreeItem {
  id: string
  name: string
  type: 'folder' | 'file'
  path?: string
  isAssetFolder?: boolean
  children?: FileTreeItem[]
}

interface AssetGridProps {
  folderPath?: string
  onAssetSelect: (assetPath: string) => void
}

interface AssetItem {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
}

// Helper to check if a file is audio
const isAudioFile = (filename: string): boolean => /\.(mp3|wav|ogg|m4a|flac)$/i.test(filename)

const AssetGrid: React.FC<AssetGridProps> = ({ folderPath, onAssetSelect }) => {
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<'name' | 'date' | 'size'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Function to fetch assets in the folder
  useEffect(() => {
    if (!folderPath) {
      setAssets([])
      return
    }

    const fetchAssets = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      setSelectedAssetId(null) // Clear selection when folder changes

      try {
        const result = await window.api.navigateToFolder(folderPath)

        if (result.success && result.children) {
          // Extract just the files (not folders) from the result
          const fileAssets = extractFileAssetsRecursively(result.children)
          setAssets(fileAssets)

          // Log for debugging
          console.log(`Loaded ${fileAssets.length} assets from ${folderPath}`)
        } else {
          setError(result.message || 'Failed to load assets')
        }
      } catch (err) {
        console.error('Error loading assets:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [folderPath])

  // Extract file assets recursively from the tree structure
  const extractFileAssetsRecursively = (items: FileTreeItem[]): AssetItem[] => {
    const result: AssetItem[] = []

    const processItems = (items: FileTreeItem[]): void => {
      items.forEach((item) => {
        if (item.type === 'file' && item.path) {
          result.push({
            id: item.id,
            name: item.name,
            path: item.path,
            type: 'file'
          })
        } else if (item.children && item.children.length > 0) {
          processItems(item.children)
        }
      })
    }

    processItems(items)
    return result
  }

  // Handle asset selection
  const handleAssetClick = (asset: AssetItem): void => {
    setSelectedAssetId(asset.id)
    onAssetSelect(asset.path)
  }

  // Handle asset right-click
  const handleAssetContextMenu = (e: React.MouseEvent, asset: AssetItem): void => {
    e.preventDefault()
    // @ts-ignore: showAssetContextMenu is available in preload
    window.api.showAssetContextMenu(asset.path)
  }

  // Sort assets based on the current sort option
  const sortedAssets = [...assets].sort((a, b) => {
    if (sortOption === 'name') {
      return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    // For now we're just implementing name sorting as required by the Epic
    // Other sorting options will be implemented in future tasks
    return 0
  })

  // Handle sort option change
  const handleSortChange = (option: 'name' | 'date' | 'size'): void => {
    if (option === sortOption) {
      // Toggle direction if clicking the same option
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortOption(option)
      setSortDirection('asc')
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number): void => {
    if (!assets.length) return

    if (e.key === 'ArrowRight') {
      const nextIndex = Math.min(index + 1, assets.length - 1)
      const nextAsset = sortedAssets[nextIndex]
      handleAssetClick(nextAsset)
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = Math.max(index - 1, 0)
      const prevAsset = sortedAssets[prevIndex]
      handleAssetClick(prevAsset)
    } else if (e.key === 'ArrowDown') {
      // Assuming a grid with 4 items per row
      const itemsPerRow = 4
      const nextRowIndex = Math.min(index + itemsPerRow, assets.length - 1)
      if (nextRowIndex < assets.length) {
        handleAssetClick(sortedAssets[nextRowIndex])
      }
    } else if (e.key === 'ArrowUp') {
      // Assuming a grid with 4 items per row
      const itemsPerRow = 4
      const prevRowIndex = Math.max(index - itemsPerRow, 0)
      handleAssetClick(sortedAssets[prevRowIndex])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <span>Loading assets...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full text-destructive">{error}</div>
    )
  }

  if (!folderPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
        <FileText className="h-12 w-12 mb-2 opacity-20" />
        <p>No folder selected</p>
        <p className="text-sm mt-2">Click the folder button above to select an asset folder</p>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
        <FileText className="h-12 w-12 mb-2 opacity-20" />
        <p>No assets found in this folder</p>
        <p className="text-sm mt-2">Try selecting a different folder</p>
      </div>
    )
  }

  return (
    <div className="asset-grid-container">
      {/* Sort controls */}
      <div className="asset-grid-controls">
        <span className="asset-count">{assets.length} assets</span>
        <div className="sort-controls">
          <button
            className={`sort-button ${sortOption === 'name' ? 'active' : ''}`}
            onClick={() => handleSortChange('name')}
          >
            Name {sortOption === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          {/* These will be implemented fully in a future task */}
          <button
            className={`sort-button ${sortOption === 'date' ? 'active' : ''}`}
            onClick={() => handleSortChange('date')}
          >
            Date {sortOption === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`sort-button ${sortOption === 'size' ? 'active' : ''}`}
            onClick={() => handleSortChange('size')}
          >
            Size {sortOption === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Asset grid */}
      <div className="asset-grid">
        {sortedAssets.map((asset, index) => (
          <div
            key={asset.id}
            className={`asset-item ${selectedAssetId === asset.id ? 'selected' : ''}`}
            onClick={() => handleAssetClick(asset)}
            onContextMenu={(e) => handleAssetContextMenu(e, asset)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={0}
          >
            <div className="asset-thumbnail">
              {/* Use actual image thumbnails when possible */}
              {asset.path && asset.path.match(/\.(png|jpe?g|gif|webp|svg)$/i) ? (
                <img
                  src={`asset://${asset.path}`}
                  alt={asset.name}
                  className="asset-image"
                  onError={(e) => {
                    console.error(`Failed to load thumbnail for ${asset.name}`)
                    // Replace with icon on error
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement
                      ?.querySelector('.asset-icon-fallback')
                      ?.classList.remove('hidden')
                  }}
                />
              ) : isAudioFile(asset.name) ? (
                <Music className="asset-icon" />
              ) : (
                <FileText className="asset-icon" />
              )}
            </div>
            <div className="asset-name" title={asset.name}>
              {asset.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AssetGrid
