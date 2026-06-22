/* @ds-bundle: {"format":3,"namespace":"InfoBucketDesignSystem_7416d2","components":[{"name":"BucketCard","sourcePath":"components/cards/BucketCard.jsx"},{"name":"ItemCard","sourcePath":"components/cards/ItemCard.jsx"},{"name":"BucketChip","sourcePath":"components/core/BucketChip.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"SourceStamp","sourcePath":"components/core/SourceStamp.jsx"},{"name":"StatusBadge","sourcePath":"components/core/StatusBadge.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"ArticleIcon","sourcePath":"components/core/icons.jsx"},{"name":"VideoIcon","sourcePath":"components/core/icons.jsx"},{"name":"ReelIcon","sourcePath":"components/core/icons.jsx"},{"name":"DocumentIcon","sourcePath":"components/core/icons.jsx"},{"name":"NoteIcon","sourcePath":"components/core/icons.jsx"},{"name":"InboxIcon","sourcePath":"components/core/icons.jsx"},{"name":"LibraryIcon","sourcePath":"components/core/icons.jsx"},{"name":"SearchIcon","sourcePath":"components/core/icons.jsx"},{"name":"PlusIcon","sourcePath":"components/core/icons.jsx"},{"name":"SettingsIcon","sourcePath":"components/core/icons.jsx"},{"name":"SparkleIcon","sourcePath":"components/core/icons.jsx"},{"name":"CheckIcon","sourcePath":"components/core/icons.jsx"},{"name":"ClockIcon","sourcePath":"components/core/icons.jsx"},{"name":"ArchiveIcon","sourcePath":"components/core/icons.jsx"},{"name":"TrashIcon","sourcePath":"components/core/icons.jsx"},{"name":"RefreshIcon","sourcePath":"components/core/icons.jsx"},{"name":"MicIcon","sourcePath":"components/core/icons.jsx"},{"name":"LinkIcon","sourcePath":"components/core/icons.jsx"},{"name":"ChevronRightIcon","sourcePath":"components/core/icons.jsx"},{"name":"XIcon","sourcePath":"components/core/icons.jsx"},{"name":"AlertIcon","sourcePath":"components/core/icons.jsx"},{"name":"BellIcon","sourcePath":"components/core/icons.jsx"},{"name":"FilterIcon","sourcePath":"components/core/icons.jsx"},{"name":"MoonIcon","sourcePath":"components/core/icons.jsx"},{"name":"SOURCE_ICON","sourcePath":"components/core/icons.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"ErrorBanner","sourcePath":"components/feedback/ErrorBanner.jsx"},{"name":"NoteField","sourcePath":"components/forms/NoteField.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"AddButton","sourcePath":"components/navigation/AddButton.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"}],"sourceHashes":{"components/cards/BucketCard.jsx":"09f88f533af2","components/cards/ItemCard.jsx":"0e732bf34da6","components/core/BucketChip.jsx":"f4916110f8fd","components/core/Button.jsx":"169266b142df","components/core/SourceStamp.jsx":"aef197895629","components/core/StatusBadge.jsx":"96d142eaffdb","components/core/Tag.jsx":"39b9acf9d72a","components/core/icons.jsx":"62e6f30d9496","components/feedback/EmptyState.jsx":"b66cd1ccb2ee","components/feedback/ErrorBanner.jsx":"f0f72fe27444","components/forms/NoteField.jsx":"8bb5826c44f6","components/forms/SearchField.jsx":"5f8ba49b549b","components/forms/TextField.jsx":"82a2ee45ba59","components/navigation/AddButton.jsx":"45141ee06c81","components/navigation/TabBar.jsx":"dcaa1ea5dc10","ui_kits/infobucket-app/data.js":"b1552d838a0d","ui_kits/infobucket-app/screens-aux.jsx":"675598ffd214","ui_kits/infobucket-app/screens-main.jsx":"0f21aa1bb776","ui_kits/infobucket-app/shell.jsx":"376a705e8be3"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.InfoBucketDesignSystem_7416d2 = window.InfoBucketDesignSystem_7416d2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    padding: '0 12px',
    height: 34,
    font: 'var(--t-body-sm)',
    radius: 'var(--r-sm)',
    gap: 6
  },
  md: {
    padding: '0 16px',
    height: 44,
    font: 'var(--t-body)',
    radius: 'var(--r-md)',
    gap: 8
  },
  lg: {
    padding: '0 20px',
    height: 52,
    font: 'var(--t-subheading)',
    radius: 'var(--r-md)',
    gap: 9
  }
};
const variants = {
  primary: {
    bg: 'var(--primary)',
    fg: 'var(--text-on-primary)',
    bd: 'transparent',
    shadow: 'var(--shadow-sm)'
  },
  secondary: {
    bg: 'var(--surface)',
    fg: 'var(--text-primary)',
    bd: 'var(--border-strong)',
    shadow: 'none'
  },
  ghost: {
    bg: 'transparent',
    fg: 'var(--primary)',
    bd: 'transparent',
    shadow: 'none'
  },
  destructive: {
    bg: 'var(--danger-soft)',
    fg: 'var(--danger)',
    bd: 'transparent',
    shadow: 'none'
  }
};

/**
 * Button — the primary action control. Label is the same name used everywhere
 * in the flow (Save, not Submit). Bricolage Grotesque, medium weight.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick,
    disabled: disabled,
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.height,
      minHeight: 'var(--touch-min)',
      padding: s.padding,
      fontFamily: 'var(--font-ui)',
      fontSize: s.font,
      fontWeight: 600,
      lineHeight: 1,
      color: v.fg,
      background: v.bg,
      border: `1.5px solid ${v.bd}`,
      borderRadius: s.radius,
      boxShadow: v.shadow,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background .15s ease, transform .06s ease, box-shadow .15s ease',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), iconLeft ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 18,
      height: 18
    }
  }, iconLeft) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 18,
      height: 18
    }
  }, iconRight) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusBadge.jsx
try { (() => {
const MAP = {
  processing: {
    label: 'Processing',
    fg: 'var(--status-processing)',
    bg: 'var(--status-processing-soft)',
    pulse: true
  },
  ready: {
    label: 'Ready',
    fg: 'var(--status-ready)',
    bg: 'var(--status-ready-soft)'
  },
  saved: {
    label: 'Saved',
    fg: 'var(--status-saved)',
    bg: 'var(--status-saved-soft)'
  },
  archived: {
    label: 'Archived',
    fg: 'var(--status-archived)',
    bg: 'var(--status-archived-soft)'
  },
  expiring: {
    label: 'Expiring',
    fg: 'var(--status-expiring)',
    bg: 'var(--status-expiring-soft)'
  }
};

/**
 * StatusBadge — the second structural signal: where an item is in its life.
 * Pill with a state dot; processing gently pulses. Pass children to override
 * the label (e.g. a countdown for expiring).
 */
function StatusBadge({
  status = 'ready',
  children,
  dot = true,
  style
}) {
  const m = MAP[status] || MAP.ready;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px 4px 8px',
      borderRadius: 'var(--r-pill)',
      background: m.bg,
      color: m.fg,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-micro)',
      letterSpacing: 'var(--t-micro-tracking)',
      textTransform: 'uppercase',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...style
    }
  }, dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: m.fg,
      flex: 'none',
      animation: m.pulse ? 'ib-pulse 1.4s ease-in-out infinite' : 'none'
    }
  }) : null, children || m.label, /*#__PURE__*/React.createElement("style", null, `@keyframes ib-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @media (prefers-reduced-motion: reduce){[style*="ib-pulse"]{animation:none!important}}`));
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/core/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* InfoBucket icon set — Lucide-style, 24×24, 1.8 stroke, currentColor.
   Mirrors lucide-react-native names so RN/Expo can swap 1:1. */

const S = ({
  children,
  size = 24,
  fill = 'none',
  ...rest
}) => /*#__PURE__*/React.createElement("svg", _extends({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: fill,
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, rest), children);

/* ---- Source glyphs (provenance) ---------------------------------------- */
const ArticleIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "4",
  width: "16",
  height: "16",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 9h8M8 13h8M8 17h5"
}));
const VideoIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "6",
  width: "18",
  height: "12",
  rx: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M11 9.5l4 2.5-4 2.5z",
  fill: "currentColor",
  stroke: "none"
}));
const ReelIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("rect", {
  x: "6",
  y: "3",
  width: "12",
  height: "18",
  rx: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M11 9l4 3-4 3z",
  fill: "currentColor",
  stroke: "none"
}));
const DocumentIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M7 3h7l4 4v14H7z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M14 3v4h4M10 13h6M10 17h6"
}));
const NoteIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M5 4h14v16l-4-3-3 3-3-3-4 3z"
}));

