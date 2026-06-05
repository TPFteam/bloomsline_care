# Always-on LanguageTool on Scaleway (France)

Runs your own LanguageTool so grammar-check works for real users 24/7 — never
your laptop. France-hosted, so patient note text stays in-region (HDS/RGPD
aligned). Caddy gives it automatic HTTPS and locks it to your app with a shared
token.

```
users → Vercel app → grammar.<domain> (Caddy: HTTPS + token) → LanguageTool → back
```

LanguageTool itself is never exposed to the internet — only Caddy can reach it.

---

## 1. Provision the server (Scaleway)

1. Scaleway console → **Instances** → Create. Recommended start:
   - **Type:** `PRO2-XS` (2 vCPU / 8 GB) or `DEV1-M` (3 vCPU / 4 GB) — LanguageTool is RAM-hungry; 4 GB is the practical floor with a 2 GB JVM heap.
   - **Region:** `fr-par` (Paris) — keeps data in France.
   - **Image:** Ubuntu 24.04 LTS.
   - Attach your SSH key.
2. **Security group** (Scaleway → Security Groups): allow inbound **TCP 22, 80, 443**. Block everything else. (Port 8010 stays closed — LanguageTool is internal only.)
3. Note the instance's **public IP**.

## 2. DNS

Create an **A record** for a subdomain pointing at the instance IP, e.g.:

```
grammar.bloomsline.app  →  <instance-public-ip>
```

(Use Scaleway DNS or your registrar.) Wait until it resolves before step 4 — Caddy needs it to issue the TLS cert.

## 3. Install Docker on the server

```bash
ssh root@<instance-ip>
curl -fsSL https://get.docker.com | sh
```

## 4. Deploy

Copy this `deploy/languagetool/` folder to the server (scp or git), then:

```bash
cd languagetool
cp .env.example .env
# edit .env:
#   GRAMMAR_DOMAIN=grammar.bloomsline.app
#   GRAMMAR_TOKEN=$(openssl rand -hex 32)   ← generate and paste a real value
docker compose up -d
```

Verify (replace TOKEN + domain):

```bash
# Unauthorized without the token → 401
curl -s -o /dev/null -w "%{http_code}\n" https://grammar.bloomsline.app/v2/languages   # 401

# Authorized → 200
curl -s -H "Authorization: Bearer $TOKEN" https://grammar.bloomsline.app/v2/languages | head -c 120
```

## 5. Point the app at it (Vercel)

In the Vercel project → **Settings → Environment Variables → Production**:

```
LANGUAGETOOL_URL    = https://grammar.bloomsline.app
LANGUAGETOOL_TOKEN  = <the same value as GRAMMAR_TOKEN>
```

Redeploy. The app's `/api/grammar/check` now calls your France server with the
token; nothing goes to the public LanguageTool cloud.

> Keep your **local** `.env.local` pointing at `http://localhost:8010` (no token)
> for development. Production uses the cloud server; local uses your Docker one.

---

## Scaling (the "large scale" part)

A single instance handles a lot: grammar calls are debounced (~1 per 1.2 s per
actively-typing user) and each check is a quick stateless request. Scale when CPU
sustains high under load:

- **Vertical (simplest):** resize the Scaleway instance and raise `Java_Xmx`
  (e.g. 6 GB heap on a 16 GB box) in `docker-compose.yml`, then `docker compose up -d`.
- **Horizontal:** run several LanguageTool replicas behind the same Caddy:
  add `deploy: { replicas: N }` (Swarm) or list multiple `reverse_proxy`
  upstreams in the Caddyfile — Caddy load-balances across them. Put 2+ small
  instances behind a Scaleway Load Balancer for HA.
- **Accuracy upgrade (optional):** mount LanguageTool n-gram data for better
  context detection (large download, +RAM) — see the LanguageTool docs
  (`langtool_languageModel`). Skip until you need it.

## Operations

- Restart after reboot: containers `restart: unless-stopped` come back on their own.
- Logs: `docker compose logs -f languagetool`
- Update LanguageTool: bump the image tag, `docker compose pull && docker compose up -d`.
- Rotate the secret: change `GRAMMAR_TOKEN` here **and** `LANGUAGETOOL_TOKEN` in Vercel together.

## Cost

~€10–25/month for the instance (PRO2-XS / DEV1-M range), plus a few € if you add
a Load Balancer for HA. No per-request fees — it's your box.
