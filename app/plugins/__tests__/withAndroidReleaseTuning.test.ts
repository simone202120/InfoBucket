import {
  applyReleaseGradleProperties,
  RELEASE_GRADLE_PROPERTIES,
} from '../withAndroidReleaseTuning';

type GradleProperty = { type: 'property'; key: string; value: string };
type GradleComment = { type: 'comment'; value: string };
type GradleItem = GradleProperty | GradleComment;

const propertyOf = (properties: GradleItem[], key: string): GradleProperty | undefined =>
  properties.find(
    (item): item is GradleProperty => item.type === 'property' && item.key === key,
  );

describe('applyReleaseGradleProperties', () => {
  it('limita le ABI ad arm64-v8a aggiungendo la proprietà se assente', () => {
    const properties: GradleItem[] = [];

    applyReleaseGradleProperties(properties);

    expect(propertyOf(properties, 'reactNativeArchitectures')).toEqual({
      type: 'property',
      key: 'reactNativeArchitectures',
      value: 'arm64-v8a',
    });
  });

  it('sovrascrive il valore di default delle 4 ABI senza duplicare la riga', () => {
    const properties: GradleItem[] = [
      { type: 'property', key: 'reactNativeArchitectures', value: 'armeabi-v7a,arm64-v8a,x86,x86_64' },
    ];

    applyReleaseGradleProperties(properties);

    const matches = properties.filter(
      (item) => item.type === 'property' && item.key === 'reactNativeArchitectures',
    );
    expect(matches).toHaveLength(1);
    expect((matches[0] as GradleProperty).value).toBe('arm64-v8a');
  });

  it('preserva le altre proprietà e i commenti esistenti', () => {
    const comment: GradleComment = { type: 'comment', value: 'generato da expo' };
    const other: GradleProperty = { type: 'property', key: 'hermesEnabled', value: 'true' };
    const properties: GradleItem[] = [comment, other];

    applyReleaseGradleProperties(properties);

    expect(properties).toContain(comment);
    expect(propertyOf(properties, 'hermesEnabled')).toEqual(other);
  });

  it('applica tutte le chiavi configurate in RELEASE_GRADLE_PROPERTIES', () => {
    const properties: GradleItem[] = [];

    applyReleaseGradleProperties(properties);

    for (const [key, value] of Object.entries(RELEASE_GRADLE_PROPERTIES)) {
      expect(propertyOf(properties, key)?.value).toBe(value);
    }
  });
});
