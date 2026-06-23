const { withGradleProperties } = require('expo/config-plugins');

/**
 * Tuning del build nativo Android per EAS.
 *
 * Il release build compila il C++ (CMake) di React Native una volta per ogni ABI
 * elencata in `reactNativeArchitectures`. Con le 4 ABI di default
 * (armeabi-v7a, arm64-v8a, x86, x86_64) compilate in parallelo, il worker EAS
 * saturava la memoria di sistema e il processo veniva terminato a metà fase
 * nativa: il log si interrompeva su `:app` senza alcun blocco `FAILURE`, sintomo
 * tipico dell'OOM-killer (un errore di codice stamperebbe sempre `What went wrong`).
 *
 * InfoBucket è un'app personale installata su un telefono Android moderno, quindi
 * serve solo `arm64-v8a`: x86/x86_64 sono per gli emulatori, armeabi-v7a per i
 * device a 32 bit ormai rari. Una sola ABI rende il build nativo ~4× più leggero
 * e veloce. Lo impostiamo via config plugin perché EAS rigenera `android/` a ogni
 * build (workflow managed) e una modifica diretta a gradle.properties andrebbe persa.
 */
const RELEASE_GRADLE_PROPERTIES = {
  reactNativeArchitectures: 'arm64-v8a',
};

/**
 * Inserisce o aggiorna le proprietà date dentro le righe di gradle.properties.
 * Funzione pura (nessun I/O) così è testabile in isolamento.
 */
function applyReleaseGradleProperties(properties, overrides = RELEASE_GRADLE_PROPERTIES) {
  for (const [key, value] of Object.entries(overrides)) {
    const existing = properties.find((item) => item.type === 'property' && item.key === key);
    if (existing) {
      existing.value = value;
    } else {
      properties.push({ type: 'property', key, value });
    }
  }
  return properties;
}

const withAndroidReleaseTuning = (config) =>
  withGradleProperties(config, (gradleConfig) => {
    gradleConfig.modResults = applyReleaseGradleProperties(gradleConfig.modResults);
    return gradleConfig;
  });

module.exports = withAndroidReleaseTuning;
module.exports.applyReleaseGradleProperties = applyReleaseGradleProperties;
module.exports.RELEASE_GRADLE_PROPERTIES = RELEASE_GRADLE_PROPERTIES;
