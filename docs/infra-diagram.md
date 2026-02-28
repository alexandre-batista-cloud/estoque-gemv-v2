# Diagrama de Infraestrutura — Projetos Ortobom
_Gerado em: 2026-02-28_

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PROJETOS ORTOBOM — INFRAESTRUTURA                      │
└─────────────────────────────────────────────────────────────────────────────────┘

 DESENVOLVIMENTO LOCAL (Windows 10)
 ┌───────────────────────────────────────────────────────────────┐
 │                                                               │
 │  C:\Users\Familia\estoque-gemv-v2\   (repo legado / ref)     │
 │                                                               │
 │  D:\Economia_AIOS\estoque-homolog\   (homologação ← NOVO)    │
 │  ├── branch: develop                                          │
 │  ├── backend (Node/Express) → localhost:3001                  │
 │  ├── frontend (React/Vite)  → localhost:5173                  │
 │  └── banco: SQLite (homolog.db)                               │
 │                                                               │
 └──────────────────────┬────────────────────────────────────────┘
                        │ git push origin develop
                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     GITHUB — alexandre-batista-cloud                            │
│                                                                                 │
│  Repo: estoque-gemv-v2                                                          │
│  ├── branch: develop  (padrão — homolog)                                        │
│  └── branch: main     (protegida — PR only)                                     │
│               │                                                                 │
│               └── GitHub Actions (deploy.yml)                                  │
│                   ├── Trigger: push main                                        │
│                   ├── Build frontend (Vite → dist/)                             │
│                   └── SSH deploy → VPS 77.37.126.43                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                        │ SSH deploy
                        ▼
```

---

## VPS Hostinger — 77.37.126.43

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  VPS 77.37.126.43  (Hostinger, Ubuntu)                                         │
│  Domínio: gemv.duckdns.org  │  SSL: Let's Encrypt (acme.sh)                    │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  REDE DOCKER: ortobom_net                                                │  │
│  │                                                                          │  │
│  │  ┌─────────────────────────────────────────────┐                        │  │
│  │  │  estoque_web (nginx:alpine)                  │                        │  │
│  │  │  Portas: 80 (HTTP) → 443 (HTTPS redirect)   │                        │  │
│  │  │  Portas: 443 (HTTPS) → proxy reverso        │                        │  │
│  │  │                                              │                        │  │
│  │  │  /           → /root/estoque_frontend/ (SPA)│                        │  │
│  │  │  /api/*      → localhost:3001 (backend)     │                        │  │
│  │  │  /n8n/       → n8n:5678                     │                        │  │
│  │  └─────────────────────────────────────────────┘                        │  │
│  │                                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────┐   │  │
│  │  │   n8n          │  │   chatwoot     │  │   evolution_api          │   │  │
│  │  │  porta: 5678   │  │  porta: 3000   │  │  porta: 8080 (interno)  │   │  │
│  │  │  externo: /n8n/│  │  externo: 3002 │  │  externo: 8081          │   │  │
│  │  └────────────────┘  └────────────────┘  └─────────────────────────┘   │  │
│  │                                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                                 │  │
│  │  │  typebot_builder│  │ typebot_viewer │                                 │  │
│  │  │  porta: 3000   │  │  porta: 3000   │                                 │  │
│  │  │  externo: 3003 │  │  externo: 3004 │                                 │  │
│  │  └────────────────┘  └────────────────┘                                 │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  PM2 (host, fora do Docker):                                                    │
│  └── backend (id:0) → /root/estoque_backend/server.js → porta 3001             │
│                                                                                 │
│  Segurança:                                                                     │
│  ├── UFW (portas abertas: 22, 80, 443, 3001, 3002, 3003, 3004, 8081)          │
│  ├── Fail2ban (SSH brute-force protection)                                      │
│  └── CrowdSec (threat intelligence)                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Dados — Sistema de Estoque

```
USUÁRIO (browser)
     │  https://gemv.duckdns.org
     ▼
