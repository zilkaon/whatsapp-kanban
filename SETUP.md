# WhatsApp Kanban – Setup Guide

Architektura: **WhatsApp → n8n → Supabase ← React (Vercel)**

---

## KROK 1: Supabase ✅ HOTOVO

Projekt **whatsapp-kanban** je vytvořen a nakonfigurován:
- URL: `https://mrxghvzlsouvpbghozut.supabase.co`
- Tabulka `tasks` je vytvořena s RLS politikou

SQL byl spuštěn automaticky:

```sql
-- Tabulka úkolů
create table tasks (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  col         text        not null default 'todo',        -- 'todo' | 'inprogress' | 'done'
  priority    text        not null default 'medium',     -- 'high' | 'medium' | 'low'
  source      text        default 'manual',              -- 'manual' | 'whatsapp'
  phone_number text,
  created_at  timestamptz default now()
);

-- Povol přístup (pro osobní použití stačí anonymous)
alter table tasks enable row level security;
create policy "Allow all" on tasks for all using (true) with check (true);

-- Real-time sync
alter publication supabase_realtime add table tasks;
```

3. Jdi na **Project Settings → API**:
   - zkopíruj **Project URL** → `VITE_SUPABASE_URL`
   - zkopíruj **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## KROK 2: Deploy na Vercel (~3 minuty)

1. Nahraj složku `kanban-whatsapp` na GitHub (nové repo)
2. Jdi na [vercel.com](https://vercel.com) → **Add New Project** → importuj to repo
3. Při deployi nastav **Environment Variables** (přesně tyto hodnoty):
   ```
   VITE_SUPABASE_URL      = https://mrxghvzlsouvpbghozut.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yeGdodnpsc291dnBiZ2hvenV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDU3NzgsImV4cCI6MjA4OTUyMTc3OH0.FiKSrw9iP38KY67E0cs2zK8Glx0LctiSqcWmgK7o7Ys
   ```
4. Deploy → získáš URL, např. `https://kanban.vercel.app`

---

## KROK 3: n8n workflow – oprav 3 věci

V n8n máš workflow **"WhatsApp Kanban v7"**. Potřebuješ opravit 3 nody:

### Node: "Claude parsuj ukol"
Přepni Body na **Raw JSON** a vlož:
```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 256,
  "messages": [{
    "role": "user",
    "content": "Parse this WhatsApp message as a task. Reply ONLY with JSON (no markdown):\n{\"title\": \"task name\", \"priority\": \"high|medium|low\", \"col\": \"todo\", \"reply\": \"short czech confirmation\"}\n\nMessage: {{ $json.text }}"
  }]
}
```
Header `x-api-key`: vlož svůj Anthropic API klíč.

### Node: "Připrav task data" – PŘIDEJ NOVÝ NODE před WhatsApp odpověď

Přidej node **HTTP Request** (POST) s názvem "Ulož do Supabase":
- URL: `https://XXX.supabase.co/rest/v1/tasks`
- Method: POST
- Headers:
  ```
  apikey: [tvůj anon key]
  Authorization: Bearer [tvůj anon key]
  Content-Type: application/json
  Prefer: return=minimal
  ```
- Body (Raw JSON):
```json
{
  "title":        "{{ $json.title }}",
  "col":          "{{ $json.col }}",
  "priority":     "{{ $json.priority }}",
  "source":       "whatsapp",
  "phone_number": "{{ $json.phoneNumber }}"
}
```

### Node: "WhatsApp odpověď"
Body přepni na Raw JSON:
```json
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.phoneNumber }}",
  "type": "text",
  "text": { "body": "{{ $json.reply }}" }
}
```
Header `Authorization`: `Bearer [tvůj WhatsApp token]`

---

## KROK 4: WhatsApp Business API (~30 minut)

1. Jdi na [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App**
2. Typ: **Business** → přidej produkt **WhatsApp**
3. V sekci WhatsApp → Getting Started:
   - Zkopíruj **Temporary access token** (nebo nastav permanent)
   - Zkopíruj **Phone number ID** (aktualizuj v node "WhatsApp odpověď" v URL)
4. Nastav **Webhook**:
   - Callback URL: `https://zilka.app.n8n.cloud/webhook/whatsapp-kanban`
   - Verify token: cokoliv (přidej do n8n GET webhook node)
   - Subscribe to: `messages`

---

## Jak posílat úkoly přes WhatsApp

Pošli zprávu na svůj WhatsApp Business číslo:

| Zpráva | Výsledek |
|---|---|
| `Zavolat klientovi zítra` | priorita: medium, col: todo |
| `URGENTN�N: Opravit bug v produkci` | priorita: high, col: todo |
| `Koupit kávu` | priorita: low, col: todo |

Claude automaticky rozpozná prioritu z kontextu zprávy. Dostaneš reply potvrzení.

---

## Lokální vývoj

```bash
cd kanban-whatsapp
cp .env.example .env.local    # vlož Supabase klíče
npm install
npm run dev                   # http://localhost:5173
```
