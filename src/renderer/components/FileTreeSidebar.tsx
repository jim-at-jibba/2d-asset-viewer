import React from 'react'
import './FileTreeSidebar.css'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../src/components/ui/collapsible'

interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: TreeNode[]
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

  if (isFolder && hasChildren) {
    return (
      <Collapsible defaultOpen={false} className="tree-item-collapsible">
        <div style={{ paddingLeft: `${level * 20}px` }} className="tree-item">
          <CollapsibleTrigger asChild>
            <div className={`tree-node ${node.type} cursor-pointer`}>
              <span className="node-icon">📁</span>
              <span className="node-name">{node.name}</span>
            </div>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent style={{ paddingLeft: `${level * 20}px` }}>
          <div className="tree-children pl-[20px]">
            {node.children?.map((child) => (
              <TreeItem key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // File node or empty folder node
  return (
    <div style={{ paddingLeft: `${level * 20}px` }} className="tree-item">
      <div className={`tree-node ${node.type}`}>
        <span className="expansion-arrow w-4 mr-1"> </span>
        <span className="node-icon">{isFolder ? '📁' : '📄'}</span>
        <span className="node-name">{node.name}</span>
      </div>
    </div>
  )
}

const FileTreeSidebar: React.FC = (): React.ReactElement => {
  const [fileTree] = React.useState<TreeNode[]>(mockFileSystem)

  return (
    <div className="file-tree-sidebar">
      <h3>File Explorer</h3>
      {fileTree.map((node) => (
        <TreeItem key={node.id} node={node} />
      ))}
    </div>
  )
}

export default FileTreeSidebar
