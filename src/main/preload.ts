import { contextBridge, ipcRenderer } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('getAppVersion'),
  getVersionLatest: (): Promise<string> =>
    ipcRenderer.invoke('getVersionLatest'),
  update: (): Promise<void> => ipcRenderer.invoke('update'),
  getEmail: (): Promise<string> => ipcRenderer.invoke('getEmail'),
  getPassword: (): Promise<string> => ipcRenderer.invoke('getPassword'),
  isLoggedIn: (): Promise<boolean> => ipcRenderer.invoke('isLoggedIn'),
  login: (email: string, password: string): Promise<void> =>
    ipcRenderer.invoke('login', email, password),
  logout: (): Promise<void> => ipcRenderer.invoke('logout'),
  getTournaments: (): Promise<{ name: string; slug: string }[]> =>
    ipcRenderer.invoke('getTournaments'),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
