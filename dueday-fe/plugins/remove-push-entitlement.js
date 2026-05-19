const { withEntitlementsPlist } = require("expo/config-plugins");

// Personal Team (free Apple Developer) doesn't support Push Notifications.
// expo-notifications adds aps-environment by default — remove it so the build works.
module.exports = (config) =>
  withEntitlementsPlist(config, (mod) => {
    delete mod.modResults["aps-environment"];
    return mod;
  });