/* ---- Navigation -------------------------------------------------------- */
const InboxIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M4 13h4l2 3h4l2-3h4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 13l2-7h12l2 7v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
}));
const LibraryIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "4",
  width: "6",
  height: "16",
  rx: "1.5"
}), /*#__PURE__*/React.createElement("rect", {
  x: "13",
  y: "4",
  width: "6",
  height: "16",
  rx: "1.5"
}));
const SearchIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "7"
}), /*#__PURE__*/React.createElement("path", {
  d: "m20 20-3.2-3.2"
}));
const PlusIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14M5 12h14"
}));
const SettingsIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
}));

/* ---- Status / actions -------------------------------------------------- */
const SparkleIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"
}));
const CheckIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M4 12.5l5 5L20 6.5"
}));
const ClockIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "8"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 8v4.5l3 2"
}));
const ArchiveIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "4",
  rx: "1"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"
}));
const TrashIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"
}));
const RefreshIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 11a8 8 0 1 0-1.8 5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M20 5v6h-6"
}));
const MicIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("rect", {
  x: "9",
  y: "3",
  width: "6",
  height: "11",
  rx: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 11a7 7 0 0 0 14 0M12 18v3"
}));
const LinkIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M9 15l6-6M8 12l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 12l2-2a3.5 3.5 0 0 0-5-5l-2 2"
}));
const ChevronRightIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "m9 6 6 6-6 6"
}));
const XIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M6 6l12 12M18 6 6 18"
}));
const AlertIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 4 2.5 20h19z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 10v4M12 17.5v.5"
}));
const BellIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"
}));
const FilterIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 5h18l-7 8v5l-4 2v-7z"
}));
const MoonIcon = p => /*#__PURE__*/React.createElement(S, p, /*#__PURE__*/React.createElement("path", {
  d: "M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"
}));

/* Map a source key -> its glyph */
const SOURCE_ICON = {
  article: ArticleIcon,
  video: VideoIcon,
  reel: ReelIcon,
  document: DocumentIcon,
  note: NoteIcon
};
Object.assign(__ds_scope, { ArticleIcon, VideoIcon, ReelIcon, DocumentIcon, NoteIcon, InboxIcon, LibraryIcon, SearchIcon, PlusIcon, SettingsIcon, SparkleIcon, CheckIcon, ClockIcon, ArchiveIcon, TrashIcon, RefreshIcon, MicIcon, LinkIcon, ChevronRightIcon, XIcon, AlertIcon, BellIcon, FilterIcon, MoonIcon, SOURCE_ICON });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/icons.jsx", error: String((e && e.message) || e) }); }

// components/cards/BucketCard.jsx
try { (() => {
/**
 * BucketCard — a collection in the Library. Name in Bricolage, an item count in
 * catalog mono, a one-line description, and a small spine of source-hue ticks
 * hinting at what's inside (provenance, again). Works in a grid or a list.
 */
function BucketCard({
  name,
  count = 0,
  description,
  sources = [],
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      display: 'block',
      textAlign: 'left',
      width: '100%',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 16,
      cursor: 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginBottom: 14
    }
  }, (sources.length ? sources : ['note']).slice(0, 6).map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 22,
      height: 5,
      borderRadius: 3,
      background: `var(--src-${s})`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--t-heading)',
      lineHeight: 'var(--t-heading-lh)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-label)',
      color: 'var(--text-tertiary)',
      flex: 'none'
    }
  }, count)), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontFamily: 'var(--font-read)',
      fontSize: 'var(--t-read-sm)',
      lineHeight: 'var(--t-read-sm-lh)',
      color: 'var(--text-secondary)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, description) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginTop: 12,
      color: 'var(--primary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-micro)',
      letterSpacing: 'var(--t-micro-tracking)',
      textTransform: 'uppercase'
    }
  }, "Open"), /*#__PURE__*/React.createElement(__ds_scope.ChevronRightIcon, {
    size: 13
  })));
}
Object.assign(__ds_scope, { BucketCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/BucketCard.jsx", error: String((e && e.message) || e) }); }

// components/core/BucketChip.jsx
try { (() => {
/**
 * BucketChip — the AI-proposed destination with accept-on-the-fly. A sparkle
 * marks it as a suggestion; the trailing control accepts (✓) in one tap, or
 * creates (+) when the proposal is a brand-new bucket. `confirmed` shows the
 * settled, user-confirmed state (no sparkle, solid).
 */
function BucketChip({
  name,
  isNew = false,
  confirmed = false,
  onAccept,
  onClick,
  style
}) {
  const accent = confirmed ? 'var(--primary)' : 'var(--text-primary)';
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 5px 5px 12px',
      borderRadius: 'var(--r-pill)',
      background: confirmed ? 'var(--primary-soft)' : 'var(--surface)',
      border: `1.5px solid ${confirmed ? 'var(--primary-soft-2)' : 'var(--border-strong)'}`,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, !confirmed && /*#__PURE__*/React.createElement(__ds_scope.SparkleIcon, {
    size: 14,
    style: {
      color: 'var(--primary)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--t-body-sm)',
      fontWeight: 600,
      color: accent,
      whiteSpace: 'nowrap'
    }
  }, isNew && !confirmed ? `New · ${name}` : name), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onAccept && onAccept();
    },
    "aria-label": isNew ? `Create ${name}` : `Accept ${name}`,
    style: {
      display: 'inline-grid',
      placeItems: 'center',
      width: 26,
      height: 26,
      border: 0,
      borderRadius: '50%',
      flex: 'none',
      cursor: 'pointer',
      color: confirmed ? 'var(--primary)' : 'var(--text-on-primary)',
      background: confirmed ? 'transparent' : 'var(--primary)'
    }
  }, confirmed ? /*#__PURE__*/React.createElement(__ds_scope.CheckIcon, {
    size: 15
  }) : isNew ? /*#__PURE__*/React.createElement(__ds_scope.PlusIcon, {
    size: 15
  }) : /*#__PURE__*/React.createElement(__ds_scope.CheckIcon, {
    size: 15
  })));
}
Object.assign(__ds_scope, { BucketChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/BucketChip.jsx", error: String((e && e.message) || e) }); }

// components/core/SourceStamp.jsx
try { (() => {
const SOURCE_LABEL = {
  article: 'Article',
  video: 'Video',
  reel: 'Reel',
  document: 'Document',
  note: 'Note'
};
const sizes = {
  sm: {
    box: 28,
    icon: 15,
    radius: 'var(--r-sm)'
  },
  md: {
    box: 38,
    icon: 20,
    radius: 'var(--r-md)'
  },
  lg: {
    box: 48,
    icon: 25,
    radius: 'var(--r-md)'
  }
};

/**
 * SourceStamp — the signature provenance mark. A tinted square in the source's
 * own hue holding its glyph; every captured item leads with one. Optionally
 * shows the source name (and free text like a publication) in catalog mono.
 */
function SourceStamp({
  source = 'article',
  size = 'md',
  showLabel = false,
  label,
  style
}) {
  const s = sizes[size] || sizes.md;
  const Icon = __ds_scope.SOURCE_ICON[source] || __ds_scope.SOURCE_ICON.article;
  const stamp = /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-grid',
      placeItems: 'center',
      width: s.box,
      height: s.box,
      flex: 'none',
      borderRadius: s.radius,
      color: `var(--src-${source})`,
      background: `var(--src-${source}-soft)`
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    size: s.icon
  }));
  if (!showLabel) return React.cloneElement(stamp, {
    style: {
      ...stamp.props.style,
      ...style
    }
  });
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      ...style
    }
  }, stamp, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-meta)',
      letterSpacing: 'var(--t-meta-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label || SOURCE_LABEL[source]));
}
Object.assign(__ds_scope, { SourceStamp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SourceStamp.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
/**
 * Tag — a keyword chip. Quiet by default (catalog mono on a soft fill).
 * `removable` shows an × for editing; `onAdd` style is handled by the consumer.
 */
function Tag({
  children,
  removable = false,
  onRemove,
  selected = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: removable ? '5px 6px 5px 11px' : '5px 11px',
      borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-label)',
      letterSpacing: '0.01em',
      lineHeight: 1,
      cursor: onClick ? 'pointer' : 'default',
      color: selected ? 'var(--primary)' : 'var(--text-secondary)',
      background: selected ? 'var(--primary-soft)' : 'var(--bg-sunken)',
      border: `1px solid ${selected ? 'var(--primary-soft-2)' : 'transparent'}`,
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.55
    }
  }, "#"), children, removable ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      onRemove && onRemove();
    },
    "aria-label": "Remove tag",
    style: {
      display: 'inline-grid',
      placeItems: 'center',
      width: 18,
      height: 18,
      marginLeft: 1,
      border: 0,
      borderRadius: '50%',
      cursor: 'pointer',
      color: 'var(--text-tertiary)',
      background: 'transparent'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.XIcon, {
    size: 12
  })) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/cards/ItemCard.jsx
