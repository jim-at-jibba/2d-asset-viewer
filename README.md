# 2D Asset Viewer

A lightweight desktop application for game developers to view, organize, and preview 2D sprite assets.

![Asset Viewer Screenshot](resources/icon.png)

## Demo

https://github.com/jim-at-jibba/asset-viewer/assets/demo.mp4

_A video demonstration of Asset Viewer in action. Replace this with your actual demo recording._

## What It Does

Asset Viewer is an Electron-based application that helps game developers manage their 2D sprite assets. Key features include:

- **File System Navigation:** Browse your computer's folders to locate sprite assets
- **Asset Preview:** View sprite images with transparency support and background customization
- **Animation Detection:** Automatically detect frame-based animation sequences
- **Sprite Sheet Support:** View sprite sheets with configurable rows and columns
- **Animation Playback:** Play, pause, and control animation sequences
- **Asset Grid:** View all assets in a folder with sorting options
- **Drag and Drop:** Quickly navigate to folders by drag-and-drop

This tool is designed to simplify the workflow of game developers and artists working with 2D sprites by providing a dedicated viewer tailored to their needs.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/asset-viewer.git
cd asset-viewer

# Install dependencies with npm
npm install

# Or with pnpm (recommended)
pnpm install
```

### Available Commands

The project uses pnpm as its primary package manager, but npm commands will work too. Here's a complete list of available commands:

```bash
# Development
pnpm dev                # Start the app in development mode with hot reload
pnpm start              # Preview the built app in production mode

# Code Quality
pnpm format             # Format all files with Prettier
pnpm lint               # Run ESLint
pnpm typecheck:node     # Run TypeScript check for Node.js code
pnpm typecheck:web      # Run TypeScript check for web code
pnpm typecheck          # Run all TypeScript checks

# Building
pnpm build              # Build the app for the current platform
pnpm build:unpack       # Build without packaging into an installer
pnpm build:win          # Build for Windows
pnpm build:mac          # Build for macOS
pnpm build:linux        # Build for Linux
```

If you prefer npm, just replace `pnpm` with `npm run` in the commands above.

### Running the Application

```bash
# Start in development mode with hot reload
pnpm dev
```

The development server will start and the application window should open automatically.

### Building for Distribution

```bash
# For Windows
pnpm build:win

# For macOS
pnpm build:mac

# For Linux
pnpm build:linux
```

The built application will be available in the `dist` directory.

## Usage

1. Launch the application
2. Click the folder icon in the sidebar to select a folder containing sprite assets
3. Browse the folder structure in the sidebar
4. Click on any image to preview it in the main pane
5. Use the controls at the top of the preview pane to adjust background, zoom, or play animations
6. Sort assets using the controls above the asset grid

## Development Status

**Important Note:** This application was built very quickly with the assistance of AI tools. While it's functional for basic use cases, it has not undergone extensive testing or refinement. There are likely edge cases and bugs that haven't been addressed.

The code is provided as-is, and I'm unlikely to fix any bugs that are reported unless they affect my own workflow directly. Feel free to fork the repository and make improvements as needed.

## Project Structure

```
asset-viewer/
├── src/
│   ├── main/             # Electron main process
│   ├── preload/          # Preload scripts
│   └── renderer/         # React frontend
│       ├── components/   # React components
│       └── src/          # App logic and UI
├── resources/            # App resources
└── build/                # Build configuration
```

## System Requirements

- **Windows:** Windows 10 or newer
- **macOS:** macOS 10.14 (Mojave) or newer
- **Linux:** Ubuntu 18.04 or newer, or equivalent

## Technologies Used

- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [electron-vite](https://electron-vite.org/)

## License

This project is available for free use, modification, and distribution. Use it however you want to. No warranties or guarantees are provided.

## Contributions

While I'm not actively maintaining this project, feel free to fork it and make your own improvements. If you find it useful, consider sharing your enhancements with others.
