# TabWeave

TabWeave is a Chrome/Chromium browser extension that captures tab activity and turns it into a visual causal graph of your browsing sessions. It records interactions such as tab activation, navigation, and tab lineage, then stores them locally so you can inspect how your browsing flow evolved over time.

## What it does

- Tracks browser tab and navigation events in the background service worker
- Stores session and graph data locally with IndexedDB
- Visualizes the recorded graph in the extension popup with D3, including zoom, pan, and arrowed lineage edges
- Inspects a selected node's URL, status, parent/child tabs, and event counts, with one-click navigation to related nodes or opening the URL in a new tab
- Lets you refresh the graph or clear stored browsing data from the popup UI; clearing starts a fresh session seeded from the tabs that are currently open

## Tech stack

- React + TypeScript
- Vite for bundling
- Manifest V3 extension architecture
- D3 for force-directed graph rendering
- IndexedDB for local persistence

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development build:
   ```bash
   npm run dev
   ```
   This runs `vite build --watch` and rebuilds `dist/` on every change. There is no dev server, so reload the extension from chrome://extensions after a rebuild to pick up the new code.
3. Run the type checker:
   ```bash
   npm run typecheck
   ```
4. Build the extension bundle:
   ```bash
   npm run build
   ```

## Loading the extension locally

After building, load the unpacked extension from the dist folder in Chrome or Edge:

1. Open chrome://extensions (or edge://extensions)
2. Enable Developer mode
3. Click Load unpacked
4. Select the dist directory from this project

## Project structure

- src/background: extension background service worker and session tracking
- src/content: content script entrypoint
- src/popup: popup UI and graph view
- src/lib: database, graph, and utility modules
- public: manifest and extension assets

## Notes

The extension is currently focused on local, offline analysis of browsing behavior. No remote syncing or cloud storage is included yet.