try { (() => {
const SOURCE_LABEL = {
  article: 'Article',
  video: 'Video',
  reel: 'Reel',
  document: 'Document',
  note: 'Note'
};

/**
 * ItemCard — the hero of Inbox. Leads with the source stamp (provenance) and
 * the lifecycle status, and makes the Newsreader summary the most readable
 * thing on screen. Handles three live states: processing (skeleton), ready
 * (with an accept-on-the-fly bucket proposal) and expiring (quiet amber decay
 * countdown). Composes SourceStamp · StatusBadge · BucketChip · Tag.
 */
function ItemCard({
  source = 'article',
  sourceName,
  title,
  summary,
  tags = [],
  status = 'ready',
  proposedBucket,
  daysLeft,
  onAccept,
  onClick,
  style
}) {
  const processing = status === 'processing';
  const expiring = status === 'expiring';
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    style: {
      position: 'relative',
      background: 'var(--surface)',
      border: `1px solid ${expiring ? 'var(--status-expiring-soft)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)',
      boxShadow: expiring ? 'var(--shadow-expiring)' : 'var(--shadow-sm)',
      padding: 16,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SourceStamp, {
    source: source,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-meta)',
      letterSpacing: 'var(--t-meta-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, SOURCE_LABEL[source], sourceName ? ` · ${sourceName}` : '')), /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, {
    status: status
  }, expiring && daysLeft != null ? `In ${daysLeft} days` : undefined)), title && !processing ? /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 6px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--t-heading)',
      lineHeight: 'var(--t-heading-lh)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, title) : null, processing ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      margin: '4px 0 14px'
    }
  }, [100, 92, 64].map((w, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      height: 12,
      width: `${w}%`,
      borderRadius: 6,
      background: 'linear-gradient(90deg, var(--bg-sunken) 25%, var(--surface-hover) 37%, var(--bg-sunken) 63%)',
      backgroundSize: '400% 100%',
      animation: 'ib-shimmer 1.4s ease-in-out infinite'
    }
  }))) : /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 14px',
      fontFamily: 'var(--font-read)',
      fontSize: 'var(--t-read)',
      lineHeight: 'var(--t-read-lh)',
      color: 'var(--text-primary)',
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, summary), processing ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-micro)',
      letterSpacing: 'var(--t-micro-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, "Summarising \xB7 proposing a bucket\u2026") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, proposedBucket ? /*#__PURE__*/React.createElement(__ds_scope.BucketChip, {
    name: proposedBucket.name,
    isNew: proposedBucket.isNew,
    onAccept: onAccept
  }) : null, tags.slice(0, 2).map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t
  }, t))), expiring && !processing && daysLeft != null ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      marginTop: 12,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-micro)',
      letterSpacing: 'var(--t-micro-tracking)',
      textTransform: 'uppercase',
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.ClockIcon, {
    size: 12
  }), " In ", daysLeft, " days \u2192 Archive") : null, /*#__PURE__*/React.createElement("style", null, `@keyframes ib-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
        @media (prefers-reduced-motion: reduce){[style*="ib-shimmer"]{animation:none!important}}`));
}
Object.assign(__ds_scope, { ItemCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ItemCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/**
 * EmptyState — empty as direction, not mood. A quiet glyph, a plain headline in
 * Bricolage, one line of what-to-do in Newsreader, and at most one action.
 * Pass `icon` (a node) to match the context (inbox all-sorted, empty search…).
 */
function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '40px 28px',
      maxWidth: 320,
      margin: '0 auto',
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 64,
      height: 64,
      marginBottom: 18,
      borderRadius: 'var(--r-lg)',
      background: 'var(--primary-soft)',
      color: 'var(--primary)'
    }
  }, icon) : null, title ? /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--t-title)',
      lineHeight: 'var(--t-title-lh)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, title) : null, body ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-read)',
      fontSize: 'var(--t-read)',
      lineHeight: 'var(--t-read-lh)',
      color: 'var(--text-secondary)'
    }
  }, body) : null, actionLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    onClick: onAction
  }, actionLabel)) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ErrorBanner.jsx
try { (() => {
/**
 * ErrorBanner — direction, not mood. States plainly what failed and what to do,
 * with a single retry. Soft danger fill, never a full-bleed alarm.
 */
function ErrorBanner({
  message = "Couldn't reach that link.",
  actionLabel = 'Try again',
  onAction,
  onDismiss,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      background: 'var(--danger-soft)',
      borderRadius: 'var(--r-md)',
      padding: '12px 12px 12px 14px',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.AlertIcon, {
    size: 19,
    style: {
      color: 'var(--danger)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--t-body)',
      color: 'var(--text-primary)',
      lineHeight: 1.35
    }
  }, message), actionLabel ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      flex: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--t-body-sm)',
      fontWeight: 600,
      color: 'var(--danger)',
      padding: '6px 8px',
      borderRadius: 'var(--r-xs)'
    }
  }, actionLabel) : null, onDismiss ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      width: 28,
      height: 28,
      border: 0,
      borderRadius: '50%',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.XIcon, {
    size: 14
  })) : null);
}
Object.assign(__ds_scope, { ErrorBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ErrorBanner.jsx", error: String((e && e.message) || e) }); }

// components/forms/NoteField.jsx
try { (() => {
/**
 * NoteField — multi-line note input with a dictation affordance. The mic sits
 * in the bottom-right; `recording` shows it active (pulsing). The note reads in
 * Newsreader, matching the summary it sits beside.
 */
function NoteField({
  label = 'Note',
  value,
  onChange,
  placeholder = 'Add a note, or dictate one…',
  recording = false,
  onDictate,
  rows = 3,
  style
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginBottom: 7,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-label)',
      letterSpacing: 'var(--t-label-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      position: 'relative',
      background: 'var(--surface)',
      border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border-strong)'}`,
      borderRadius: 'var(--r-sm)',
      padding: '12px 12px 12px',
      boxShadow: focused ? '0 0 0 3px var(--primary-soft)' : 'none',
      transition: 'border-color .15s, box-shadow .15s'
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    placeholder: placeholder,
    rows: rows,
    style: {
      width: '100%',
      resize: 'none',
      border: 0,
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-read)',
      fontSize: 'var(--t-read-sm)',
      lineHeight: 'var(--t-read-sm-lh)',
      color: 'var(--text-primary)',
      display: 'block',
      paddingRight: 36,
      boxSizing: 'border-box'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDictate,
    "aria-label": recording ? 'Stop dictation' : 'Dictate note',
    style: {
      position: 'absolute',
      right: 8,
      bottom: 8,
      display: 'grid',
      placeItems: 'center',
      width: 34,
      height: 34,
      borderRadius: '50%',
      border: 0,
      cursor: 'pointer',
      color: recording ? 'var(--text-on-primary)' : 'var(--primary)',
      background: recording ? 'var(--primary)' : 'var(--primary-soft)',
      animation: recording ? 'ib-rec 1.2s ease-in-out infinite' : 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.MicIcon, {
    size: 17
  })), /*#__PURE__*/React.createElement("style", null, `@keyframes ib-rec{0%,100%{box-shadow:0 0 0 0 var(--primary-soft)}50%{box-shadow:0 0 0 6px transparent}}
          @media (prefers-reduced-motion: reduce){[style*="ib-rec"]{animation:none!important}}`)));
}
Object.assign(__ds_scope, { NoteField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/NoteField.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
/**
 * SearchField — the free-text query well. Sunken surface, rounded, with a
 * leading magnifier and a clear (×) when filled. Used on Search and inside
 * bucket detail.
 */
function SearchField({
  value,
  onChange,
  onClear,
  placeholder = 'Search everything',
  autoFocus,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      background: 'var(--bg-sunken)',
      borderRadius: 'var(--r-md)',
      padding: '0 12px',
      minHeight: 'var(--touch-min)',
      border: '1px solid transparent',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SearchIcon, {
    size: 18,
    style: {
      color: 'var(--text-tertiary)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    autoFocus: autoFocus,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--t-body)',
      color: 'var(--text-primary)',
      padding: '11px 0'
    }
  }), value ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClear,
    "aria-label": "Clear",
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 26,
      height: 26,
      border: 0,
      borderRadius: '50%',
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      background: 'var(--mist)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.XIcon, {
    size: 13
  })) : null);
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * TextField — labelled single-line input (bucket name, manual URL, etc.).
 * Bricolage label in catalog-quiet style; clear focus ring for accessibility.
 */
