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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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

/* ---- Loghi brand reali (multicolore) ----------------------------------- */
/**
 * I loghi brand sono disegnati a colori del marchio e ignorano la prop `color`
 * (salvo TikTok, la cui nota adatta il colore al tema per restare leggibile su
 * fondo chiaro/scuro). Restano forme note, ridisegnate come SVG vettoriali.
 */
export interface BrandLogoProps {
  size?: number;
  /** Usato solo dai marchi monocromatici (TikTok); gli altri lo ignorano. */
  color?: string;
}

/** Logo YouTube: badge rosso con triangolo play bianco. */
export function YouTubeLogo({ size = DEFAULT_SIZE }: BrandLogoProps): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={1} y={5} width={22} height={14} rx={4} fill="#FF0000" />
      <Path d="M10 8.5 L16 12 L10 15.5 Z" fill="#FFFFFF" />
    </Svg>
  );
}

/** Logo Instagram: fotocamera stilizzata (cornice + obiettivo + flash). */
export function InstagramLogo({ size = DEFAULT_SIZE }: BrandLogoProps): JSX.Element {
  const brand = '#E1306C';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={5} stroke={brand} strokeWidth={2} />
      <Circle cx={12} cy={12} r={4} stroke={brand} strokeWidth={2} />
      <Circle cx={17.2} cy={6.8} r={1.3} fill={brand} />
    </Svg>
  );
}

/** Logo TikTok: nota musicale con l'eco ciano/rosso del marchio. La nota
 *  principale prende il colore passato (di norma quello di provenienza), così
 *  resta leggibile sia su fondo chiaro sia su fondo scuro. */
export function TikTokLogo({ size = DEFAULT_SIZE, color = '#111111' }: BrandLogoProps): JSX.Element {
  const note =
    'M15 3c.2 2 1.6 3.6 3.6 3.8v2.8c-1.3 0-2.5-.4-3.6-1.1v5.6a5.3 5.3 0 11-5.3-5.3c.3 0 .6 0 .9.1v2.9a2.4 2.4 0 102.4 2.4V3H15z';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={note} fill="#25F4EE" translateX={0.9} translateY={-0.4} />
      <Path d={note} fill="#FE2C55" translateX={-0.9} translateY={0.4} />
      <Path d={note} fill={color} />
    </Svg>
  );
}

/* ---- Glifi duotone (documento / nota / articolo) ----------------------- */
/**
 * Glifi a due livelli: un riempimento tenue (stessa tinta, opacità bassa) sotto
 * il tratto pieno. Usano la prop `color` (la tinta di provenienza dal tema).
 */
export interface DuotoneGlyphProps {
  size?: number;
  color?: string;
}

const DUOTONE_SOFT = 0.18;

/** Documento: pagina con angolo piegato e righe di testo. */
export function DocumentGlyph({ size = DEFAULT_SIZE, color = '#000000' }: DuotoneGlyphProps): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" fill={color} opacity={DUOTONE_SOFT} />
      <Path d="M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth={1.6} />
      <Path d="M14 3v4h4" stroke={color} strokeWidth={1.6} />
      <Path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** Nota: foglietto con angolo ripiegato e poche righe. */
export function NoteGlyph({ size = DEFAULT_SIZE, color = '#000000' }: DuotoneGlyphProps): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4h14v10l-5 5H5z" fill={color} opacity={DUOTONE_SOFT} />
      <Path d="M5 4h14v10l-5 5H5z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M14 19v-5h5" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M8.5 9h7M8.5 12.5h4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** Articolo: usato come fallback quando manca la favicon del dominio. */
export function ArticleGlyph({ size = DEFAULT_SIZE, color = '#000000' }: DuotoneGlyphProps): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} rx={2} fill={color} opacity={DUOTONE_SOFT} />
      <Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} strokeWidth={1.6} />
      <Path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

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
