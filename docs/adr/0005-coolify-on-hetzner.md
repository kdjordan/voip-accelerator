# Coolify on Hetzner Cloud

The product runs on a single Hetzner Cloud VM in a dedicated Hetzner project with its own IP and SSH key. Coolify (self-hosted open-source PaaS) manages the API app, the Vue static build, and Postgres as separate Coolify applications on the same VM. Daily Postgres backups go to Hetzner Object Storage; a monthly restore drill is part of the operational routine.

## Considered options

- **Raw Hetzner VM + docker-compose + Caddy.** Hand-roll the reverse proxy, TLS, env management, backups, and deploy automation.
- **Coolify on Hetzner.** Hetzner provides the VM; Coolify provides the deploy plane, TLS, env UI, Postgres-as-a-service, and scheduled backups.
- **Hetzner + k3s/k8s.** Full Kubernetes for a single app.
- **Managed PaaS elsewhere** (Vercel/Render/Fly.io). Different host entirely.

## Why Coolify on Hetzner

- Hetzner is the existing infrastructure relationship — a new project on the existing account is the lowest-friction way to add isolation without changing vendors.
- A solo operator's time is the binding constraint. Coolify provides the Vercel-like DX (git-push deploys, env UI, log streaming, one-click rollback) on hardware we fully own; under the hood it is still Docker Compose + Traefik + Postgres, which we can open up at any time.
- Hetzner has no managed Postgres. Coolify automates daily dumps to S3-compatible storage; Hetzner Object Storage is S3-compatible and pairs cleanly.
- TLS via Let's Encrypt is automatic. We would otherwise build the same thing by hand.
- k3s/k8s is over-engineered for one app on one VM. Vercel/Render/Fly would solve the deploy problem at higher monthly cost, and we would still need to pick a separate Postgres host.

## Consequences

- A CX22/CX32 VM (single host) runs the API, the frontend static build, and Postgres in separate Coolify "applications." Vertical scaling is the first response to growth; a second VM is a later concern.
- Postgres upgrades are *our* problem — Coolify makes the mechanics easy but does not validate the upgrade. Major-version Postgres upgrades follow the standard `pg_upgrade` flow, gated by a restore drill.
- Backups are theoretical until a restore is performed. The monthly restore drill is non-negotiable.
- Production-only environment: the new system is validated against Coolify's magic URL pre-cutover, then DNS for `voipaccelerator.com` is flipped (low TTL beforehand). Staging is not run as a second Coolify application — local dev + the magic-URL pre-cutover window are the only pre-prod gates.
- GitHub Actions runs lint/typecheck/`npm run test:integration` as a gate; Coolify deploys from `main` only on green. The Coolify API key is reserved for breaking-glass manual deploys.