function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = 'text',
  iconLeft = null,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'var(--danger)' : focused ? 'var(--primary)' : 'var(--border-strong)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginBottom: 7,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-label)',
      letterSpacing: 'var(--t-label-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--surface)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: 'var(--r-sm)',
      padding: '0 12px',
      minHeight: 'var(--touch-min)',
      boxShadow: focused ? '0 0 0 3px var(--primary-soft)' : 'none',
      transition: 'border-color .15s, box-shadow .15s'
    }
  }, iconLeft ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-tertiary)',
      flex: 'none'
    }
  }, iconLeft) : null, /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--t-body)',
      color: 'var(--text-primary)',
      padding: '12px 0'
    }
  }, rest))), error || hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 6,
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--t-body-sm)',
      color: error ? 'var(--danger)' : 'var(--text-tertiary)'
    }
  }, error || hint) : null);
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AddButton.jsx
try { (() => {
/**
 * AddButton — the prominent "+" for manual capture. A raised circular FAB in
 * the primary color; floats above the tab bar bottom-right. Label optional for
 * an extended variant.
 */
function AddButton({
  onClick,
  label,
  style
}) {
  const extended = Boolean(label);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    "aria-label": label || 'Add',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 56,
      width: extended ? 'auto' : 56,
      padding: extended ? '0 22px 0 18px' : 0,
      borderRadius: 'var(--r-pill)',
      border: 0,
      cursor: 'pointer',
      background: 'var(--primary)',
      color: 'var(--text-on-primary)',
      boxShadow: 'var(--shadow-fab)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.PlusIcon, {
    size: 24
  }), extended ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--t-subheading)',
      fontWeight: 600
    }
  }, label) : null);
}
Object.assign(__ds_scope, { AddButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AddButton.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
const ICONS = {
  inbox: __ds_scope.InboxIcon,
  library: __ds_scope.LibraryIcon,
  search: __ds_scope.SearchIcon
};
const DEFAULT_TABS = [{
  key: 'inbox',
  label: 'Inbox'
}, {
  key: 'library',
  label: 'Library'
}, {
  key: 'search',
  label: 'Search'
}];

/**
 * TabBar — modern floating bottom navigation (Inbox · Library · Search).
 * The bar detaches from the bottom edge as a rounded, shadowed pill; the active
 * tab expands into a primary-soft pill showing its label, while inactive tabs
 * stay as quiet icons. Each target meets the 44pt minimum; safe-area inset is
 * applied below the floating bar.
 */
function TabBar({
  active = 'inbox',
  tabs = DEFAULT_TABS,
  onChange,
  badge = {},
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: 'var(--surface-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-pill)',
      padding: 6,
      margin: '0 16px',
      marginBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
      boxShadow: 'var(--shadow-lg)',
      ...style
    }
  }, tabs.map(t => {
    const Icon = ICONS[t.key] || __ds_scope.InboxIcon;
    const isActive = active === t.key;
    return /*#__PURE__*/React.createElement("button", {
      key: t.key,
      type: "button",
      onClick: () => onChange && onChange(t.key),
      "aria-current": isActive ? 'page' : undefined,
      style: {
        flex: isActive ? '1 1 auto' : '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 'var(--touch-min)',
        padding: isActive ? '0 18px' : '0 13px',
        border: 0,
        cursor: 'pointer',
        borderRadius: 'var(--r-pill)',
        background: isActive ? 'var(--primary-soft)' : 'transparent',
        color: isActive ? 'var(--primary)' : 'var(--text-tertiary)',
        transition: 'background .22s ease, color .18s ease, flex .26s ease, padding .26s ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        display: 'inline-flex',
        flex: '0 0 auto'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 22
    }), badge[t.key] ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -4,
        right: -8,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 'var(--r-pill)',
        background: 'var(--primary)',
        color: 'var(--text-on-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 700,
        display: 'grid',
        placeItems: 'center',
        boxSizing: 'border-box',
        border: '1.5px solid var(--surface-raised)'
      }
    }, badge[t.key]) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        maxWidth: isActive ? 90 : 0,
        opacity: isActive ? 1 : 0,
        transition: 'max-width .26s ease, opacity .2s ease'
      }
    }, t.label));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/infobucket-app/data.js
