# Security

## Reporting a vulnerability

Use GitHub private vulnerability reporting:

<https://github.com/mobfish-ai/cortex-harness-open/security/advisories/new>

Give the affected path, the version or commit, and a way to reproduce the
issue. Please leave tokens, customer records, and store data out of public
issues. If material like that is already in the tree, say where it is in the
private report and open a pull request that removes it.

## What the plugin protects

`packages/dsh-web-cortex-command` runs in the DSH host process.

- The browser sends the slash-command text. It does not receive
  `CORTEX_API_TOKEN`.
- The host calls the CORTEX task-pool API only when `CORTEX_API_BASE_URL` is
  a loopback URL (`127.0.0.1`, `localhost`, or `::1`).
- Command errors have the token replaced with `[redacted]` before the text
  returns to the caller.

The plugin can request status, enqueue, and recover. Settlement and
completion stay on the CORTEX side.

## Scope

Reports are in scope for the code and docs in this repository, including
token handling and the loopback check.

The CORTEX Kernel, a privately hosted task-pool server, and DSH Web itself
are separate products. Report those to their own maintainers.

## Supported versions

| Version | Reporting |
| --- | --- |
| `0.1.0` source on `main` | Accepted |
| npm registry | No release published |
| GitHub Releases | No release published |

## Secrets

Do not commit credentials, customer data, or machine-local paths. The test
suite includes a public-boundary scan for home-directory paths, private-key
blocks, common token prefixes, Shopify store hosts, and private IPv4 ranges.
