const { withAppBuildGradle } = require("expo/config-plugins");

const releaseSigningConfig = `
        release {
            if (project.hasProperty("VOLT_UPLOAD_STORE_FILE")) {
                storeFile file(VOLT_UPLOAD_STORE_FILE)
                storePassword VOLT_UPLOAD_STORE_PASSWORD
                keyAlias VOLT_UPLOAD_KEY_ALIAS
                keyPassword VOLT_UPLOAD_KEY_PASSWORD
            }
        }`;

// Signs release builds with the upload keystore when the VOLT_UPLOAD_* Gradle
// properties are set, and falls back to the debug key otherwise.
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    const before = mod.modResults.contents;
    const after = before
      .replace(
        /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
        '$1signingConfig project.hasProperty("VOLT_UPLOAD_STORE_FILE") ? signingConfigs.release : signingConfigs.debug',
      )
      .replace(/(signingConfigs \{\s*debug \{[^}]*\})/, `$1${releaseSigningConfig}`);
    if (after === before) {
      throw new Error("with-release-signing: build.gradle no longer matches the expected template");
    }
    mod.modResults.contents = after;
    return mod;
  });
};
