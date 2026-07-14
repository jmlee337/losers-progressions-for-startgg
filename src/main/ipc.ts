import { app, ipcMain, safeStorage, shell } from 'electron';
import Store from 'electron-store';

export default async function setupIPCs() {
  const store = new Store<{
    base64EncryptedPassword: string;
    email: string;
    ggSessionCookie: string;
  }>();

  ipcMain.removeHandler('getAppVersion');
  ipcMain.handle('getAppVersion', app.getVersion);

  ipcMain.removeAllListeners('getVersionLatest');
  ipcMain.handle('getVersionLatest', async () => {
    try {
      const response = await fetch(
        'https://api.github.com/repos/jmlee337/losers-progressions-for-startgg/releases/latest',
      );
      const json = await response.json();
      const latestVersion = json.tag_name;
      if (typeof latestVersion !== 'string') {
        return '';
      }
      return latestVersion;
    } catch {
      return '';
    }
  });

  ipcMain.removeAllListeners('update');
  ipcMain.on('update', async () => {
    await shell.openExternal(
      'https://github.com/jmlee337/losers-progressions-for-startgg/releases/latest',
    );
    app.quit();
  });

  ipcMain.removeAllListeners('getEmail');
  ipcMain.handle('getEmail', () => {
    return store.get('email', '');
  });

  ipcMain.removeAllListeners('getPassword');
  ipcMain.handle('getPassword', () => {
    if (!safeStorage.isEncryptionAvailable()) {
      return '';
    }

    const base64EncryptedPassword = store.get('base64EncryptedPassword', '');
    if (base64EncryptedPassword === '') {
      return '';
    }

    return safeStorage.decryptString(
      Buffer.from(base64EncryptedPassword, 'base64'),
    );
  });

  let ggSessionCookie = store.get('ggSessionCookie', '');
  ipcMain.removeAllListeners('isLoggedIn');
  ipcMain.handle('isLoggedIn', async () => {
    if (ggSessionCookie === '') {
      return false;
    }

    const response = await fetch(
      'https://www.start.gg/api/-/rest/user/current_user',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'client-version': '20',
          Cookie: ggSessionCookie,
        },
      },
    );

    if (response.status === 403) {
      return false;
    }
    if (response.status !== 200) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    return true;
  });

  ipcMain.removeAllListeners('login');
  ipcMain.handle('login', async (event, email: string, password: string) => {
    const response = await fetch('https://www.start.gg/api/-/rest/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-version': '20',
      },
      body: JSON.stringify({
        email,
        password,
        rememberMe: true,
        validationKey: 'LOGIN_userLogin',
      }),
    });

    if (response.status === 400) {
      throw new Error('Password incorrect');
    }
    if (response.status !== 200) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    store.set('email', email);
    store.set(
      'base64EncryptedPassword',
      safeStorage.encryptString(password).toString('base64'),
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const setCookie of response.headers.getSetCookie()) {
      if (setCookie.startsWith('gg_session=')) {
        [ggSessionCookie] = setCookie.split(';');
        store.set('ggSessionCookie', ggSessionCookie);
        return;
      }
    }
    throw new Error('Login response did not contain session cookie');
  });

  ipcMain.removeAllListeners('logout');
  ipcMain.handle('logout', () => {
    ggSessionCookie = '';
    store.set('ggSessionCookie', ggSessionCookie);
  });

  ipcMain.removeAllListeners('getTournaments');
  ipcMain.handle('getTournaments', async () => {
    const response = await fetch(
      'https://www.start.gg/api/-/rest/tournaments?page=1&per_page=25&filter={%22isTournamentAdmin%22:true}',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'client-version': '20',
          Cookie: ggSessionCookie,
        },
      },
    );
    if (response.status !== 200) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const tournamentsJson = json.items?.entities?.tournament;
    if (!Array.isArray(tournamentsJson)) {
      return [];
    }

    return tournamentsJson.map((tournament) => ({
      name: tournament.name,
      slug: tournament.slug.slice(11),
    }));
  });
}
