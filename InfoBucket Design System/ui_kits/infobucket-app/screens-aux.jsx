/* InfoBucket UI kit — aux screens: Search, Archive, Capture/Share, Add, Create
   bucket, Settings. */
(function () {
  const DS = window.InfoBucketDesignSystem_7416d2;
  const {
    SourceStamp, StatusBadge, Tag, Button, TextField, NoteField, SearchField,
    EmptyState, ItemCard,
    SearchIcon, ArchiveIcon, LinkIcon, ClockIcon, XIcon, CheckIcon, SettingsIcon, ChevronRightIcon,
  } = DS;
  const D = window.IB_DATA;
  const Header = (p) => window.IB_Header(p);

  const SectionLabel = ({ children, style }) => (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', letterSpacing: 'var(--t-meta-tracking)',
      textTransform: 'uppercase', color: 'var(--text-tertiary)', ...style,
    }}>{children}</div>
  );

  /* ---- Search ---------------------------------------------------------- */
  function SearchScreen() {
    const [q, setQ] = React.useState('');
    const [active, setActive] = React.useState(null);
    const results = D.searchResults;
    return (
      <>
        <div style={{ padding: '10px 12px 8px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 5, borderBottom: '1px solid var(--border)' }}>
          <SearchField value={q} onChange={setQ} onClear={() => setQ('')} autoFocus placeholder="Search everything" />
          <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
            {['Machine learning', 'Recipes', 'Design notes'].map((b) => (
              <button key={b} type="button" onClick={() => setActive(active === b ? null : b)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--t-label)', padding: '6px 11px', cursor: 'pointer',
                borderRadius: 'var(--r-pill)', border: '1px solid ' + (active === b ? 'var(--primary-soft-2)' : 'var(--border)'),
                background: active === b ? 'var(--primary-soft)' : 'var(--surface)',
                color: active === b ? 'var(--primary)' : 'var(--text-secondary)',
              }}>{b}</button>
            ))}
          </div>
        </div>
        {q.trim() === '' ? (
          <EmptyState icon={<SearchIcon size={26} />} title="Search everything"
            body="Find anything you saved — by meaning, not just the words you remember." />
        ) : (
          <div style={{ padding: 'var(--gutter)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
            <SectionLabel style={{ padding: '0 2px 2px' }}>Best matches</SectionLabel>
            {results.map((r) => (
              <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <SourceStamp source={r.source} size="sm" />
                  <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', letterSpacing: 'var(--t-meta-tracking)', textTransform: 'uppercase', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.source} · {r.sourceName}{r.bucket ? ` · ${r.bucket}` : ''}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-micro)', color: 'var(--primary)' }}>{Math.round(r.match * 100)}%</span>
                </div>
                <h3 style={{ margin: '0 0 5px', fontFamily: 'var(--font-display)', fontSize: 'var(--t-subheading)', fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</h3>
                <p style={{ margin: 0, fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.summary}</p>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  /* ---- Archive --------------------------------------------------------- */
  function ArchiveScreen({ back }) {
    const [items, setItems] = React.useState(D.archive);
    return (
      <>
        <Header title="Archive" onBack={back} sub="Recoverable · auto-deletes" />
        <div style={{ padding: '0 var(--gutter) 12px' }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--status-archived-soft)', borderRadius: 'var(--r-md)', marginBottom: 14 }}>
            <ClockIcon size={18} style={{ color: 'var(--text-secondary)', flex: 'none', marginTop: 1 }} />
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body-sm)', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
              Items not sorted within 7 days land here. Save any to a bucket to keep it — otherwise it deletes after 20 days.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
            {items.map((it) => (
              <div key={it.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 14, opacity: 0.96 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <SourceStamp source={it.source} size="sm" />
                  <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', letterSpacing: 'var(--t-meta-tracking)', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{it.source} · {it.sourceName}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-micro)', letterSpacing: 'var(--t-micro-tracking)', textTransform: 'uppercase', color: 'var(--accent)' }}>
                    <ClockIcon size={12} /> In {it.daysLeft} days
                  </span>
                </div>
                <h3 style={{ margin: '0 0 5px', fontFamily: 'var(--font-display)', fontSize: 'var(--t-subheading)', fontWeight: 600, color: 'var(--text-primary)' }}>{it.title}</h3>
                <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.summary}</p>
                <Button variant="secondary" size="sm" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}>Save to a bucket</Button>
              </div>
            ))}
            {items.length === 0 ? <EmptyState icon={<ArchiveIcon size={26} />} title="Archive is empty" body="Sorted items stay in their buckets. Nothing is aging out." /> : null}
          </div>
        </div>
      </>
    );
  }

  /* ---- Capture / share extension (minimal sheet) ----------------------- */
  function CaptureScreen({ back }) {
    const [note, setNote] = React.useState('');
    const [rec, setRec] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(10,16,22,.42)' }}>
        <div style={{ background: 'var(--bg)', borderTopLeftRadius: 'var(--r-xl)', borderTopRightRadius: 'var(--r-xl)', padding: '10px 18px 26px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>Save to InfoBucket</span>
            <button type="button" onClick={back} aria-label="Cancel" style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, border: 0, borderRadius: '50%', background: 'var(--bg-sunken)', cursor: 'pointer', color: 'var(--text-secondary)' }}><XIcon size={15} /></button>
          </div>
          {/* URL preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 16 }}>
            <SourceStamp source="article" size="md" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>The case for calm software</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', color: 'var(--text-tertiary)' }}>
                <LinkIcon size={12} /> alistapart.com
              </div>
            </div>
          </div>
          <NoteField label="Quick note" value={note} onChange={setNote} recording={rec} onDictate={() => setRec((r) => !r)} rows={2} placeholder="Why are you saving this?" />
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" size="lg" fullWidth iconLeft={saved ? <CheckIcon size={18} /> : null}
              onClick={() => { setSaved(true); setTimeout(back, 700); }}>
              {saved ? 'Saved to Inbox' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Add (manual) ---------------------------------------------------- */
  function AddScreen({ back }) {
    const [url, setUrl] = React.useState('');
    const [note, setNote] = React.useState('');
    const [rec, setRec] = React.useState(false);
    return (
      <>
        <Header title="Add" onBack={back} />
        <div style={{ padding: 'var(--gutter)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TextField label="Link" value={url} onChange={setUrl} placeholder="Paste a URL" iconLeft={<LinkIcon size={18} />} />
          <NoteField value={note} onChange={setNote} recording={rec} onDictate={() => setRec((r) => !r)} />
          <p style={{ margin: 0, fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)', color: 'var(--text-tertiary)' }}>
            Or share a link straight from any app — InfoBucket appears in the share sheet.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={back}>Save</Button>
        </div>
      </>
    );
  }

  /* ---- Create / edit bucket -------------------------------------------- */
  function CreateBucketScreen({ ctx, back }) {
    const editing = ctx && ctx.bucketId;
    const existing = editing ? D.buckets.find((b) => b.id === ctx.bucketId) : null;
    const [name, setName] = React.useState(existing ? existing.name : '');
    const [desc, setDesc] = React.useState(existing ? existing.description : '');
    return (
      <>
        <Header title={editing ? 'Edit bucket' : 'New bucket'} onBack={back} />
        <div style={{ padding: 'var(--gutter)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Machine learning" />
          <div>
            <NoteField label="Description" value={desc} onChange={setDesc} rows={3}
              placeholder="What belongs here?" />
            <p style={{ margin: '8px 2px 0', fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)', color: 'var(--text-tertiary)' }}>
              The description helps InfoBucket route new saves to the right bucket — be specific about what fits.
            </p>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={back}>{editing ? 'Save changes' : 'Create bucket'}</Button>
        </div>
      </>
    );
  }

  /* ---- Settings -------------------------------------------------------- */
  function SettingsScreen({ go, back, accent, setAccent }) {
    const Row = ({ label, value, onClick }) => (
      <button type="button" onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        padding: '15px 16px', background: 'var(--surface)', border: 0, borderBottom: '1px solid var(--border)', cursor: 'pointer',
      }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body)', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        {value ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-label)', color: 'var(--text-tertiary)' }}>{value}</span> : null}
        <ChevronRightIcon size={18} style={{ color: 'var(--text-tertiary)' }} />
      </button>
    );
    return (
      <>
        <Header title="Settings" onBack={back} />
        <div style={{ padding: 'var(--gutter)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>S</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-subheading)', fontWeight: 600, color: 'var(--text-primary)' }}>Simone</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', color: 'var(--text-tertiary)' }}>simone@infobucket.app</div>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <Row label="Manage buckets" value={`${D.buckets.length}`} onClick={() => go('library')} />
            <Row label="Archive" value={`${D.archive.length}`} onClick={() => go('archive')} />
            <Row label="Account" onClick={() => {}} />
          </div>

          <div>
            <SectionLabel style={{ marginBottom: 8 }}>Accent</SectionLabel>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {(window.IB_ACCENTS || []).map((a) => (
                <button key={a.key} type="button" onClick={() => setAccent && setAccent(a.key)} aria-label={'Accent ' + a.key} title={a.key}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: a.hex, cursor: 'pointer', padding: 0,
                    border: accent === a.key ? '3px solid var(--text-primary)' : '3px solid var(--surface)',
                    boxShadow: '0 0 0 1px var(--border)', display: 'grid', placeItems: 'center' }}>
                  {accent === a.key ? <CheckIcon size={18} style={{ color: '#fff' }} /> : null}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel style={{ marginBottom: 8 }}>How the lifecycle works</SectionLabel>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['7 days', 'Unsorted Inbox items move to Archive — still recoverable.'], ['+20 days', 'Archived items delete themselves to keep things calm.'], ['Saved', 'Anything in a bucket stays forever.']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-label)', color: 'var(--primary)', width: 64, flex: 'none' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)', color: 'var(--text-secondary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  window.IB_SCREENS = Object.assign(window.IB_SCREENS || {}, {
    search: SearchScreen,
    archive: ArchiveScreen,
    capture: CaptureScreen,
    add: AddScreen,
    createBucket: CreateBucketScreen,
    settings: SettingsScreen,
  });
})();
