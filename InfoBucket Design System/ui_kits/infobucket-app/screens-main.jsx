/* InfoBucket UI kit — primary screens: Inbox, Review, Library, Bucket detail. */
(function () {
  const DS = window.InfoBucketDesignSystem_7416d2;
  const {
    ItemCard, BucketCard, SourceStamp, StatusBadge, BucketChip, Tag, Button,
    NoteField, SearchField, EmptyState,
    SettingsIcon, RefreshIcon, TrashIcon, LinkIcon, PlusIcon, InboxIcon, ClockIcon,
  } = DS;
  const D = window.IB_DATA;
  const Header = (p) => window.IB_Header(p);

  const HeaderAction = ({ icon, onClick, label }) => (
    <button type="button" onClick={onClick} aria-label={label} style={{
      display: 'grid', placeItems: 'center', width: 40, height: 40, flex: 'none',
      border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
    }}>{icon}</button>
  );

  const SectionLabel = ({ children }) => (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', letterSpacing: 'var(--t-meta-tracking)',
      textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '4px 4px 0',
    }}>{children}</div>
  );

  /* ---- Inbox ----------------------------------------------------------- */
  function InboxScreen({ go }) {
    const [items, setItems] = React.useState(D.inbox);
    const accept = (id) => setItems((xs) => xs.filter((x) => x.id !== id));
    return (
      <>
        <Header title="Inbox" sub={`Thursday · ${items.length} to review`}
          right={<HeaderAction icon={<SettingsIcon size={22} />} label="Settings" onClick={() => go('settings')} />} />
        {items.length === 0 ? (
          <EmptyState icon={<InboxIcon size={26} />} title="All sorted"
            body="Nothing to review. New saves land here as they arrive." />
        ) : (
          <div style={{ padding: 'var(--gutter)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
            {items.map((it) => (
              <ItemCard key={it.id} {...it} onClick={() => go('review', { itemId: it.id })}
                onAccept={() => accept(it.id)} />
            ))}
          </div>
        )}
      </>
    );
  }

  /* ---- Review / detail ------------------------------------------------- */
  function ReviewScreen({ ctx, go, back }) {
    const item = D.inbox.find((x) => x.id === ctx.itemId) || D.inbox[0];
    const [tags, setTags] = React.useState(item.tags);
    const [note, setNote] = React.useState(item.note || '');
    const [rec, setRec] = React.useState(false);
    const [confirmed, setConfirmed] = React.useState(false);
    const [regen, setRegen] = React.useState(false);
    const otherBuckets = D.buckets.filter((b) => b.name !== (item.proposedBucket && item.proposedBucket.name)).slice(0, 4);

    return (
      <>
        <Header title="Review" onBack={back}
          right={<HeaderAction icon={<LinkIcon size={20} />} label="Open source" onClick={() => {}} />} />
        <div style={{ padding: 'var(--gutter)', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* provenance + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SourceStamp source={item.source} size="lg" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-meta)', letterSpacing: 'var(--t-meta-tracking)', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                {item.source} · {item.sourceName}
              </div>
              <div style={{ marginTop: 6 }}>
                <StatusBadge status={item.status}>{item.status === 'expiring' ? `In ${item.daysLeft} days` : undefined}</StatusBadge>
              </div>
            </div>
          </div>

          {/* title + summary (hero) */}
          <div>
            <h2 style={{ margin: '0 0 10px', fontFamily: 'var(--font-display)', fontSize: 'var(--t-title)', lineHeight: 'var(--t-title-lh)', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h2>
            <p style={{ margin: 0, fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-lg)', lineHeight: 'var(--t-read-lg-lh)', color: 'var(--text-primary)' }}>{item.summary}</p>
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" size="sm" iconLeft={<RefreshIcon size={16} />} onClick={() => { setRegen(true); setTimeout(() => setRegen(false), 1100); }}>
                {regen ? 'Regenerating…' : 'Regenerate'}
              </Button>
            </div>
          </div>

          {/* bucket confirm */}
          <div>
            <SectionLabel>Bucket</SectionLabel>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {item.proposedBucket ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <BucketChip name={item.proposedBucket.name} isNew={item.proposedBucket.isNew}
                    confirmed={confirmed} onAccept={() => setConfirmed(true)} />
                  {!confirmed ? <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body-sm)', color: 'var(--text-tertiary)' }}>proposed for you</span> : <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body-sm)', color: 'var(--success)' }}>saved</span>}
                </div>
              ) : null}
              {!confirmed ? (
                <>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body-sm)', color: 'var(--text-tertiary)' }}>or pick another</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {otherBuckets.map((b) => (
                      <button key={b.id} type="button" onClick={() => setConfirmed(true)} style={{
                        fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body-sm)', fontWeight: 600,
                        padding: '8px 13px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                        border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-primary)',
                      }}>{b.name}</button>
                    ))}
                    <button type="button" onClick={() => go('createBucket')} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: 'var(--font-ui)', fontSize: 'var(--t-body-sm)', fontWeight: 600,
                      padding: '8px 13px 8px 10px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                      border: '1.5px dashed var(--border-strong)', background: 'transparent', color: 'var(--primary)',
                    }}><PlusIcon size={15} /> New bucket</button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* tags */}
          <div>
            <SectionLabel>Tags</SectionLabel>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {tags.map((t) => <Tag key={t} removable onRemove={() => setTags((xs) => xs.filter((x) => x !== t))}>{t}</Tag>)}
              <button type="button" onClick={() => setTags((xs) => [...xs, 'new-tag'])} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px 5px 9px',
                borderRadius: 'var(--r-pill)', border: '1px dashed var(--border-strong)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 'var(--t-label)',
              }}><PlusIcon size={13} /> add</button>
            </div>
          </div>

          {/* note */}
          <NoteField value={note} onChange={setNote} recording={rec} onDictate={() => setRec((r) => !r)} />

          {/* destructive */}
          <div style={{ paddingTop: 4, paddingBottom: 24 }}>
            <Button variant="destructive" iconLeft={<TrashIcon size={17} />} onClick={back} fullWidth>Delete</Button>
          </div>
        </div>
      </>
    );
  }

  /* ---- Library --------------------------------------------------------- */
  function LibraryScreen({ go }) {
    return (
      <>
        <Header title="Library" sub={`${D.buckets.length} buckets`}
          right={<HeaderAction icon={<SettingsIcon size={22} />} label="Settings" onClick={() => go('settings')} />} />
        <div style={{ padding: 'var(--gutter)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 110 }}>
          {D.buckets.map((b) => (
            <BucketCard key={b.id} {...b} onClick={() => go('bucketDetail', { bucketId: b.id })} />
          ))}
        </div>
      </>
    );
  }

  /* ---- Bucket detail --------------------------------------------------- */
  function BucketDetailScreen({ ctx, go, back }) {
    const bucket = D.buckets.find((b) => b.id === ctx.bucketId) || D.buckets[0];
    const items = D.bucketItems[bucket.id] || D.bucketItems.ml;
    const [q, setQ] = React.useState('');
    return (
      <>
        <Header title={bucket.name} onBack={back} sub={`${bucket.count} saved`}
          right={<HeaderAction icon={<SettingsIcon size={20} />} label="Edit bucket" onClick={() => go('createBucket', { bucketId: bucket.id })} />} />
        <div style={{ padding: 'var(--gutter)', display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
          <p style={{ margin: '0 0 2px', fontFamily: 'var(--font-read)', fontSize: 'var(--t-read-sm)', lineHeight: 'var(--t-read-sm-lh)', color: 'var(--text-secondary)' }}>{bucket.description}</p>
          <SearchField value={q} onChange={setQ} onClear={() => setQ('')} placeholder={`Search in ${bucket.name}`} />
          {items.map((it) => (
            <ItemCard key={it.id} {...it} onClick={() => {}} />
          ))}
        </div>
      </>
    );
  }

  window.IB_SCREENS = Object.assign(window.IB_SCREENS || {}, {
    inbox: InboxScreen,
    review: ReviewScreen,
    library: LibraryScreen,
    bucketDetail: BucketDetailScreen,
  });
})();
