# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Start development mode with hot reload
npm run dev

# Format code with Prettier
npm run format

# Run ESLint
npm run lint

# Run type checking for node and web separately
npm run typecheck:node
npm run typecheck:web

# Run all type checking
npm run typecheck

# Preview the application in production mode
npm run start
```

### Building

```bash
# Build for current platform
npm run build

# Build without packaging
npm run build:unpack

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Project Architecture

Asset Viewer is an Electron application built with React and TypeScript. It allows game developers to view and manage 2D sprite assets, with features like folder navigation, asset previews, and animation sequence detection.

### Key Components

1. **Main Process (Electron)**
   - `src/main/index.ts`: Initializes the Electron app, sets up IPC communication, and handles file system operations.
   - Registers a custom `asset://` protocol for secure local file access.
   - Implements IPC handlers for folder navigation and asset detection.

2. **Renderer Process (React)**
   - `src/renderer/src/App.tsx`: Main React component that orchestrates the overall UI layout.
   - `src/renderer/components/FileTreeSidebar.tsx`: Displays a collapsible folder tree for navigation.
   - `src/renderer/components/AssetGrid.tsx`: Shows a grid of available sprite assets in the selected folder.
   - `src/renderer/components/AssetPreview.tsx`: Displays the selected asset with preview features (zoom, transparency).

3. **IPC Communication**
   - Communication between the main and renderer processes happens via IPC channels:
     - `select-folder`: Opens a system folder picker dialog
     - `navigate-to-folder`: Scans a directory and returns file structure
     - `get-animation-frames`: Detects animation frame sequences

4. **UI Architecture**
   - Uses a combination of custom components and UI primitives from the Radix UI library.
   - Styled with Tailwind CSS.
   - Components include modular sidebar, asset grid, and preview areas.

### Data Flow

1. User selects a folder through the sidebar
2. Main process scans the folder and returns file structure
3. Renderer displays assets in the grid component
4. User selects an asset from the grid
5. Selected asset is displayed in the preview component
6. If animation sequence is detected, playback controls are enabled

## Feature Implementation Status

The application is implementing features based on user stories in `tasks.md`. Currently implemented features include:

- File system navigation with a folder tree
- Asset grid with sorting options
- Transparency rendering in the preview component
- Background customization for transparency
- Asset preview with zoom capabilities
- Detection of animation sequences

Features in progress include:

- Mouse wheel zoom and pan controls
- Animation playback for sprite sheets and frame-by-frame animations
- Asset metadata display
- Thumbnail generation and caching

## Code Patterns

- **Component Composition**: UI is built from composable React components
- **State Management**: Uses React's built-in state hooks
- **IPC Communication**: Follows Electron's IPC pattern for main/renderer process communication
- **File System Operations**: File operations are performed in the main process for security
- **Error Handling**: Uses try/catch blocks with user-friendly error messages

When making changes to the codebase, follow these patterns and maintain consistency with the existing code style.