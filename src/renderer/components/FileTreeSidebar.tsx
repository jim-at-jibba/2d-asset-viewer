import React, { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../src/components/ui/collapsible'
import { Alert, AlertDescription } from '../src/components/ui/alert'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from '../src/components/ui/sidebar'
import { ScrollArea } from '../src/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../src/components/ui/tooltip'
import { cn } from '../src/lib/utils'
import {
  ChevronRight,
  Folder as FolderIcon,
  FileText as FileIcon,
  FolderKanban,
  AlertCircle
} from 'lucide-react'
import FolderPicker from './FilePicker'

interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: TreeNode[]
  isAssetFolder?: boolean
  path?: string
}

interface TreeItemProps {
  node: TreeNode
  level?: number
  onAssetSelect?: (assetPath: string) => void
  onFolderSelect?: (folderPath: string) => void
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level = 0, onAssetSelect, onFolderSelect }) => {
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === 'folder'
  const indentPadding = level * 20 // 20px per level
  const [isOpen, setIsOpen] = useState(false)

  // Determine which folder icon to use
  const CurrentFolderIcon = node.isAssetFolder ? FolderKanban : FolderIcon

  // Handle folder selection
  const handleFolderClick = (e: React.MouseEvent): void => {
    if (isFolder && node.path && onFolderSelect) {
      // Stop propagation to prevent the collapsible trigger from also handling this
      e.stopPropagation()
      onFolderSelect(node.path)
    }
  }

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault()
    if (node.path) {
      // @ts-ignore: showAssetContextMenu is available in preload
      window.api.showAssetContextMenu(node.path)
    }
  }

  // Render folder item with children
  if (isFolder && hasChildren) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={(open) => {
          console.log('Collapsible state changed:', open)
          setIsOpen(open)
        }}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div
            style={{ paddingLeft: `${indentPadding}px` }}
            className={cn(
              'flex items-center h-8 w-full text-sm rounded-md cursor-pointer',
              'hover:bg-muted/50 transition-colors'
            )}
            onContextMenu={handleContextMenu}
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 mr-1.5 transition-transform duration-200',
                isOpen && 'rotate-90'
              )}
            />
            <div onClick={handleFolderClick} className="flex items-center flex-1 overflow-hidden">
              <CurrentFolderIcon className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate">
                    {' '}
                    {node.name.length > 20 ? node.name.slice(0, 20) + '...' : node.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">{node.name}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onAssetSelect={onAssetSelect}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Empty folder
  if (isFolder) {
    return (
      <div
        style={{ paddingLeft: `${indentPadding}px` }}
        className={cn(
          'flex items-center h-8 w-full text-sm rounded-md cursor-pointer',
          'hover:bg-muted/50 transition-colors'
        )}
        onClick={handleFolderClick}
        onContextMenu={handleContextMenu}
      >
        <span className="w-4 mr-1.5" /> {/* Spacer for alignment with chevron */}
        <CurrentFolderIcon className="h-4 w-4 mr-1.5 flex-shrink-0 text-blue-500" />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate">{node.name}</span>
          </TooltipTrigger>
          <TooltipContent side="right">{node.name}</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  // File node
  return (
    <div
      style={{ paddingLeft: `${indentPadding}px` }}
      className={cn(
        'flex items-center h-8 w-full text-sm rounded-md cursor-pointer',
        'hover:bg-muted/50 transition-colors'
      )}
      onClick={() => onAssetSelect && node.path && onAssetSelect(node.path)}
      onContextMenu={handleContextMenu}
    >
      <span className="w-4 mr-1.5" /> {/* Spacer for alignment with chevron */}
      <FileIcon className="h-4 w-4 mr-1.5 flex-shrink-0 text-foreground/70" />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="truncate">{node.name}</span>
        </TooltipTrigger>
        <TooltipContent side="right">{node.name}</TooltipContent>
      </Tooltip>
    </div>
  )
}

// Import the FileTreeItem type from preload
declare interface FileTreeItem {
  id: string
  name: string
  type: 'folder' | 'file'
  path?: string
  isAssetFolder?: boolean
  children?: FileTreeItem[]
}

interface FileTreeSidebarProps {
  onAssetSelect?: (assetPath: string) => void
  onFolderSelect?: (folderPath: string) => void
}

const FileTreeSidebar: React.FC<FileTreeSidebarProps> = ({
  onAssetSelect,
  onFolderSelect
}): React.ReactElement => {
  const [fileTree, setFileTree] = useState<TreeNode[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Handle folder selection from the FolderPicker component
  const handleFolderSelect = async (folderPath: string): Promise<void> => {
    try {
      const result = await window.api.navigateToFolder(folderPath)
      console.log('Navigation result:', result)

      if (result.success && result.folderPath) {
        console.log('Successfully navigated to:', result.folderPath)

        // Recursive function to map API response to TreeNode structure
        const mapToTreeNode = (item: FileTreeItem): TreeNode => {
          return {
            id: item.id,
            name: item.name,
            type: item.type,
            isAssetFolder: item.type === 'folder' ? true : undefined,
            children: item.children?.map(mapToTreeNode) || undefined,
            path: item.path
          }
        }

        // Create a proper folder structure to add to the tree
        const newNode: TreeNode = {
          id: `folder-${Date.now()}`,
          name: result.folderName || folderPath.split(/[/\\]/).pop() || 'Selected Folder',
          type: 'folder',
          isAssetFolder: true,
          children: result.children?.map(mapToTreeNode) || [],
          path: result.folderPath
        }

        // Log the node we're adding to help debug
        console.log('Adding new folder node to tree:', newNode)

        // Update the file tree with the new node
        setFileTree((prevTree) => [...prevTree, newNode])

        // Notify parent component about folder selection
        if (onFolderSelect) {
          onFolderSelect(result.folderPath)
        }
      } else {
        console.error('Failed to navigate to folder:', result.message)
        showErrorMessage(result.message || 'Failed to navigate to folder')
      }
    } catch (error) {
      console.error('Error during folder navigation:', error)
      showErrorMessage('An unexpected error occurred')
    }
  }

  // Helper to show error message
  const showErrorMessage = (message: string): void => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  return (
    <TooltipProvider>
      <Sidebar className="min-w-[400px] border-r border-border">
        <SidebarHeader className="px-4 py-2">
          <FolderPicker onFolderSelect={handleFolderSelect} onError={showErrorMessage} />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Asset Folders</SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="px-1 py-2">
                  {fileTree.map((node) => (
                    <TreeItem
                      key={node.id}
                      node={node}
                      level={0}
                      onAssetSelect={onAssetSelect}
                      onFolderSelect={onFolderSelect}
                    />
                  ))}
                </div>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Error message */}
        {errorMessage && (
          <Alert
            variant="destructive"
            className="fixed bottom-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </Sidebar>
    </TooltipProvider>
  )
}

export default FileTreeSidebar
