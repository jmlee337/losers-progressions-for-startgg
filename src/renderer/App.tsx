import {
  Alert,
  AppBar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowBack, CloudDownload, Settings } from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { lt } from 'semver';
import { RendererTournament } from '../common/types';
import SelectTournament from './SelectTournament';

function Hello() {
  const [appVersion, setAppVersion] = useState('');
  const [versionLatest, setVersionLatest] = useState('');

  const [settled, setSettled] = useState(false);

  const [error, setError] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const openError = useCallback((message: string) => {
    setError(message);
    setErrorOpen(true);
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [tournaments, setTournaments] = useState<
    { name: string; slug: string }[]
  >([]);
  const [selectedTournament, setSelectedTournament] =
    useState<RendererTournament | null>(null);

  const title = useMemo(() => {
    if (!isLoggedIn) {
      return 'Login';
    }
    if (!selectedTournament) {
      return 'Select Tournament';
    }
    return 'Select Event';
  }, [isLoggedIn, selectedTournament]);

  useEffect(() => {
    (async () => {
      try {
        const appVersionPromise = window.electron.getAppVersion();
        const versionLatestPromise = window.electron.getVersionLatest();
        const isLoggedInPromise = window.electron.isLoggedIn();
        const initAppVersion = await appVersionPromise;
        const initVersionLatest = await versionLatestPromise;
        setAppVersion(initAppVersion);
        setVersionLatest(initVersionLatest);
        if (initVersionLatest && lt(initAppVersion, initVersionLatest)) {
          setSettingsOpen(true);
        }
        const initIsLoggedIn = await isLoggedInPromise;
        setIsLoggedIn(initIsLoggedIn);
        if (initIsLoggedIn) {
          setTournaments(await window.electron.getTournaments());
        } else {
          setEmail(await window.electron.getEmail());
          setPassword(await window.electron.getPassword());
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
          setErrorOpen(true);
        }
      } finally {
        setSettled(true);
      }
    })();
  }, []);
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: (theme) => theme.palette.common.white,
          color: (theme) => theme.palette.text.primary,
        }}
      >
        <Toolbar disableGutters style={{ paddingLeft: '8px' }}>
          <Stack
            direction="row"
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: (theme) => theme.palette.text.disabled }}
              style={{
                flexGrow: 1,
                flexShrink: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Typography>
            <Tooltip placement="left" title="Settings">
              <IconButton
                onClick={() => {
                  setSettingsOpen(true);
                }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Stack style={{ marginBottom: '8px' }}>
        {settled && (
          <>
            {isLoggedIn && (
              <>
                {selectedTournament && (
                  <>
                    <ListItemButton
                      style={{ paddingLeft: 0 }}
                      onClick={() => {
                        setSelectedTournament(null);
                      }}
                    >
                      <ListItemIcon>
                        <ArrowBack />
                      </ListItemIcon>
                      <ListItemText>{selectedTournament.name}</ListItemText>
                    </ListItemButton>
                    {selectedTournament.events.length > 0 && (
                      <List disablePadding>
                        {selectedTournament.events.map((event) => (
                          <ListItem disableGutters key={event.id}>
                            <ListItemText>{event.name}</ListItemText>
                          </ListItem>
                        ))}
                      </List>
                    )}
                    {selectedTournament.events.length === 0 && (
                      <Alert severity="warning">No configurable events</Alert>
                    )}
                  </>
                )}
                {!selectedTournament && (
                  <SelectTournament
                    tournaments={tournaments}
                    setTournament={setSelectedTournament}
                    openError={openError}
                  />
                )}
              </>
            )}
            {!isLoggedIn && (
              <Stack style={{ alignItems: 'start' }} spacing="8px">
                <TextField
                  label="start.gg email"
                  size="small"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                />
                <TextField
                  label="start.gg password"
                  size="small"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                />
                <Button
                  disabled={loggingIn}
                  type="submit"
                  variant="contained"
                  onClick={async () => {
                    try {
                      setLoggingIn(true);
                      await window.electron.login(email, password);
                      setIsLoggedIn(true);
                      setTournaments(await window.electron.getTournaments());
                    } catch (e: unknown) {
                      if (e instanceof Error) {
                        setError(e.message);
                        setErrorOpen(true);
                      }
                    } finally {
                      setLoggingIn(false);
                    }
                  }}
                >
                  Login!
                </Button>
              </Stack>
            )}
          </>
        )}
        {!settled && <CircularProgress />}
      </Stack>
      <Dialog open={settingsOpen}>
        <Stack
          direction="row"
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            marginRight: '24px',
          }}
        >
          <DialogTitle>Settings</DialogTitle>
          <Typography variant="caption">
            Losers Progressions for start.gg v{appVersion}
          </Typography>
        </Stack>
        {appVersion && versionLatest && lt(appVersion, versionLatest) && (
          <DialogContent>
            <Alert
              severity="warning"
              style={{ marginTop: '8px' }}
              action={
                <Button
                  endIcon={<CloudDownload />}
                  variant="contained"
                  onClick={() => {
                    window.electron.update();
                  }}
                >
                  Quit and download
                </Button>
              }
            >
              Update available! v{versionLatest}
            </Alert>
          </DialogContent>
        )}
        {isLoggedIn && (
          <DialogActions>
            <Button
              color="warning"
              variant="contained"
              onClick={async () => {
                await window.electron.logout();
                setEmail(await window.electron.getEmail());
                setPassword(await window.electron.getPassword());
                setIsLoggedIn(false);
                setSettingsOpen(false);
              }}
            >
              Logout
            </Button>
          </DialogActions>
        )}
      </Dialog>
      <Dialog open={errorOpen}>
        <DialogContent>
          <DialogContentText>{error}</DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
