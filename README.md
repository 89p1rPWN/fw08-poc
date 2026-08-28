# fw08-poc

Proof-of-concept marker for an **authorised bug bounty submission** (Fastweb "General"
programme via CyberDart, scope `*.fastweb.it`, researcher `89p13`).

`fw08-marker.js` demonstrates that a module loaded through an unguarded
`import-map-overrides` parameter executes on the target origin, can make itself
persistent, and can reach the network.

It is deliberately benign. It does not read cookies, storage, form fields,
credentials or any user data, and it does not modify the page. It only proves
capability, and exists solely so the vendor's triage team can reproduce the report.

This repository will be removed once the report is resolved.
