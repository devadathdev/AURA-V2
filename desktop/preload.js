import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('auraDesktop', {
  platform: process.platform,
  isDesktop: true,
  version: process.versions.electron
});