try { (() => {
/* InfoBucket — mock catalogue for the UI kit. Plain global (window.IB_DATA). */
window.IB_DATA = {
  buckets: [{
    id: 'ml',
    name: 'Machine learning',
    description: 'Papers and explainers I actually want to finish, not just bookmark.',
    count: 24,
    sources: ['article', 'document', 'video']
  }, {
    id: 'recipes',
    name: 'Recipes',
    description: 'Weeknight-fast, mostly one-pan. Things I would actually cook.',
    count: 11,
    sources: ['reel', 'article']
  }, {
    id: 'climate',
    name: 'Climate',
    description: 'Long reads on energy, policy and the grid. The hopeful ones.',
    count: 8,
    sources: ['article', 'document']
  }, {
    id: 'design',
    name: 'Design notes',
    description: 'Interfaces, type and motion worth stealing from later.',
    count: 17,
    sources: ['reel', 'video', 'article']
  }, {
    id: 'money',
    name: 'Money',
    description: 'Plain-language finance. Index funds, taxes, the boring wins.',
    count: 6,
    sources: ['article', 'document']
  }, {
    id: 'travel',
    name: 'Japan trip',
    description: 'Itineraries, neighbourhoods and a few places to eat in spring.',
    count: 13,
    sources: ['reel', 'article', 'note']
  }],
  inbox: [{
    id: 'i1',
    source: 'article',
    sourceName: 'The Atlantic',
    status: 'ready',
    title: 'How transformers actually learn',
    summary: "Attention isn't memory — it's a learned routing of which earlier tokens matter for the next one. The piece reframes 'understanding' as repeated, cheap lookups rather than storage, which is why scale keeps helping.",
    tags: ['ml', 'to-read'],
    proposedBucket: {
      name: 'Machine learning'
    },
    url: 'theatlantic.com/transformers',
    note: ''
  }, {
    id: 'i2',
    source: 'video',
    sourceName: 'Veritasium',
    status: 'processing',
    title: '',
    summary: '',
    tags: [],
    proposedBucket: null,
    url: 'youtube.com/watch?v=abc',
    note: ''
  }, {
    id: 'i3',
    source: 'reel',
    sourceName: '@weeknightcooks',
    status: 'expiring',
    daysLeft: 3,
    title: 'Brown butter is the whole trick',
    summary: 'Brown the butter first, then bloom the spices in it — the order is the point. Fifteen seconds of patience changes the base flavour of everything that comes after.',
    tags: ['cooking'],
    proposedBucket: {
      name: 'Recipes',
      isNew: true
    },
    url: 'instagram.com/reel/xyz',
    note: 'Try with the lentil thing.'
  }, {
    id: 'i4',
    source: 'document',
    sourceName: 'grid-report.pdf',
    status: 'ready',
    title: 'The grid is the bottleneck',
    summary: 'Interconnection queues, not generation, now gate clean-energy buildout. The report argues permitting reform beats new subsidies for the next decade of decarbonisation.',
    tags: ['energy', 'policy'],
    proposedBucket: {
      name: 'Climate'
    },
    url: 'files/grid-report.pdf',
    note: ''
  }, {
    id: 'i5',
    source: 'article',
    sourceName: 'A List Apart',
    status: 'expiring',
    daysLeft: 6,
    title: 'Designing calm software',
    summary: 'Calm tools ask for attention only when they have earned it. A short manifesto for interfaces that sit in the periphery and step forward exactly once, with the right thing.',
    tags: ['design', 'ux'],
    proposedBucket: {
      name: 'Design notes'
    },
    url: 'alistapart.com/calm',
    note: ''
  }],
  bucketItems: {
    ml: [{
      id: 'm1',
      source: 'document',
      sourceName: 'arXiv',
      status: 'saved',
      title: 'Attention is all you need',
      summary: 'The original transformer paper. Self-attention replaces recurrence; positions are encoded, not remembered.',
      tags: ['foundational']
    }, {
      id: 'm2',
      source: 'article',
      sourceName: 'Distill',
      status: 'saved',
      title: 'A visual intro to attention',
      summary: 'Interactive diagrams that make query-key-value click. Best first read before the paper above.',
      tags: ['intro', 'visual']
    }, {
      id: 'm3',
      source: 'video',
      sourceName: '3Blue1Brown',
      status: 'saved',
      title: 'But what is a GPT?',
      summary: 'Geometric intuition for embeddings and the logit lens. Worth the full 27 minutes.',
      tags: ['intro']
    }]
  },
  archive: [{
    id: 'a1',
    source: 'article',
    sourceName: 'Wired',
    status: 'archived',
    daysLeft: 12,
    title: 'The quiet death of the RSS reader',
    summary: 'A nostalgic but clear-eyed look at why chronological feeds lost, and what we gave up when they did.',
    tags: ['internet']
  }, {
    id: 'a2',
    source: 'reel',
    sourceName: '@studiokoto',
    status: 'archived',
    daysLeft: 4,
    title: 'One-line kerning fix',
    summary: 'A fifteen-second trick for optical spacing in display type. Saved it, never sorted it.',
    tags: ['type']
  }, {
    id: 'a3',
    source: 'video',
    sourceName: 'Kurzgesagt',
    status: 'archived',
    daysLeft: 18,
    title: 'How big is the universe, really?',
    summary: 'A calm scale tour from the observable edge inward. Pretty, but I never made time.',
    tags: ['science']
  }],
  searchResults: [{
    id: 's1',
    source: 'document',
    sourceName: 'arXiv',
    status: 'saved',
    bucket: 'Machine learning',
    match: 0.96,
    title: 'Attention is all you need',
    summary: 'Self-attention replaces recurrence; the model routes information between tokens directly.',
    tags: ['foundational']
  }, {
    id: 's2',
    source: 'article',
    sourceName: 'The Atlantic',
    status: 'ready',
    bucket: null,
    match: 0.88,
    title: 'How transformers actually learn',
    summary: "Attention is a learned routing of which earlier tokens matter — understanding as cheap, repeated lookups.",
    tags: ['ml']
  }, {
    id: 's3',
    source: 'video',
    sourceName: '3Blue1Brown',
    status: 'saved',
    bucket: 'Machine learning',
    match: 0.81,
    title: 'But what is a GPT?',
    summary: 'Geometric intuition for embeddings and attention, built up from dot products.',
    tags: ['intro']
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/infobucket-app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/infobucket-app/screens-aux.jsx
try { (() => {
/* InfoBucket UI kit — aux screens: Search, Archive, Capture/Share, Add, Create
   bucket, Settings. */
(function () {
  const DS = window.InfoBucketDesignSystem_7416d2;
  const {
    SourceStamp,
    StatusBadge,
    Tag,
    Button,
    TextField,
    NoteField,
    SearchField,
    EmptyState,
    ItemCard,
    SearchIcon,
    ArchiveIcon,
    LinkIcon,
    ClockIcon,
    XIcon,
    CheckIcon,
    SettingsIcon,
    ChevronRightIcon
  } = DS;
  const D = window.IB_DATA;
  const Header = p => window.IB_Header(p);
  const SectionLabel = ({
    children,
    style
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-meta)',
      letterSpacing: 'var(--t-meta-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      ...style
    }
  }, children);

  /* ---- Search ---------------------------------------------------------- */
  function SearchScreen() {
    const [q, setQ] = React.useState('');
    const [active, setActive] = React.useState(null);
    const results = D.searchResults;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 12px 8px',
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        borderBottom: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement(SearchField, {
      value: q,
      onChange: setQ,
      onClear: () => setQ(''),
      autoFocus: true,
      placeholder: "Search everything"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 7,
        marginTop: 10,
        flexWrap: 'wrap'
      }
    }, ['Machine learning', 'Recipes', 'Design notes'].map(b => /*#__PURE__*/React.createElement("button", {
      key: b,
      type: "button",
      onClick: () => setActive(active === b ? null : b),
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-label)',
        padding: '6px 11px',
        cursor: 'pointer',
        borderRadius: 'var(--r-pill)',
        border: '1px solid ' + (active === b ? 'var(--primary-soft-2)' : 'var(--border)'),
        background: active === b ? 'var(--primary-soft)' : 'var(--surface)',
        color: active === b ? 'var(--primary)' : 'var(--text-secondary)'
      }
    }, b)))), q.trim() === '' ? /*#__PURE__*/React.createElement(EmptyState, {
      icon: /*#__PURE__*/React.createElement(SearchIcon, {
        size: 26
      }),
      title: "Search everything",
      body: "Find anything you saved \u2014 by meaning, not just the words you remember."
    }) : /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-card)'
      }
    }, /*#__PURE__*/React.createElement(SectionLabel, {
      style: {
        padding: '0 2px 2px'
      }
    }, "Best matches"), results.map(r => /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 9
      }
    }, /*#__PURE__*/React.createElement(SourceStamp, {
      source: r.source,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-meta)',
        letterSpacing: 'var(--t-meta-tracking)',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, r.source, " \xB7 ", r.sourceName, r.bucket ? ` · ${r.bucket}` : ''), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-micro)',
        color: 'var(--primary)'
      }
    }, Math.round(r.match * 100), "%")), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: '0 0 5px',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-subheading)',
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, r.title), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-read)',
        fontSize: 'var(--t-read-sm)',
        lineHeight: 'var(--t-read-sm-lh)',
        color: 'var(--text-secondary)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }
    }, r.summary)))));
  }

  /* ---- Archive --------------------------------------------------------- */
  function ArchiveScreen({
    back
  }) {
    const [items, setItems] = React.useState(D.archive);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: "Archive",
      onBack: back,
      sub: "Recoverable \xB7 auto-deletes"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 var(--gutter) 12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 9,
        alignItems: 'flex-start',
        padding: '12px 14px',
        background: 'var(--status-archived-soft)',
        borderRadius: 'var(--r-md)',
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement(ClockIcon, {
      size: 18,
      style: {
        color: 'var(--text-secondary)',
        flex: 'none',
        marginTop: 1
      }
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--t-body-sm)',
        lineHeight: 1.45,
        color: 'var(--text-secondary)'
      }
    }, "Items not sorted within 7 days land here. Save any to a bucket to keep it \u2014 otherwise it deletes after 20 days.")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-card)'
      }
    }, items.map(it => /*#__PURE__*/React.createElement("div", {
      key: it.id,
      style: {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 14,
        opacity: 0.96
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 9
      }
    }, /*#__PURE__*/React.createElement(SourceStamp, {
      source: it.source,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-meta)',
        letterSpacing: 'var(--t-meta-tracking)',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)'
      }
    }, it.source, " \xB7 ", it.sourceName), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-micro)',
        letterSpacing: 'var(--t-micro-tracking)',
        textTransform: 'uppercase',
        color: 'var(--accent)'
      }
    }, /*#__PURE__*/React.createElement(ClockIcon, {
      size: 12
    }), " In ", it.daysLeft, " days")), /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: '0 0 5px',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-subheading)',
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, it.title), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '0 0 12px',
        fontFamily: 'var(--font-read)',
        fontSize: 'var(--t-read-sm)',
        lineHeight: 'var(--t-read-sm-lh)',
        color: 'var(--text-secondary)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }
    }, it.summary), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setItems(xs => xs.filter(x => x.id !== it.id))
    }, "Save to a bucket"))), items.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
      icon: /*#__PURE__*/React.createElement(ArchiveIcon, {
        size: 26
      }),
      title: "Archive is empty",
      body: "Sorted items stay in their buckets. Nothing is aging out."
    }) : null)));
  }

  /* ---- Capture / share extension (minimal sheet) ----------------------- */
  function CaptureScreen({
    back
  }) {
    const [note, setNote] = React.useState('');
    const [rec, setRec] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(10,16,22,.42)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg)',
        borderTopLeftRadius: 'var(--r-xl)',
        borderTopRightRadius: 'var(--r-xl)',
        padding: '10px 18px 26px',
        boxShadow: 'var(--shadow-lg)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 38,
        height: 4,
        borderRadius: 2,
        background: 'var(--border-strong)',
        margin: '0 auto 16px'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-heading)',
        fontWeight: 700,
        color: 'var(--text-primary)'
      }
    }, "Save to InfoBucket"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: back,
      "aria-label": "Cancel",
      style: {
        display: 'grid',
        placeItems: 'center',
        width: 32,
        height: 32,
        border: 0,
        borderRadius: '50%',
        background: 'var(--bg-sunken)',
        cursor: 'pointer',
        color: 'var(--text-secondary)'
      }
    }, /*#__PURE__*/React.createElement(XIcon, {
      size: 15
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: 12,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(SourceStamp, {
      source: "article",
      size: "md"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-body)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, "The case for calm software"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 3,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-meta)',
        color: 'var(--text-tertiary)'
      }
    }, /*#__PURE__*/React.createElement(LinkIcon, {
      size: 12
    }), " alistapart.com"))), /*#__PURE__*/React.createElement(NoteField, {
      label: "Quick note",
      value: note,
      onChange: setNote,
      recording: rec,
      onDictate: () => setRec(r => !r),
      rows: 2,
      placeholder: "Why are you saving this?"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      iconLeft: saved ? /*#__PURE__*/React.createElement(CheckIcon, {
        size: 18
      }) : null,
      onClick: () => {
        setSaved(true);
        setTimeout(back, 700);
      }
    }, saved ? 'Saved to Inbox' : 'Save'))));
  }

  /* ---- Add (manual) ---------------------------------------------------- */
  function AddScreen({
    back
  }) {
    const [url, setUrl] = React.useState('');
    const [note, setNote] = React.useState('');
    const [rec, setRec] = React.useState(false);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: "Add",
      onBack: back
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }
    }, /*#__PURE__*/React.createElement(TextField, {
      label: "Link",
      value: url,
      onChange: setUrl,
      placeholder: "Paste a URL",
      iconLeft: /*#__PURE__*/React.createElement(LinkIcon, {
        size: 18
      })
    }), /*#__PURE__*/React.createElement(NoteField, {
      value: note,
      onChange: setNote,
      recording: rec,
      onDictate: () => setRec(r => !r)
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-read)',
        fontSize: 'var(--t-read-sm)',
        lineHeight: 'var(--t-read-sm-lh)',
        color: 'var(--text-tertiary)'
      }
    }, "Or share a link straight from any app \u2014 InfoBucket appears in the share sheet."), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      onClick: back
    }, "Save")));
  }

  /* ---- Create / edit bucket -------------------------------------------- */
  function CreateBucketScreen({
    ctx,
    back
  }) {
    const editing = ctx && ctx.bucketId;
    const existing = editing ? D.buckets.find(b => b.id === ctx.bucketId) : null;
    const [name, setName] = React.useState(existing ? existing.name : '');
    const [desc, setDesc] = React.useState(existing ? existing.description : '');
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: editing ? 'Edit bucket' : 'New bucket',
      onBack: back
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }
    }, /*#__PURE__*/React.createElement(TextField, {
      label: "Name",
      value: name,
      onChange: setName,
      placeholder: "e.g. Machine learning"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(NoteField, {
      label: "Description",
      value: desc,
      onChange: setDesc,
      rows: 3,
      placeholder: "What belongs here?"
    }), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '8px 2px 0',
        fontFamily: 'var(--font-read)',
        fontSize: 'var(--t-read-sm)',
        lineHeight: 'var(--t-read-sm-lh)',
        color: 'var(--text-tertiary)'
      }
    }, "The description helps InfoBucket route new saves to the right bucket \u2014 be specific about what fits.")), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      onClick: back
    }, editing ? 'Save changes' : 'Create bucket')));
  }

  /* ---- Settings -------------------------------------------------------- */
  function SettingsScreen({
    go,
    back,
    accent,
    setAccent
  }) {
    const Row = ({
      label,
      value,
      onClick
    }) => /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClick,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        padding: '15px 16px',
        background: 'var(--surface)',
        border: 0,
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--t-body)',
        fontWeight: 500,
        color: 'var(--text-primary)'
      }
    }, label), value ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-label)',
        color: 'var(--text-tertiary)'
      }
    }, value) : null, /*#__PURE__*/React.createElement(ChevronRightIcon, {
      size: 18,
      style: {
        color: 'var(--text-tertiary)'
      }
    }));
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: "Settings",
      onBack: back
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 13
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: 'var(--primary-soft)',
        color: 'var(--primary)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 700
      }
    }, "S"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-subheading)',
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, "Simone"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-meta)',
        color: 'var(--text-tertiary)'
      }
    }, "simone@infobucket.app"))), /*#__PURE__*/React.createElement("div", {
      style: {
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement(Row, {
      label: "Manage buckets",
      value: `${D.buckets.length}`,
      onClick: () => go('library')
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Archive",
      value: `${D.archive.length}`,
      onClick: () => go('archive')
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Account",
      onClick: () => {}
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, {
      style: {
        marginBottom: 8
      }
    }, "Accent"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 16,
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap'
      }
    }, (window.IB_ACCENTS || []).map(a => /*#__PURE__*/React.createElement("button", {
      key: a.key,
      type: "button",
      onClick: () => setAccent && setAccent(a.key),
      "aria-label": 'Accent ' + a.key,
      title: a.key,
      style: {
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: a.hex,
        cursor: 'pointer',
        padding: 0,
        border: accent === a.key ? '3px solid var(--text-primary)' : '3px solid var(--surface)',
        boxShadow: '0 0 0 1px var(--border)',
        display: 'grid',
        placeItems: 'center'
      }
    }, accent === a.key ? /*#__PURE__*/React.createElement(CheckIcon, {
      size: 18,
      style: {
        color: '#fff'
      }
    }) : null)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, {
      style: {
        marginBottom: 8
      }
    }, "How the lifecycle works"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, [['7 days', 'Unsorted Inbox items move to Archive — still recoverable.'], ['+20 days', 'Archived items delete themselves to keep things calm.'], ['Saved', 'Anything in a bucket stays forever.']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-label)',
        color: 'var(--primary)',
        width: 64,
        flex: 'none'
      }
    }, k), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-read)',
        fontSize: 'var(--t-read-sm)',
        lineHeight: 'var(--t-read-sm-lh)',
        color: 'var(--text-secondary)'
      }
    }, v)))))));
  }
  window.IB_SCREENS = Object.assign(window.IB_SCREENS || {}, {
    search: SearchScreen,
    archive: ArchiveScreen,
    capture: CaptureScreen,
    add: AddScreen,
    createBucket: CreateBucketScreen,
    settings: SettingsScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/infobucket-app/screens-aux.jsx", error: String((e && e.message) || e) }); }

// ui_kits/infobucket-app/screens-main.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* InfoBucket UI kit — primary screens: Inbox, Review, Library, Bucket detail. */
(function () {
  const DS = window.InfoBucketDesignSystem_7416d2;
  const {
    ItemCard,
    BucketCard,
    SourceStamp,
    StatusBadge,
    BucketChip,
    Tag,
    Button,
    NoteField,
    SearchField,
    EmptyState,
    SettingsIcon,
    RefreshIcon,
    TrashIcon,
    LinkIcon,
    PlusIcon,
    InboxIcon,
    ClockIcon
  } = DS;
  const D = window.IB_DATA;
  const Header = p => window.IB_Header(p);
  const HeaderAction = ({
    icon,
    onClick,
    label
  }) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    "aria-label": label,
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 40,
      height: 40,
      flex: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-secondary)'
    }
  }, icon);
  const SectionLabel = ({
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-meta)',
      letterSpacing: 'var(--t-meta-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      padding: '4px 4px 0'
    }
  }, children);

  /* ---- Inbox ----------------------------------------------------------- */
  function InboxScreen({
    go
  }) {
    const [items, setItems] = React.useState(D.inbox);
    const accept = id => setItems(xs => xs.filter(x => x.id !== id));
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: "Inbox",
      sub: `Thursday · ${items.length} to review`,
      right: /*#__PURE__*/React.createElement(HeaderAction, {
        icon: /*#__PURE__*/React.createElement(SettingsIcon, {
          size: 22
        }),
        label: "Settings",
        onClick: () => go('settings')
      })
    }), items.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
      icon: /*#__PURE__*/React.createElement(InboxIcon, {
        size: 26
      }),
      title: "All sorted",
      body: "Nothing to review. New saves land here as they arrive."
    }) : /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-card)'
      }
    }, items.map(it => /*#__PURE__*/React.createElement(ItemCard, _extends({
      key: it.id
    }, it, {
      onClick: () => go('review', {
        itemId: it.id
      }),
      onAccept: () => accept(it.id)
    })))));
  }

  /* ---- Review / detail ------------------------------------------------- */
  function ReviewScreen({
    ctx,
    go,
    back
  }) {
    const item = D.inbox.find(x => x.id === ctx.itemId) || D.inbox[0];
    const [tags, setTags] = React.useState(item.tags);
    const [note, setNote] = React.useState(item.note || '');
    const [rec, setRec] = React.useState(false);
    const [confirmed, setConfirmed] = React.useState(false);
    const [regen, setRegen] = React.useState(false);
    const otherBuckets = D.buckets.filter(b => b.name !== (item.proposedBucket && item.proposedBucket.name)).slice(0, 4);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: "Review",
      onBack: back,
      right: /*#__PURE__*/React.createElement(HeaderAction, {
        icon: /*#__PURE__*/React.createElement(LinkIcon, {
          size: 20
        }),
        label: "Open source",
        onClick: () => {}
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(SourceStamp, {
      source: item.source,
      size: "lg"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-meta)',
        letterSpacing: 'var(--t-meta-tracking)',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)'
      }
    }, item.source, " \xB7 ", item.sourceName), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: item.status
    }, item.status === 'expiring' ? `In ${item.daysLeft} days` : undefined)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: '0 0 10px',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-title)',
        lineHeight: 'var(--t-title-lh)',
        fontWeight: 700,
        color: 'var(--text-primary)'
      }
    }, item.title), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontFamily: 'var(--font-read)',
        fontSize: 'var(--t-read-lg)',
        lineHeight: 'var(--t-read-lg-lh)',
        color: 'var(--text-primary)'
      }
    }, item.summary), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(RefreshIcon, {
        size: 16
      }),
      onClick: () => {
        setRegen(true);
        setTimeout(() => setRegen(false), 1100);
      }
    }, regen ? 'Regenerating…' : 'Regenerate'))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Bucket"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, item.proposedBucket ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(BucketChip, {
      name: item.proposedBucket.name,
      isNew: item.proposedBucket.isNew,
      confirmed: confirmed,
      onAccept: () => setConfirmed(true)
    }), !confirmed ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--t-body-sm)',
        color: 'var(--text-tertiary)'
      }
    }, "proposed for you") : /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--t-body-sm)',
        color: 'var(--success)'
      }
    }, "saved")) : null, !confirmed ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--t-body-sm)',
        color: 'var(--text-tertiary)'
      }
    }, "or pick another"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, otherBuckets.map(b => /*#__PURE__*/React.createElement("button", {
      key: b.id,
      type: "button",
      onClick: () => setConfirmed(true),
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--t-body-sm)',
        fontWeight: 600,
        padding: '8px 13px',
        borderRadius: 'var(--r-pill)',
        cursor: 'pointer',
        border: '1.5px solid var(--border-strong)',
        background: 'var(--surface)',
        color: 'var(--text-primary)'
      }
    }, b.name)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => go('createBucket'),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--t-body-sm)',
        fontWeight: 600,
        padding: '8px 13px 8px 10px',
        borderRadius: 'var(--r-pill)',
        cursor: 'pointer',
        border: '1.5px dashed var(--border-strong)',
        background: 'transparent',
        color: 'var(--primary)'
      }
    }, /*#__PURE__*/React.createElement(PlusIcon, {
      size: 15
    }), " New bucket"))) : null)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Tags"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center'
      }
    }, tags.map(t => /*#__PURE__*/React.createElement(Tag, {
      key: t,
      removable: true,
      onRemove: () => setTags(xs => xs.filter(x => x !== t))
    }, t)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setTags(xs => [...xs, 'new-tag']),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 11px 5px 9px',
        borderRadius: 'var(--r-pill)',
        border: '1px dashed var(--border-strong)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-label)'
      }
    }, /*#__PURE__*/React.createElement(PlusIcon, {
      size: 13
    }), " add"))), /*#__PURE__*/React.createElement(NoteField, {
      value: note,
      onChange: setNote,
      recording: rec,
      onDictate: () => setRec(r => !r)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingTop: 4,
        paddingBottom: 24
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      iconLeft: /*#__PURE__*/React.createElement(TrashIcon, {
        size: 17
      }),
      onClick: back,
      fullWidth: true
    }, "Delete"))));
  }

  /* ---- Library --------------------------------------------------------- */
  function LibraryScreen({
    go
  }) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: "Library",
      sub: `${D.buckets.length} buckets`,
      right: /*#__PURE__*/React.createElement(HeaderAction, {
        icon: /*#__PURE__*/React.createElement(SettingsIcon, {
          size: 22
        }),
        label: "Settings",
        onClick: () => go('settings')
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        paddingBottom: 110
      }
    }, D.buckets.map(b => /*#__PURE__*/React.createElement(BucketCard, _extends({
      key: b.id
    }, b, {
      onClick: () => go('bucketDetail', {
        bucketId: b.id
      })
    })))));
  }

  /* ---- Bucket detail --------------------------------------------------- */
  function BucketDetailScreen({
    ctx,
    go,
    back
  }) {
    const bucket = D.buckets.find(b => b.id === ctx.bucketId) || D.buckets[0];
    const items = D.bucketItems[bucket.id] || D.bucketItems.ml;
    const [q, setQ] = React.useState('');
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
      title: bucket.name,
      onBack: back,
      sub: `${bucket.count} saved`,
      right: /*#__PURE__*/React.createElement(HeaderAction, {
        icon: /*#__PURE__*/React.createElement(SettingsIcon, {
          size: 20
        }),
        label: "Edit bucket",
        onClick: () => go('createBucket', {
          bucketId: bucket.id
        })
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gutter)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-card)'
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '0 0 2px',
        fontFamily: 'var(--font-read)',
        fontSize: 'var(--t-read-sm)',
        lineHeight: 'var(--t-read-sm-lh)',
        color: 'var(--text-secondary)'
      }
    }, bucket.description), /*#__PURE__*/React.createElement(SearchField, {
      value: q,
      onChange: setQ,
      onClear: () => setQ(''),
      placeholder: `Search in ${bucket.name}`
    }), items.map(it => /*#__PURE__*/React.createElement(ItemCard, _extends({
      key: it.id
    }, it, {
      onClick: () => {}
    })))));
  }
  window.IB_SCREENS = Object.assign(window.IB_SCREENS || {}, {
    inbox: InboxScreen,
    review: ReviewScreen,
    library: LibraryScreen,
    bucketDetail: BucketDetailScreen
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/infobucket-app/screens-main.jsx", error: String((e && e.message) || e) }); }

// ui_kits/infobucket-app/shell.jsx
try { (() => {
/* InfoBucket UI kit — app shell: phone frame, status bar, router, tab bar, FAB,
   light/dark toggle. Reads screens off window.IB_SCREENS. */
const DS = window.InfoBucketDesignSystem_7416d2;
const {
  TabBar,
  AddButton,
  SettingsIcon,
  ChevronRightIcon
} = DS;

/* User-selectable accent themes (mirror tokens/accents.css). */
const IB_ACCENTS = [{
  key: 'olive',
  hex: '#7CA84F'
}, {
  key: 'cobalt',
  hex: '#2D5AD9'
}, {
  key: 'seafoam',
  hex: '#12A199'
}, {
  key: 'blush',
  hex: '#DC6F94'
}, {
  key: 'tangerine',
  hex: '#E5731F'
}, {
  key: 'oxblood',
  hex: '#8E2E3C'
}];
window.IB_ACCENTS = IB_ACCENTS;

/* ---- Shared screen header --------------------------------------------- */
function Header({
  title,
  onBack,
  right,
  sub
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px 10px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 5
    }
  }, onBack ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    "aria-label": "Back",
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 40,
      height: 40,
      flex: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-primary)',
      transform: 'scaleX(-1)'
    }
  }, /*#__PURE__*/React.createElement(ChevronRightIcon, {
    size: 22
  })) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--t-title)',
      lineHeight: 'var(--t-title-lh)',
      fontWeight: 700,
      color: 'var(--text-primary)',
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), sub ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--t-meta)',
      letterSpacing: 'var(--t-meta-tracking)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      marginTop: 2
    }
  }, sub) : null), right || null);
}
window.IB_Header = Header;

