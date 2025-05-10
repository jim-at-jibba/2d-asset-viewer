import { ElectronAPI } from '@electron-toolkit/preload'

interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: TreeNode[]
  isAssetFolder?: boolean
}

// Define a recursive type for file tree items
interface FileTreeItem {
  id: string
  name: string
  type: 'folder' | 'file'
  path?: string
  isAssetFolder?: boolean
  children?: FileTreeItem[]
}

interface API {
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
  showAssetContextMenu: (assetPath: string) => Promise<void>
  copyAssetPath: (assetPath: string) => Promise<void>
  copyAssetFile: (assetPath: string) => Promise<void>
  showAssetInFolder: (assetPath: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