nginx (Docker: estoque_web)
     │  serve SPA → /root/estoque_frontend/index.html
     │  proxy /api/* → localhost:3001
     ▼
PM2 Backend (server.js)  ←──── JWT Auth + Cloudflare Turnstile
     │
     ├── GET /estoque        → Supabase → tabela produtos
     ├── GET /historico      → Supabase → tabela movimentacoes
     └── POST /movimentacao  → Supabase → update + insert
              │ (se estoque baixo)
              └── Evolution API → WhatsApp alerta → 5562991827568
```

---

## Fluxo de Dados — Automação WhatsApp

```
CLIENTE WhatsApp
     │  mensagem recebida
     ▼
Evolution API (porta 8081)
     │
     ├── Typebot Trigger (ATIVO)
     │   └── typebot_viewer:3000 → Bot "Primeiro Atendimento - Funil Dopamina"
     │            │  (respostas automáticas, funil de vendas)
     │            └── keywords: atendente/humano/stop →
     │                     N8N webhook /primeiro-atendimento (HANDOFF)
     │                          └── Chatwoot (urgente) → consultor humano
     │
     └── Chatwoot Integration (ATIVO)
         └── chatwoot:3000 → inbox "Ortobom-V3"
                  │  (painel de atendimento humano)
                  └── Canned responses: /bv /consultor /aguarde ...

N8N (porta 5678, acesso: https://gemv.duckdns.org/n8n/)
     ├── WF01: WhatsApp Receiver → roteamento mensagens
     ├── WF02: Primeiro Atendimento + HANDOFF humano
     ├── WF04: AI Reply (Kimi moonshot-v1-8k) → /webhook/ai-reply
     ├── WF06-12: Monitoramento, segurança, health checks (CRON)
     └── WF00-02: Scripts de deploy VPS via webhook
```

---

## Fluxo de Dados — GMN (Google Meu Negócio)

```
SCRIPT LOCAL (Windows)
C:\Users\Familia\.firecrawl\gmn-post-script.js
     │  node gmn-post-script.js
     ▼
Playwright MCP (browser automation)
     │  navega business.google.com
     ▼
Google Business Profile API
     ├── Brasil Park Shopping (ID: 8933237801157193724)
     │   Av. Brasil Norte, 505 - S20, Anápolis-GO, 75113-570
     │   Tel: (62) 99632-4414
     └── Marista (ID: 10893147076975064072)
         Av. 85, 2385 - St. Marista, Goiânia-GO, 74160-010
         Tel: (62) 99614-8873
```

---

## Fluxo de Dados — Landing Page Ortobom

```
USUÁRIO (browser)
     │
     ▼
Vercel CDN (global)
     └── dyad-apps/bubbling-beluga-run
         └── React + shadcn/ui + Tailwind
             Componentes: Hero, Benefits, FAQ, Newsletter, SocialProof, CTA
```

---

## Serviços Externos

```
┌──────────────────────────────────────────────────────────────────────┐
│                       SERVIÇOS EXTERNOS                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Supabase (PostgreSQL managed)                                  │ │
│  │  URL: kbzerulcczyakjqwigxs.supabase.co                         │ │
│  │  Tabelas: produtos, movimentacoes                               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Cloudflare Turnstile (CAPTCHA)                                 │ │
│  │  Site Key: 0x4AAAAAACiTpFu2nQ6u4aIY                             │ │
│  │  Usado em: tela de login do estoque                             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Kimi AI (Moonshot)                                             │ │
│  │  Modelo: moonshot-v1-8k                                         │ │
│  │  Usado em: N8N WF04 — respostas IA no WhatsApp                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  DuckDNS                                                        │ │
│  │  Domínio: gemv.duckdns.org → 77.37.126.43                      │ │
│  │  SSL: Let's Encrypt via acme.sh (DNS-01 challenge)              │ │
│  │  Auto-renewal: cron 35 18 * * *                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Resumo de Portas Externas (Whitelist Hostinger)

| Porta | Serviço | URL |
|-------|---------|-----|
| 22    | SSH     | `ssh -i ~/.ssh/ortobom_vps root@77.37.126.43` |
| 80    | HTTP    | `http://gemv.duckdns.org` (redirect para HTTPS) |
| 443   | HTTPS   | `https://gemv.duckdns.org` |
| 3001  | Backend | `https://gemv.duckdns.org/api/` |
| 3002  | Chatwoot | `http://77.37.126.43:3002` |
| 3003  | Typebot Builder | `http://77.37.126.43:3003` |
| 3004  | Typebot Viewer | `http://77.37.126.43:3004` |
| 8081  | Evolution API | `http://77.37.126.43:8081` |

---

## CI/CD Pipeline (NOVO — pós-setup)

```
DEV (local)
D:\Economia_AIOS\estoque-homolog
branch: develop
     │
     │  npm run dev → testa localmente (SQLite)
     │  Cursor + Antigravity → valida código
     │
     ▼
git push origin develop
     │
     ▼
GitHub PR: develop → main
     │  review + aprovação
     ▼
Merge → branch main
     │
     ▼
GitHub Actions (deploy.yml)
     ├── Install + Build frontend (Vite)
     ├── SSH → VPS 77.37.126.43
     │   ├── git pull origin main
     │   ├── npm install --production
     │   └── pm2 restart backend
     └── SCP dist/ → /root/estoque_frontend/
     │
     ▼
PRODUÇÃO ATUALIZADA ✅
https://gemv.duckdns.org
```
