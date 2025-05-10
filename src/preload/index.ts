import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  navigateToFolder: (folderPath: string) => ipcRenderer.invoke('navigate-to-folder', folderPath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getAnimationFrames: (folderPath: string, baseName: string, extension: string) =>
    ipcRenderer.invoke('get-animation-frames', folderPath, baseName, extension),
  showAssetContextMenu: (assetPath: string) =>
    ipcRenderer.invoke('show-asset-context-menu', assetPath),
  copyAssetPath: (assetPath: string) => ipcRenderer.invoke('copy-asset-path', assetPath),
  copyAssetFile: (assetPath: string) => ipcRenderer.invoke('copy-asset-file', assetPath),
  showAssetInFolder: (assetPath: string) => ipcRenderer.invoke('show-asset-in-folder', assetPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
