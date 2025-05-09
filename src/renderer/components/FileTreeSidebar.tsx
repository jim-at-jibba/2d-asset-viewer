import React from 'react'
import './FileTreeSidebar.css'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../src/components/ui/collapsible'
import { ChevronRight, Folder as FolderIcon, FileText as FileIcon } from 'lucide-react' // Adjusted import path if necessary

interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: TreeNode[]
  // Potentially add isAssetFolder or other indicators later
}

// Mock data - replace with actual file system logic
const mockFileSystem: TreeNode[] = [
  {
    id: '1',
    name: 'Project Root',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'assets',
        type: 'folder',
        children: [
          {
            id: '3',
            name: 'sprites',
            type: 'folder',
            children: [
              { id: '4', name: 'player.png', type: 'file' },
              { id: '5', name: 'enemy.png', type: 'file' }
            ]
          },
          {
            id: '6',
            name: 'tilesets',
            type: 'folder',
            children: [{ id: '7', name: 'ground.png', type: 'file' }]
          }
        ]
      },
      {
        id: '8',
        name: 'src',
        type: 'folder',
        children: [
          { id: '9', name: 'index.ts', type: 'file' },
          { id: '10', name: 'App.tsx', type: 'file' }
        ]
      },
      { id: '11', name: 'package.json', type: 'file' }
    ]
  }
]

interface TreeItemProps {
  node: TreeNode
  level?: number
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level = 0 }) => {
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === 'folder'
  const indentPadding = level * 20 // 20px per level

  if (isFolder) {
    if (hasChildren) {
      return (
        <Collapsible defaultOpen={false} className="tree-item-collapsible">
          <CollapsibleTrigger asChild>
            <div
              style={{ paddingLeft: `${indentPadding}px` }}
              className="group flex items-center h-8 w-full text-sm hover:bg-muted/50 cursor-pointer rounded-md" // Adjusted styling
            >
              <ChevronRight className="h-4 w-4 mr-1.5 text-muted-foreground transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-90" />
              <FolderIcon className="h-4 w-4 mr-1.5 text-blue-500" />
              <span className="node-name truncate">{node.name}</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content">
            {/* Children TreeItem components will handle their own padding based on level + 1 */}
            {node.children?.map((child) => (
              <TreeItem key={child.id} node={child} level={level + 1} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )
    } else {
      // Empty folder
      return (
        <div
          style={{ paddingLeft: `${indentPadding}px` }}
          className="flex items-center h-8 w-full text-sm hover:bg-muted/50 rounded-md" // Adjusted styling
        >
          <span className="w-4 mr-1.5" /> {/* Spacer for alignment with chevron */}
          <FolderIcon className="h-4 w-4 mr-1.5 text-blue-500" />
          <span className="node-name truncate">{node.name}</span>
        </div>
      )
    }
  }

  // File node
  return (
    <div
      style={{ paddingLeft: `${indentPadding}px` }}
      className="flex items-center h-8 w-full text-sm hover:bg-muted/50 rounded-md" // Adjusted styling
    >
      <span className="w-4 mr-1.5" /> {/* Spacer for alignment with chevron */}
      <FileIcon className="h-4 w-4 mr-1.5 text-foreground/70" />
      <span className="node-name truncate">{node.name}</span>
    </div>
  )
}

const FileTreeSidebar: React.FC = (): React.ReactElement => {
  const [fileTree] = React.useState<TreeNode[]>(mockFileSystem) // In a real app, this would come from props or a global state/API call

  return (
    <div
      className="file-tree-sidebar p-2 space-y-0.5 text-sm select-none"
      style={{ width: '280px' /* Example width */ }}
    >
      {/* <h3 className="px-2 py-1.5 text-lg font-semibold tracking-tight">File Explorer</h3> */}
      {fileTree.map((node) => (
        <TreeItem key={node.id} node={node} level={0} /> // Start top-level items at level 0
      ))}
    </div>
  )
}

export default FileTreeSidebar
