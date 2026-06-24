/**
 * Favicon — mostra il logo reale del sito di un articolo. Se l'host manca o
 * l'immagine non carica (rete ostile/offline), mostra il fallback fornito.
 * Degrada con grazia: una favicon che non arriva non rompe mai la card.
 */
import { useState, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { faviconUrl } from '@/lib/source';

export interface FaviconProps {
  host: string | null;
  size: number;
  fallback: ReactNode;
}

export function Favicon({ host, size, fallback }: FaviconProps): JSX.Element {
  const [failed, setFailed] = useState(false);
  if (!host || failed) return <>{fallback}</>;
  return (
    <View style={{ width: size, height: size }}>
      <Image
        testID="favicon-image"
        source={{ uri: faviconUrl(host) }}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: 4 }}
      />
    </View>
  );
}
