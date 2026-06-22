/* InfoBucket UI kit — app shell: phone frame, status bar, router, tab bar, FAB,
   light/dark toggle. Reads screens off window.IB_SCREENS. */
const DS = window.InfoBucketDesignSystem_7416d2;
const { TabBar, AddButton, SettingsIcon, ChevronRightIcon } = DS;

/* User-selectable accent themes (mirror tokens/accents.css). */
const IB_ACCENTS = [
  { key: 'olive', hex: '#7CA84F' }, { key: 'cobalt', hex: '#2D5AD9' },
  { key: 'seafoam', hex: '#12A199' }, { key: 'blush', hex: '#DC6F94' },
  { key: 'tangerine', hex: '#E5731F' }, { key: 'oxblood', hex: '#8E2E3C' },
];
window.IB_ACCENTS = IB_ACCENTS;

/* ---- Shared screen header --------------------------------------------- */
function Header({ title, onBack, right, sub }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px 10px', background: 'var(--bg)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 5,
    }}>
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" style={{
          display: 'grid', placeItems: 'center', width: 40, height: 40, flex: 'none',
          border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)',
          transform: 'scaleX(-1)',
        }}><ChevronRightIcon size={22} /></button>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--t-title)',
          lineHeight: 'var(--t-title-lh)', fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</h1>
        {sub ? <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', letterSpacing: 'var(--t-meta-tracking)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</div> : null}
      </div>
      {right || null}
    </header>
  );
}
window.IB_Header = Header;

/* ---- Status bar -------------------------------------------------------- */
function StatusBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 22px 4px', fontFamily: 'var(--font-ui)', fontWeight: 600,
      fontSize: 14, color: 'var(--text-primary)',
    }}>
      <span>9:41</span>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 2.2c2 0 3.8.8 5.1 2L14.4 2.9C12.7 1.2 10.5.2 8 .2S3.3 1.2 1.6 2.9L2.9 4.2C4.2 3 6 2.2 8 2.2z" opacity=".9"/><path d="M8 5.4c1.1 0 2.1.45 2.8 1.18l1.3-1.3C11 4.16 9.6 3.6 8 3.6s-3 .56-4.1 1.68l1.3 1.3C5.9 5.85 6.9 5.4 8 5.4z"/><circle cx="8" cy="9" r="1.6"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor"/><rect x="23" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" opacity=".5"/></svg>
      </span>
    </div>
  );
}

/* ---- App shell --------------------------------------------------------- */
function App() {
  const [theme, setTheme] = React.useState('light');
  const [accent, setAccentState] = React.useState(() => {
    try { return localStorage.getItem('ib-accent') || 'olive'; } catch (e) { return 'olive'; }
  });
  const setAccent = (a) => {
    setAccentState(a);
    try { localStorage.setItem('ib-accent', a); } catch (e) {}
  };
  const [stack, setStack] = React.useState([{ screen: 'inbox' }]);
  const top = stack[stack.length - 1];
  const tab = ['inbox', 'library', 'search'].includes(top.screen) ? top.screen : null;

  const go = (screen, params = {}) => setStack((s) => [...s, { screen, ...params }]);
  const replaceTab = (screen) => setStack([{ screen }]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const Screens = window.IB_SCREENS;
  const Current = Screens[top.screen] || Screens.inbox;
  const showTabs = ['inbox', 'library', 'search', 'archive'].includes(top.screen);
  const showFab = ['inbox', 'library'].includes(top.screen);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      {/* chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          style={{ fontFamily: 'var(--studio-mono)', fontSize: 12, padding: '7px 14px', borderRadius: 999,
            border: '1px solid #cfd8e3', background: '#fff', color: '#33414f', cursor: 'pointer' }}>
          {theme === 'light' ? '◐  Dark' : '◑  Light'}
        </button>
        <button type="button" onClick={() => go('capture')}
          style={{ fontFamily: 'var(--studio-mono)', fontSize: 12, padding: '7px 14px', borderRadius: 999,
            border: '1px solid #cfd8e3', background: '#fff', color: '#33414f', cursor: 'pointer' }}>
          ⤴  Share sheet
        </button>
        <span style={{ width: 1, height: 22, background: '#d4dce5', margin: '0 2px' }}></span>
        {IB_ACCENTS.map((a) => (
          <button key={a.key} type="button" onClick={() => setAccent(a.key)} aria-label={'Accent ' + a.key} title={a.key}
            style={{ width: 22, height: 22, borderRadius: '50%', background: a.hex, cursor: 'pointer', padding: 0,
              border: accent === a.key ? '2px solid #33414f' : '2px solid #fff',
              boxShadow: '0 0 0 1px #cfd8e3' }} />
        ))}
      </div>

      {/* phone */}
      <div data-theme={theme === 'dark' ? 'dark' : undefined} data-accent={accent} data-screen-label={top.screen}
        style={{
          width: 390, height: 820, position: 'relative', overflow: 'hidden',
          borderRadius: 46, background: 'var(--bg)',
          boxShadow: theme === 'dark'
            ? '0 0 0 10px #1c2530, 0 0 0 12px #2c3744, 0 40px 80px rgba(0,0,0,.5)'
            : '0 0 0 10px #11171f, 0 0 0 12px #2a3340, 0 40px 80px rgba(20,30,45,.4)',
          display: 'flex', flexDirection: 'column',
        }}>
        <StatusBar />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div key={top.screen + (top.itemId || top.bucketId || '')} style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Current ctx={top} go={go} back={back} accent={accent} setAccent={setAccent} />
          </div>
          {showFab ? (
            <div style={{ position: 'absolute', right: 18, bottom: showTabs ? 92 : 26 }}>
              <AddButton onClick={() => go('add')} />
            </div>
          ) : null}
          {showTabs ? (
            <TabBar active={tab || 'inbox'} badge={{ inbox: window.IB_DATA.inbox.length }}
              onChange={(k) => replaceTab(k)} />
          ) : null}
        </div>
      </div>

      <div style={{ fontFamily: 'var(--studio-mono)', fontSize: 11, color: '#8795a3', letterSpacing: '.04em' }}>
        InfoBucket · tap around — buckets accept, items open, search filters
      </div>
    </div>
  );
}

window.IB_App = App;
