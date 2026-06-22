/**
 * Composizione del `raw_content` etichettato per le fonti media (§7.5).
 *
 * Funzione PURA: dati gli ingredienti (caption, autore, trascrizione) produce
 * il blocco di testo che verrà persistito su `items.raw_content` e passato a
 * `generate`. `raw_content` non si butta mai (rigenerazione a basso costo, §2),
 * quindi questo è l'unico formato di verità per le fonti media.
 *
 * Degrada con grazia: i campi mancanti vengono omessi, non lasciati vuoti
 * (Instagram è il caso più fragile — caption assente → restano audio+nota, §17).
 */

export interface RawContentParts {
  /** Caption / titolo del contenuto. */
  caption?: string | null;
  /** Autore (handle o nome). */
  author?: string | null;
  /** Trascrizione audio (STT). */
  transcript?: string | null;
}

/** Normalizza un campo: trim; stringa vuota → null. */
function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Compone il blocco etichettato `[Caption]/[Autore]/[Trascrizione]`.
 * Include solo le sezioni presenti. Se tutto manca, restituisce stringa vuota:
 * il chiamante decide cosa farne (di norma resta comunque la `note` utente).
 */
export function composeRawContent(parts: RawContentParts): string {
  const caption = clean(parts.caption);
  const author = clean(parts.author);
  const transcript = clean(parts.transcript);

  const sections: string[] = [];
  if (caption) sections.push(`[Caption] ${caption}`);
  if (author) sections.push(`[Autore] ${author}`);
  if (transcript) sections.push(`[Trascrizione] ${transcript}`);

  return sections.join('\n');
}
