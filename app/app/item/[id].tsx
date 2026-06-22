import { useLocalSearchParams } from 'expo-router';
import { ReviewScreen } from '@/features/review/ReviewScreen';

/** Route di dettaglio/review di un elemento (spec §9). Legge l'`id` dall'URL. */
export default function ItemDetailRoute(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReviewScreen id={id} />;
}
