import { useState } from 'react'
import FileTreeSidebar from '../components/FileTreeSidebar'
import AssetPreview from '../components/AssetPreview'
import AssetGrid from '../components/AssetGrid'

function App(): React.JSX.Element {
  const [selectedAssetPath, setSelectedAssetPath] = useState<string | undefined>(undefined)
  const [currentFolderPath, setCurrentFolderPath] = useState<string | undefined>(undefined)

  // Function to handle asset selection
  const handleAssetSelect = (assetPath: string): void => {
    console.log('Asset selected:', assetPath)
    // Add the asset:// protocol to the path
    setSelectedAssetPath(`asset://${assetPath}`)
  }

  // Function to handle folder selection
  const handleFolderSelect = (folderPath: string): void => {
    console.log('Folder selected:', folderPath)
    setCurrentFolderPath(folderPath)
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* File tree sidebar */}
      <FileTreeSidebar onAssetSelect={handleAssetSelect} onFolderSelect={handleFolderSelect} />

      {/* Main content area */}
      <main className="flex-1 p-4 overflow-hidden flex flex-col">
        {/* Asset grid */}
        <div className="mb-4 flex-1 overflow-hidden border border-border rounded-md">
          <AssetGrid folderPath={currentFolderPath} onAssetSelect={handleAssetSelect} />
        </div>

        {/* Asset preview area */}
        <div className="flex-1 overflow-hidden border border-border rounded-md">
          <AssetPreview assetPath={selectedAssetPath} />
        </div>
      </main>
    </div>
  )
}

export default App
