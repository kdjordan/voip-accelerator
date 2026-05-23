# Co-host with TelcoOS-Main on existing CPX31

VoIP Accelerator runs as a separate Coolify project on the existing Hetzner CPX31 VM (`178.156.251.139`, alias `telcoos-prod`) that hosts TelcoOS-Main, rather than the dedicated VM in a new Hetzner project that [[0005-coolify-on-hetzner]] specified. The two apps share the host but are isolated at the Coolify-project layer.

## Why

- TelcoOS-Main is in active rebuild with one user; MockDeskAI is being moved off the same box. The blast-radius isolation that [[0005-coolify-on-hetzner]] paid for is unnecessary when both other apps on the host are low-stakes.
- The host has comfortable headroom for a third app. At the time of inventory: 4 vCPU, 7.6 GB RAM, 75 GB disk, 1.6 GB used / 6.0 GB free / load 0.55. Projected post-add: ~2.5 GB used. Even peak rate-sheet processing on the client (worker-based, browser-side) will not approach the limit.
- Storage layers do not overlap. TelcoOS uses SQLite (mmap'd, near-zero baseline RAM, container-local volume). VoIP Accelerator brings its own Coolify-managed Postgres. There is no two-Postgres tuning compromise to make.
- One VM is one VM to maintain. ~$5/mo saved is a side effect; the real win is operational simplicity for a solo operator.

## Accepted risk

- **Shared host = shared fate at the OS level.** A runaway process in either app's container can affect the other via CPU pressure, disk I/O, or memory pressure. With 6 GB free RAM and a near-idle load, this is a low-probability scenario today.
- **No swap is provisioned.** Hetzner Cloud Ubuntu images ship without swap. With no swap, a memory spike that exhausts RAM causes OOM-kill rather than degraded performance. Mitigation: add a 4 GB swapfile on the host before cutover. Not a Coolify concern — a one-time host action.
- **Traefik is shared.** All three apps' TLS routing goes through the same Coolify-managed Traefik. A misconfigured route on one app cannot, in practice, break another's TLS (Coolify generates per-app config), but a Traefik upgrade incident affects everything on the box.
- **Coolify upgrades** apply globally. We cannot stage a Coolify-version bump against VoIP Accelerator without also exposing TelcoOS to that version.

## Reversal trigger

Move VoIP Accelerator to a dedicated VM in a new Hetzner project — restoring [[0005-coolify-on-hetzner]]'s original posture — if any of:

- TelcoOS-Main acquires real customers (the "one user, being rebuilt" premise expires).
- VoIP Accelerator gains paying users despite the free-forever positioning, or otherwise becomes revenue-critical.
- The host repeatedly hits memory or CPU pressure under normal workload.
- A Coolify upgrade or Traefik incident on the shared host causes a non-trivial outage of either app.

The migration path is mechanical: `pg_dump` of the Postgres app to Hetzner Object Storage, provision the new VM + Coolify per [[0005-coolify-on-hetzner]], restore, switch DNS. No code change required.

## Consequences

- The Coolify "project" that ADR-0005 described as the unit of isolation is now confirmed as the practical isolation boundary, not the VM.
- The monthly restore drill ([[0005-coolify-on-hetzner]]) targets VoIP Accelerator's Postgres specifically and must not disturb TelcoOS-Main's SQLite volume.
- A 4 GB swapfile is added to the host as a pre-cutover task. Not a Coolify-managed change.
- The GitHub Actions → Coolify deploy hook for VoIP Accelerator points at the same Coolify instance as TelcoOS-Main but uses a project-scoped API token.
