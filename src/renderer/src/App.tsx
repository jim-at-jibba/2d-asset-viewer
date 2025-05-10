import { useState } from 'react'
import FileTreeSidebar from '../components/FileTreeSidebar'
import AssetPreview from '../components/AssetPreview'
import AssetGrid from '../components/AssetGrid'
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar'

function App(): React.JSX.Element {
  const [selectedAssetPath, setSelectedAssetPath] = useState<string | undefined>(undefined)
  const [currentFolderPath, setCurrentFolderPath] = useState<string | undefined>(undefined)
  const [activeFolderName, setActiveFolderName] = useState<string | undefined>(undefined)

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

    // Extract the folder name from the path for display purposes
    const folderName = folderPath.split(/[/\\]/).pop()
    setActiveFolderName(folderName)
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background text-foreground">
        {/* File tree sidebar */}
        <FileTreeSidebar onAssetSelect={handleAssetSelect} onFolderSelect={handleFolderSelect} />

        {/* Main content area */}
        <main className="flex-1 flex flex-col h-screen p-4 overflow-hidden">
          {/* Sidebar Trigger */}
          <div className="mb-2 flex-none">
            <SidebarTrigger className="ml-2" />
          </div>

          {/* Asset grid - takes 60% of the available space */}
          <div className="flex-1 overflow-hidden border border-border rounded-md min-h-[100px] w-full">
            <div className="p-2 border-b border-border flex items-center">
              <h2 className="text-lg font-semibold">{activeFolderName || 'No folder selected'}</h2>
            </div>
            <div className="h-[calc(100%-40px)] overflow-auto flex">
              <AssetGrid folderPath={currentFolderPath} onAssetSelect={handleAssetSelect} />
            </div>
          </div>

          {/* Asset preview area - takes 40% of the available space */}
          <div className="flex-1 mt-4 overflow-hidden border border-border rounded-md min-h-[100px]">
            <AssetPreview assetPath={selectedAssetPath} folderPath={currentFolderPath} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default App
