import React, { useState, useRef } from 'react'
import './FileTreeSidebar.css'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../src/components/ui/collapsible'
import {
  ChevronRight,
  Folder as FolderIcon,
  FileText as FileIcon,
  FolderKanban
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
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level = 0, onAssetSelect }) => {
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === 'folder'
  const indentPadding = level * 20 // 20px per level
  const [isOpen, setIsOpen] = useState(false)

  // Determine which folder icon to use
  const CurrentFolderIcon = node.isAssetFolder ? FolderKanban : FolderIcon

  if (isFolder) {
    if (hasChildren) {
      return (
        <Collapsible
          open={isOpen}
          onOpenChange={(open) => {
            console.log('Collapsible state changed:', open)
            setIsOpen(open)
          }}
          className="tree-item-collapsible"
        >
          <CollapsibleTrigger asChild>
            <div
              style={{ paddingLeft: `${indentPadding}px`, cursor: 'pointer' }}
              className="flex items-center h-8 w-full text-sm hover:bg-muted/50 rounded-md"
            >
              <ChevronRight
                style={{
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out'
                }}
                className="h-4 w-4 mr-1.5 text-muted-foreground"
              />
              <CurrentFolderIcon className="h-4 w-4 mr-1.5 text-blue-500" />
              <span className="node-name truncate">{node.name}</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content">
            {node.children?.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                level={level + 1}
                onAssetSelect={onAssetSelect}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )
    } else {
      // Empty folder
      return (
        <div
          style={{ paddingLeft: `${indentPadding}px`, cursor: 'pointer' }}
          className="flex items-center h-8 w-full text-sm hover:bg-muted/50 rounded-md"
        >
          <span className="w-4 mr-1.5" /> {/* Spacer for alignment with chevron */}
          <CurrentFolderIcon className="h-4 w-4 mr-1.5 text-blue-500" />
          <span className="node-name truncate">{node.name}</span>
        </div>
      )
    }
  }

  // File node - update to handle click for asset selection
  return (
    <div
      style={{ paddingLeft: `${indentPadding}px`, cursor: 'pointer' }}
      className="flex items-center h-8 w-full text-sm hover:bg-muted/50 rounded-md"
      onClick={() => onAssetSelect && node.path && onAssetSelect(node.path)}
    >
      <span className="w-4 mr-1.5" /> {/* Spacer for alignment with chevron */}
      <FileIcon className="h-4 w-4 mr-1.5 text-foreground/70" />
      <span className="node-name truncate">{node.name}</span>
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
  const sidebarRef = useRef<HTMLDivElement>(null)

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
    <div
      ref={sidebarRef}
      className="file-tree-sidebar p-2 space-y-0.5 text-sm select-none"
      style={{ width: '280px', position: 'relative' }}
    >
      {/* Folder Picker Button */}
      <FolderPicker onFolderSelect={handleFolderSelect} onError={showErrorMessage} />

      {/* File Tree */}
      <div className="file-tree-container">
        {fileTree.map((node) => (
          <TreeItem key={node.id} node={node} level={0} onAssetSelect={onAssetSelect} />
        ))}
      </div>

      {/* Error message */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  )
}

export default FileTreeSidebar
