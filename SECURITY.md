# Security Policy

## Supported versions

AlgoViz is a client-side, fully offline application — there is no backend
service to patch. Security fixes are applied to the latest code on `master`
and released through the normal merge/deploy flow.

| Version | Supported |
|---|---|
| latest `master` | ✅ |
| any tagged release | ✅ (same codebase) |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report privately by one of these routes:

1. **GitHub Security Advisories** (preferred): repo → *Security* → *Report a
   vulnerability* (https://github.com/prit-007/ds-visualizer/security/advisories/new)
2. **Email:** pritvasani2@gmail.com — subject: `[SECURITY] AlgoViz ...`

Include:

- A description of the issue and its impact
- Steps to reproduce (or a proof of concept)
- Affected browser/OS if relevant
- Any suggested fix, if you have one

## What to expect

- Acknowledgement of your report within a few days
- An initial assessment of severity and scope
- A fix or mitigation timeline communicated back to you
- Credit in the release notes if you want it (opt-in)

## Scope notes

This app runs entirely in the browser. Realistic concerns include:

- XSS via user-supplied input rendered into the DOM (values are integers
  today; string/float support is planned — keep escaping in mind)
- Prototype-pollution or code-injection via scenario hash payloads
  (`#s=<base64url>`) — decode paths must stay defensive
- Dependency supply-chain issues (lockfile committed; `npm audit` on update)

Out of scope: social engineering, physical attacks, DoS against GitHub
infrastructure, and vulnerabilities in third-party services we don't control.
