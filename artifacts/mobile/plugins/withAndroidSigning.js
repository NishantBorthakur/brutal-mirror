const { withAppBuildGradle } = require("@expo/config-plugins");

const KEYSTORE_LOADER = `def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;

const RELEASE_SIGNING_CONFIG = `
        release {
            if (keystoreProperties.containsKey('storeFile')) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`;

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes("keystorePropertiesFile")) {
      return config;
    }

    contents = KEYSTORE_LOADER + contents;

    contents = contents.replace(
      /(signingConfigs\s*\{)/,
      `$1${RELEASE_SIGNING_CONFIG}`
    );

    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release"
    );

    config.modResults.contents = contents;
    return config;
  });
};