/* ---- Status bar -------------------------------------------------------- */
function StatusBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 22px 4px',
      fontFamily: 'var(--font-ui)',
      fontWeight: 600,
      fontSize: 14,
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "11",
    viewBox: "0 0 17 11",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7",
    width: "3",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.5",
    y: "5",
    width: "3",
    height: "6",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "2.5",
    width: "3",
    height: "8.5",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13.5",
    y: "0",
    width: "3",
    height: "11",
    rx: "1"
  })), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "11",
    viewBox: "0 0 16 11",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 2.2c2 0 3.8.8 5.1 2L14.4 2.9C12.7 1.2 10.5.2 8 .2S3.3 1.2 1.6 2.9L2.9 4.2C4.2 3 6 2.2 8 2.2z",
    opacity: ".9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 5.4c1.1 0 2.1.45 2.8 1.18l1.3-1.3C11 4.16 9.6 3.6 8 3.6s-3 .56-4.1 1.68l1.3 1.3C5.9 5.85 6.9 5.4 8 5.4z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "9",
    r: "1.6"
  })), /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "12",
    viewBox: "0 0 26 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "21",
    height: "11",
    rx: "3",
    stroke: "currentColor",
    opacity: ".4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "16",
    height: "8",
    rx: "1.5",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "23",
    y: "4",
    width: "1.6",
    height: "4",
    rx: "0.8",
    fill: "currentColor",
    opacity: ".5"
  }))));
}

