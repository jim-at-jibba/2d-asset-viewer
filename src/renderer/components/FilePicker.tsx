import React from 'react'
import { FolderOpen } from 'lucide-react'

interface FolderPickerProps {
  onFolderSelect: (folderPath: string) => void
  onError: (message: string) => void
}

const FolderPicker: React.FC<FolderPickerProps> = ({ onFolderSelect, onError }) => {
  // Handle folder selection dialog
  const handleSelectFolder = async (): Promise<void> => {
    try {
      const result = await window.api.selectFolder()
      console.log('Folder selection result:', result)

      if (result.success && result.folderPath) {
        onFolderSelect(result.folderPath)
      } else {
        onError(result.message || 'Failed to select folder')
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
      onError('An error occurred while selecting a folder')
    }
  }

  return (
    <button
      onClick={handleSelectFolder}
      className="browse-folder-button"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        backgroundColor: '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        cursor: 'pointer',
        margin: '8px auto',
        width: 'calc(100% - 16px)',
        color: '#4f46e5',
        fontWeight: 500,
        fontSize: '0.875rem'
      }}
    >
      <FolderOpen style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
      Browse for folder...
    </button>
  )
}

export default FolderPicker
