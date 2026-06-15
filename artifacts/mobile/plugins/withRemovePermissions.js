const { withAndroidManifest } = require("@expo/config-plugins");

// Permissions that must never appear in the release build.
// SYSTEM_ALERT_WINDOW — React Native debug overlay (release builds don't need it)
// READ/WRITE_EXTERNAL_STORAGE — not used by this app; removed for privacy/Play policy
const DENY_LIST = [
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
];

module.exports = function withRemovePermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const permissions = manifest["uses-permission"] ?? [];
    manifest["uses-permission"] = permissions.filter(
      (p) => !DENY_LIST.includes(p.$?.["android:name"])
    );
    return cfg;
  });
};
