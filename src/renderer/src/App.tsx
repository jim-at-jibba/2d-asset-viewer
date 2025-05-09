import { useState } from 'react'
import FileTreeSidebar from '../components/FileTreeSidebar'
import AssetPreview from '../components/AssetPreview'

function App(): React.JSX.Element {
  const [selectedAssetPath, setSelectedAssetPath] = useState<string | undefined>(undefined)

  // Function to handle asset selection
  const handleAssetSelect = (assetPath: string): void => {
    console.log('Asset selected:', assetPath)
    // Add the asset:// protocol to the path
    setSelectedAssetPath(`asset://${assetPath}`)
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* File tree sidebar */}
      <FileTreeSidebar onAssetSelect={handleAssetSelect} />

      {/* Main content area */}
      <main className="flex-1 p-4 overflow-hidden flex flex-col">
        {/* Asset preview area */}
        <div className="flex-1 overflow-hidden border border-border rounded-md">
          <AssetPreview assetPath={selectedAssetPath} />
        </div>
      </main>
    </div>
  )
}

export default App
