# Cortex Harness Open

Public export for the CORTEX Harness protocol and reference tooling.

This repository currently publishes the installable DSH Web bridge at
[`packages/dsh-web-cortex-command`](packages/dsh-web-cortex-command/). It adds
the host-side `/cortex` command surface to DSH Web and forwards authenticated
loopback requests to a running CORTEX task-pool server. The CORTEX Kernel,
leases, replay, receipts, and completion decisions remain authoritative on the
CORTEX side.

## Install from source

```sh
dsh plugin --profile web add file:/absolute/path/to/packages/dsh-web-cortex-command
```

After the package is published, the registry form will be:

```sh
dsh plugin --profile web add cortex-dsh-web-command
```

The package is host-only: browser input never carries the CORTEX token. See
the package README for the local server and environment contract.

## Public boundary

Only the allowlisted plugin package is exported here. No OB1 vault, private
records, credentials, local databases, generated evidence, or internal
runtime state is included.

## Status

The repository is the public source export. npm publication and DSH catalog
read-back are separate release gates and are not claimed until they have fresh
evidence.
