# AURA Desktop

AURA Desktop wraps the existing AURA V2 Node server in Electron.

## Development

Install dependencies:

```bash
npm install
```

Run the desktop application:

```bash
npm run desktop
```

The Electron process starts AURA's existing `server.js` on a free localhost port and loads the existing `public/` application. The backend remains the source of truth for AURA APIs and runtime behavior.

## Windows build

```bash
npm run desktop:dist
```

The Windows installer is generated under `dist/`.

## Runtime behavior

- Electron starts the existing Node server as a child process.
- A free localhost port is selected automatically.
- The renderer runs with context isolation and Node integration disabled.
- External links are opened in the default browser.
- Closing the window hides AURA to the Windows system tray.
- Quitting AURA stops its Node server child process.
