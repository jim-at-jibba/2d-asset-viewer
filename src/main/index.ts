import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, normalize, extname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { existsSync, statSync, readdirSync } from 'fs'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Handle getting paths from drag events
  ipcMain.handle('drag-dropped-files', async () => {
    try {
      // In some cases, we need to use a workaround to get file paths from drag events
      // This is a placeholder - in a real implementation, you'd need to capture these paths
      // when they're first dragged into the app window

      // For now, let's just return an empty array as we'll be relying on the renderer's path access
      console.log('Requesting drag-dropped files from main process')
      return []
    } catch (error: unknown) {
      console.error('Error handling drag-dropped-files:', error)
      return []
    }
  })

  // Handle folder selection dialog
  ipcMain.handle('select-folder', async () => {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow()
      if (!mainWindow) {
        return { success: false, message: 'No active window found' }
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Folder to Navigate',
        buttonLabel: 'Select Folder'
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'Folder selection canceled' }
      }

      const folderPath = result.filePaths[0]
      console.log('Selected folder path:', folderPath)

      return { success: true, folderPath }
    } catch (error: unknown) {
      console.error('Error selecting folder:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, message: errorMessage }
    }
  })

  // Define the recursive type first
  interface FileTreeItem {
    id: string
    name: string
    type: 'folder' | 'file'
    path: string
    isAssetFolder?: boolean
    children?: FileTreeItem[]
  }

  // Handle folder navigation
  ipcMain.handle('navigate-to-folder', async (_, folderPath) => {
    try {
      console.log('Received folder path:', folderPath, 'Type:', typeof folderPath)

      // Validate the folder path with better error messaging
      if (!folderPath || typeof folderPath !== 'string') {
        return { success: false, message: 'No folder path provided or invalid path type' }
      }

      // Normalize the path using Node's path module
      const normalizedPath = normalize(folderPath)
      console.log('Normalized path:', normalizedPath)

      if (!existsSync(normalizedPath)) {
        return { success: false, message: `Path does not exist: ${normalizedPath}` }
      }

      try {
        const stats = statSync(normalizedPath)
        if (!stats.isDirectory()) {
          return {
            success: false,
            message: 'Selected item is not a directory. Please select a folder.'
          }
        }
      } catch (statError) {
        console.error('Error checking if path is directory:', statError)
        return { success: false, message: 'Unable to determine if path is a directory' }
      }

      // Function to scan directory and build tree structure
      const scanDirectory = (
        dirPath: string,
        depth = 0,
        maxDepth = 5 // Limit recursion depth for performance
      ): FileTreeItem[] => {
        try {
          // If we've reached maximum depth, stop recursion
          if (depth > maxDepth) {
            console.log(`Max depth reached at ${dirPath}, stopping recursion`)
            return []
          }

          console.log(`Scanning directory at depth ${depth}: ${dirPath}`)
          const entries = readdirSync(dirPath, { withFileTypes: true })
          console.log(`Found ${entries.length} entries in ${dirPath}`)

          const items = entries
            .map((entry) => {
              const entryPath = join(dirPath, entry.name)

              if (entry.isDirectory()) {
                console.log(`Found subdirectory: ${entry.name} at path ${entryPath}`)
                // Recursively scan subdirectories
                const subDirItems = scanDirectory(entryPath, depth + 1, maxDepth)
                console.log(`Subdirectory ${entry.name} has ${subDirItems.length} items`)

                return {
                  id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: entry.name,
                  type: 'folder' as const,
                  isAssetFolder: true,
                  path: entryPath,
                  children: subDirItems
                }
              } else {
                // Only include image files
                const ext = extname(entry.name).toLowerCase()
                const isImageFile = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)

                if (isImageFile) {
                  console.log(`Found image file: ${entry.name}`)
                  return {
                    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: entry.name,
                    type: 'file' as const,
                    path: entryPath
                  }
                }
                return null
              }
            })
            .filter(Boolean) // Remove null entries (non-image files)

          console.log(`Returning ${items.length} items from ${dirPath}`)
          return items as FileTreeItem[]
        } catch (err) {
          console.error(`Error scanning directory ${dirPath}:`, err)
          return []
        }
      }

      // Get the folder name from the path
      const folderName = normalizedPath.split(/[/\\]/).pop() || 'Selected Folder'

      // Scan top-level contents
      console.log('Starting recursive directory scan for:', normalizedPath)
      const children = scanDirectory(normalizedPath)
      console.log(`Completed scan, found ${children.length} top-level items`)

      // Log detailed tree structure up to 3 levels for debugging
      const logTreeStructure = (items: FileTreeItem[], level = 0, maxLevel = 3): void => {
        if (level > maxLevel) return

        items.forEach((item) => {
          console.log(
            '  '.repeat(level) +
              `- ${item.type}: ${item.name} (${item.children?.length || 0} children)`
          )
          if (item.children && item.children.length > 0) {
            logTreeStructure(item.children, level + 1, maxLevel)
          }
        })
      }

      console.log('File tree structure:')
      logTreeStructure(children)

      // Return success with folder path and structure data
      return {
        success: true,
        folderPath: normalizedPath,
        folderName: folderName,
        children: children
      }
    } catch (error: unknown) {
      console.error('Error navigating to folder:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, message: errorMessage }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