/* ---- App shell --------------------------------------------------------- */
function App() {
  const [theme, setTheme] = React.useState('light');
  const [accent, setAccentState] = React.useState(() => {
    try {
      return localStorage.getItem('ib-accent') || 'olive';
    } catch (e) {
      return 'olive';
    }
  });
  const setAccent = a => {
    setAccentState(a);
    try {
      localStorage.setItem('ib-accent', a);
    } catch (e) {}
  };
  const [stack, setStack] = React.useState([{
    screen: 'inbox'
  }]);
  const top = stack[stack.length - 1];
  const tab = ['inbox', 'library', 'search'].includes(top.screen) ? top.screen : null;
  const go = (screen, params = {}) => setStack(s => [...s, {
    screen,
    ...params
  }]);
  const replaceTab = screen => setStack([{
    screen
  }]);
  const back = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const Screens = window.IB_SCREENS;
  const Current = Screens[top.screen] || Screens.inbox;
  const showTabs = ['inbox', 'library', 'search', 'archive'].includes(top.screen);
  const showFab = ['inbox', 'library'].includes(top.screen);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
    style: {
      fontFamily: 'var(--studio-mono)',
      fontSize: 12,
      padding: '7px 14px',
      borderRadius: 999,
      border: '1px solid #cfd8e3',
      background: '#fff',
      color: '#33414f',
      cursor: 'pointer'
    }
  }, theme === 'light' ? '◐  Dark' : '◑  Light'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => go('capture'),
    style: {
      fontFamily: 'var(--studio-mono)',
      fontSize: 12,
      padding: '7px 14px',
      borderRadius: 999,
      border: '1px solid #cfd8e3',
      background: '#fff',
      color: '#33414f',
      cursor: 'pointer'
    }
  }, "\u2934  Share sheet"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 22,
      background: '#d4dce5',
      margin: '0 2px'
    }
  }), IB_ACCENTS.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.key,
    type: "button",
    onClick: () => setAccent(a.key),
    "aria-label": 'Accent ' + a.key,
    title: a.key,
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: a.hex,
      cursor: 'pointer',
      padding: 0,
      border: accent === a.key ? '2px solid #33414f' : '2px solid #fff',
      boxShadow: '0 0 0 1px #cfd8e3'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    "data-theme": theme === 'dark' ? 'dark' : undefined,
    "data-accent": accent,
    "data-screen-label": top.screen,
    style: {
      width: 390,
      height: 820,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 46,
      background: 'var(--bg)',
      boxShadow: theme === 'dark' ? '0 0 0 10px #1c2530, 0 0 0 12px #2c3744, 0 40px 80px rgba(0,0,0,.5)' : '0 0 0 10px #11171f, 0 0 0 12px #2a3340, 0 40px 80px rgba(20,30,45,.4)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    key: top.screen + (top.itemId || top.bucketId || ''),
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(Current, {
    ctx: top,
    go: go,
    back: back,
    accent: accent,
    setAccent: setAccent
  })), showFab ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 18,
      bottom: showTabs ? 92 : 26
    }
  }, /*#__PURE__*/React.createElement(AddButton, {
    onClick: () => go('add')
  })) : null, showTabs ? /*#__PURE__*/React.createElement(TabBar, {
    active: tab || 'inbox',
    badge: {
      inbox: window.IB_DATA.inbox.length
    },
    onChange: k => replaceTab(k)
  }) : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--studio-mono)',
      fontSize: 11,
      color: '#8795a3',
      letterSpacing: '.04em'
    }
  }, "InfoBucket \xB7 tap around \u2014 buckets accept, items open, search filters"));
}
window.IB_App = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/infobucket-app/shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BucketCard = __ds_scope.BucketCard;

