const { withEntitlementsPlist, withXcodeProject } = require("expo/config-plugins");

// Personal Team (free Apple Developer) doesn't support Push Notifications.
// expo-notifications adds aps-environment + SystemCapabilities entry — remove both.
module.exports = (config) => {
  config = withEntitlementsPlist(config, (mod) => {
    delete mod.modResults["aps-environment"];
    return mod;
  });

  config = withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    // Disable Push Notifications system capability in pbxproj so Xcode
    // auto-signing doesn't request a profile with push support.
    const attributes = project.getFirstProject().firstProject.attributes;
    if (attributes?.TargetAttributes) {
      for (const targetKey in attributes.TargetAttributes) {
        const caps = attributes.TargetAttributes[targetKey]?.SystemCapabilities;
        if (caps?.["com.apple.Push"]) {
          caps["com.apple.Push"].enabled = 0;
        }
      }
    }
    return mod;
  });

  return config;
};
