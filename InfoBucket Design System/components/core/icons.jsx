import React from 'react';

/* InfoBucket icon set — Lucide-style, 24×24, 1.8 stroke, currentColor.
   Mirrors lucide-react-native names so RN/Expo can swap 1:1. */

const S = ({ children, size = 24, fill = 'none', ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

/* ---- Source glyphs (provenance) ---------------------------------------- */
export const ArticleIcon = (p) => <S {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></S>;
export const VideoIcon   = (p) => <S {...p}><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none"/></S>;
export const ReelIcon    = (p) => <S {...p}><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M11 9l4 3-4 3z" fill="currentColor" stroke="none"/></S>;
export const DocumentIcon= (p) => <S {...p}><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 13h6M10 17h6"/></S>;
export const NoteIcon    = (p) => <S {...p}><path d="M5 4h14v16l-4-3-3 3-3-3-4 3z"/></S>;

/* ---- Navigation -------------------------------------------------------- */
export const InboxIcon   = (p) => <S {...p}><path d="M4 13h4l2 3h4l2-3h4"/><path d="M4 13l2-7h12l2 7v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></S>;
export const LibraryIcon = (p) => <S {...p}><rect x="4" y="4" width="6" height="16" rx="1.5"/><rect x="13" y="4" width="6" height="16" rx="1.5"/></S>;
export const SearchIcon  = (p) => <S {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></S>;
export const PlusIcon    = (p) => <S {...p}><path d="M12 5v14M5 12h14"/></S>;
export const SettingsIcon= (p) => <S {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></S>;

/* ---- Status / actions -------------------------------------------------- */
export const SparkleIcon = (p) => <S {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></S>;
export const CheckIcon   = (p) => <S {...p}><path d="M4 12.5l5 5L20 6.5"/></S>;
export const ClockIcon   = (p) => <S {...p}><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/></S>;
export const ArchiveIcon = (p) => <S {...p}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></S>;
export const TrashIcon   = (p) => <S {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></S>;
export const RefreshIcon = (p) => <S {...p}><path d="M20 11a8 8 0 1 0-1.8 5"/><path d="M20 5v6h-6"/></S>;
export const MicIcon     = (p) => <S {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></S>;
export const LinkIcon    = (p) => <S {...p}><path d="M9 15l6-6M8 12l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 12l2-2a3.5 3.5 0 0 0-5-5l-2 2"/></S>;
export const ChevronRightIcon = (p) => <S {...p}><path d="m9 6 6 6-6 6"/></S>;
export const XIcon       = (p) => <S {...p}><path d="M6 6l12 12M18 6 6 18"/></S>;
export const AlertIcon   = (p) => <S {...p}><path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17.5v.5"/></S>;
export const BellIcon    = (p) => <S {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"/></S>;
export const FilterIcon  = (p) => <S {...p}><path d="M3 5h18l-7 8v5l-4 2v-7z"/></S>;
export const MoonIcon    = (p) => <S {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/></S>;

/* Map a source key -> its glyph */
export const SOURCE_ICON = {
  article: ArticleIcon,
  video: VideoIcon,
  reel: ReelIcon,
  document: DocumentIcon,
  note: NoteIcon,
};