__ds_ns.ItemCard = __ds_scope.ItemCard;

__ds_ns.BucketChip = __ds_scope.BucketChip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.SourceStamp = __ds_scope.SourceStamp;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.ArticleIcon = __ds_scope.ArticleIcon;

__ds_ns.VideoIcon = __ds_scope.VideoIcon;

__ds_ns.ReelIcon = __ds_scope.ReelIcon;

__ds_ns.DocumentIcon = __ds_scope.DocumentIcon;

__ds_ns.NoteIcon = __ds_scope.NoteIcon;

__ds_ns.InboxIcon = __ds_scope.InboxIcon;

__ds_ns.LibraryIcon = __ds_scope.LibraryIcon;

__ds_ns.SearchIcon = __ds_scope.SearchIcon;

__ds_ns.PlusIcon = __ds_scope.PlusIcon;

__ds_ns.SettingsIcon = __ds_scope.SettingsIcon;

__ds_ns.SparkleIcon = __ds_scope.SparkleIcon;

__ds_ns.CheckIcon = __ds_scope.CheckIcon;

__ds_ns.ClockIcon = __ds_scope.ClockIcon;

__ds_ns.ArchiveIcon = __ds_scope.ArchiveIcon;

__ds_ns.TrashIcon = __ds_scope.TrashIcon;

__ds_ns.RefreshIcon = __ds_scope.RefreshIcon;

__ds_ns.MicIcon = __ds_scope.MicIcon;

__ds_ns.LinkIcon = __ds_scope.LinkIcon;

__ds_ns.ChevronRightIcon = __ds_scope.ChevronRightIcon;

__ds_ns.XIcon = __ds_scope.XIcon;

__ds_ns.AlertIcon = __ds_scope.AlertIcon;

__ds_ns.BellIcon = __ds_scope.BellIcon;

__ds_ns.FilterIcon = __ds_scope.FilterIcon;

__ds_ns.MoonIcon = __ds_scope.MoonIcon;

__ds_ns.SOURCE_ICON = __ds_scope.SOURCE_ICON;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ErrorBanner = __ds_scope.ErrorBanner;

__ds_ns.NoteField = __ds_scope.NoteField;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.AddButton = __ds_scope.AddButton;

__ds_ns.TabBar = __ds_scope.TabBar;

})();
