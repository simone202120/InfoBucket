/**
 * Set di icone dell'app — wrapper su lucide-react-native con default coerenti
 * (size 24, strokeWidth 1.8). I componenti del design system importano da qui,
 * mai direttamente da lucide, così i default restano in un unico posto.
 *
 * I nomi esposti rispecchiano quelli usati dal design system web
 * (vedi "InfoBucket Design System"/components/core/icons.jsx) mappati 1:1 sui
 * glifi Lucide. Il colore arriva via prop `color` (di norma dal tema).
 */
import { createElement } from 'react';
import {
  AlertTriangle,
  Archive,
  Bell,
  Check,
  ChevronRight,
  Clock,
  File,
  FileText,
  Film,
  Filter,
  Inbox,
  Library,
  Link,
  Mic,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  Trash2,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react-native';
import type { SourceType } from '../types/domain';

/** Default condivisi: tratto e dimensione del set InfoBucket. */
const DEFAULT_SIZE = 24;
const DEFAULT_STROKE = 1.8;

export type IconProps = LucideProps;

/** Avvolge un'icona Lucide applicando i default del design system. */
function withDefaults(Icon: LucideIcon): (props: IconProps) => JSX.Element {
  const Wrapped = (props: IconProps): JSX.Element =>
    createElement(Icon, { size: DEFAULT_SIZE, strokeWidth: DEFAULT_STROKE, ...props });
  Wrapped.displayName = `Icon(${Icon.displayName ?? 'Lucide'})`;
  return Wrapped;
}

/* ---- Glifi di provenienza (fonte) -------------------------------------- */
export const ArticleIcon = withDefaults(FileText);
export const VideoIcon = withDefaults(Play);
export const ReelIcon = withDefaults(Film);
export const DocumentIcon = withDefaults(File);
export const NoteIcon = withDefaults(StickyNote);

/* ---- Navigazione ------------------------------------------------------- */
export const InboxIcon = withDefaults(Inbox);
export const LibraryIcon = withDefaults(Library);
export const SearchIcon = withDefaults(Search);
export const PlusIcon = withDefaults(Plus);
export const SettingsIcon = withDefaults(Settings);

/* ---- Stato / azioni ---------------------------------------------------- */
export const SparkleIcon = withDefaults(Sparkles);
export const CheckIcon = withDefaults(Check);
export const ClockIcon = withDefaults(Clock);
export const ArchiveIcon = withDefaults(Archive);
export const TrashIcon = withDefaults(Trash2);
export const RefreshIcon = withDefaults(RefreshCw);
export const MicIcon = withDefaults(Mic);
export const LinkIcon = withDefaults(Link);
export const ChevronRightIcon = withDefaults(ChevronRight);
export const XIcon = withDefaults(X);
export const AlertIcon = withDefaults(AlertTriangle);
export const BellIcon = withDefaults(Bell);
export const FilterIcon = withDefaults(Filter);
export const MoonIcon = withDefaults(Moon);

export type IconComponent = (props: IconProps) => JSX.Element;

/**
 * Chiave cromatica di provenienza (come `theme.sourceColor`): article/video/
 * reel/document/note. È il dominio "visivo" della fonte, distinto dal
 * `SourceType` di dominio.
 */
export type SourceColorKey = 'article' | 'video' | 'reel' | 'document' | 'note';

/** Glifo per ciascuna chiave cromatica di provenienza. */
export const SOURCE_COLOR_ICON: Record<SourceColorKey, IconComponent> = {
  article: ArticleIcon,
  video: VideoIcon,
  reel: ReelIcon,
  document: DocumentIcon,
  note: NoteIcon,
};

/**
 * Glifo per ciascun `SourceType` di dominio. Coerente con `theme.sourceColor`:
 * youtube→video, reel/tiktok→social/reel, document→document, other→note.
 */
export const SOURCE_ICON: Record<SourceType, IconComponent> = {
  article: ArticleIcon,
  youtube: VideoIcon,
  reel: ReelIcon,
  tiktok: ReelIcon,
  document: DocumentIcon,
  other: NoteIcon,
};
