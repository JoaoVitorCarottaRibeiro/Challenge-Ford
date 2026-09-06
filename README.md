# Ford Pickup Intel

Solução de **Inteligência Competitiva Automotiva** para o desafio FIAP + Ford. Recebe uma entrada
simples (marca / modelo / versão, ou uma ficha técnica em PDF) e devolve uma **lista padronizada de
especificações técnicas** — sempre no mesmo formato, comparável entre veículos. Campos ausentes vêm
como `null`, nunca inventados.

Validação oficial do desafio: entregar corretamente as specs da **Ford Ranger Raptor**, batendo com
a ficha técnica real dela.

---

## O que a solução faz

- **Extrai** specs de picapes médias 4x4 a partir de fichas técnicas oficiais em PDF, com fallback
  para pesquisa web + conhecimento do agente de IA quando não há PDF.
- **Padroniza** tudo num schema fixo de ~140 campos, agrupados em 9 categorias.
- **Compara** os veículos lado a lado (comparativo client-side na web).
- **Rastreia a origem de cada dado** — por veículo (`source`) e por campo (`field_provenance`:
  `deterministic` vs `ai`), pra você sempre saber o quanto confiar.

### Escopo — picapes médias 4x4 de chassi em escada

O produto é sobre a mesma classe da Ranger Raptor, não um comparador de carros em geral. Marcas no
segmento: **Ford, Toyota, Volkswagen, Chevrolet, Mitsubishi, Nissan, Fiat, BYD** (a BYD Shark é PHEV,
mesmo segmento). Ficam de fora: picapes compactas/unibody (Fiat Toro, RAM Rampage, Ford Maverick…),
picapes grandes (Silverado, F-150) e marcas sem picape 4x4 séria no Brasil.

---

## Duas portas de entrada para extração

### 1. Buscar por marca/modelo (aba "Buscar via IA/Web")

Dropdown com as 8 marcas do segmento. Usa a **ficha curada** quando existe (mapa `PDF_MAP`), senão
cai pra pesquisa em fontes públicas + conhecimento geral do agente.

### 2. Enviar uma ficha em PDF (aba "Enviar ficha em PDF")

Só o **arquivo** é obrigatório. Marca / modelo / versão / ano são opcionais:

- O PDF é **transcrito uma vez** (cacheado em disco por hash) e um passo determinístico (regex, sem
  IA) extrai os campos objetivos — potência, torque, cilindrada, marchas, câmbio, garantia, preço,
  airbags, tração 4x4, etc.
- Se você não preencheu a identidade, o backend **descobre o veículo a partir do próprio PDF**
  (marca/modelo da capa; versão/ano do PDF ou de uma busca web complementar).
- A IA entra **só nos campos que sobraram nulos**, por categoria, alimentada pelo texto já
  transcrito — sem nova chamada multimodal.
- Sem `ANTHROPIC_API_KEY` configurada, a extração roda 100% determinística e a resposta marca
  `aiEnabled: false`.

### Hierarquia de confiabilidade da fonte

| `source` | Significado |
|---|---|
| `pdf_oficial` | Ficha curada pela equipe (`apps/api/pdfs/`, mapeada em `PDF_MAP`) |
| `pdf_upload` | PDF enviado pelo usuário via `/extract` |
| `web_scraping` | Scraping de site oficial / iCarros |
| `ia_generated` | Estimativa do agente sem fonte verificada (meta: zero disso no catálogo principal) |

---

## Arquitetura

```
Challenge-Ford/
├── apps/
│   ├── api/          # Backend — Fastify 5 + TypeScript + Oracle (TypeORM, thin mode)
│   ├── web/          # Frontend web — Next.js 16 + Tailwind CSS 4
│   └── mobile/       # App mobile — React Native + Expo SDK 52
├── packages/
│   └── database/     # Entidades TypeORM + DataSource Oracle (compartilhado)
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Backend | Node.js 20+ · Fastify 5 · TypeORM 0.3 |
| Banco | Oracle Database (modo *thin* — sem Oracle Instant Client) |
| Web | Next.js 16 · React 19 · Tailwind CSS 4 |
| Mobile | React Native · Expo SDK 52 |
| Agente de IA | Claude (Anthropic) — `claude-haiku-4-5` |
| Auth | JWT (HS256) Bearer + RBAC (`admin` / `analyst`) |
| Pacotes | pnpm workspace (monorepo) |

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+ e `pnpm`
- Credenciais do Oracle (fornecidas pela FIAP)
- Chave da API da Anthropic (opcional — sem ela, extração roda só com o parser determinístico)

### Passo a passo

```bash
pnpm install

# API — copie o exemplo e preencha
cp apps/api/.env.example apps/api/.env

# Web — só precisa da URL da API
echo "NEXT_PUBLIC_API_URL=http://localhost:3333/api" > apps/web/.env.local

pnpm dev:api    # porta 3333
pnpm dev:web    # porta 3000
pnpm dev:mobile # Expo (opcional)
```

A API **valida a env no boot** (`apps/api/src/config/env.ts`) — se recusar a subir, a mensagem
diz exatamente qual variável está ausente ou fraca (`JWT_SECRET` ≥ 32 chars, `ENCRYPTION_KEY`
decodificando pra 32 bytes, etc.). Gere segredos com `openssl rand -hex N`.

### Variáveis de ambiente (`apps/api/.env`)

| Variável | Obrigatória | Observação |
|---|---|---|
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASS` `DB_SERVICE` | sim | Oracle FIAP |
| `JWT_SECRET` | sim | mínimo 32 chars |
| `ENCRYPTION_KEY` | sim | hex de 64 chars ou base64 de 44 (→ 32 bytes) |
| `API_KEY` | sim | senha mestra do `POST /auth/register` (mínimo 16 chars) |
| `ANTHROPIC_API_KEY` | não | sem ela, extração fica só determinística |
| `NODE_ENV` `DB_SYNC` | não | `synchronize` (auto-DDL) só roda fora de `production`, ou com `DB_SYNC=true` |
| `PORT` `ALLOWED_ORIGINS` | não | padrão `3333` / vazio |

### Primeiro usuário

```bash
curl -X POST http://localhost:3333/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ford.com","password":"suaSenhaForte","role":"admin","adminKey":"<valor de API_KEY>"}'
```

---

## API

Todas as rotas abaixo de `/api` (exceto `/api/auth/*`) exigem `Authorization: Bearer <accessToken>`.
Escrita (`POST /extract`, `DELETE /vehicles/:id`) exige `role: admin`.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/health` | pública | Healthcheck |
| `POST` | `/api/auth/register` | `adminKey` | Cria usuário (5 req/min) |
| `POST` | `/api/auth/login` | pública | Retorna `accessToken` (8h) + `refreshToken` (7d) (5 req/min) |
| `POST` | `/api/auth/refresh` | pública | Renova o par de tokens |
| `GET` | `/api/vehicles` | Bearer | Lista veículos com spec (dedup por marca+modelo+versão+ano) |
| `GET` | `/api/vehicles/:id` | Bearer | Ficha completa de um veículo |
| `POST` | `/api/extract` | Bearer + `admin` | Extrai e salva specs (ver abaixo) |
| `DELETE` | `/api/vehicles/:id` | Bearer + `admin` | Remove veículo + spec |
| `GET` | `/api/admin/audit-logs` | Bearer + `admin` | Últimos 100 registros de auditoria |
| `GET` | `/api/admin/suspicious` | Bearer + `admin` | Eventos suspeitos da última hora |

### `POST /api/extract`

Corpo (todos os campos são opcionais desde que `pdfBase64` OU `brand`+`model`+`version`+`yearModel`
estejam presentes):

| Campo | Tipo | Nota |
|---|---|---|
| `brand` `model` `version` | string | obrigatórios se não vier PDF |
| `yearModel` | integer | 1990–2030 |
| `pdfBase64` | string | ficha em base64 (PDF até 15 MB, validado por `%PDF-`) |
| `pdfFileName` | string | nome original do arquivo |
| `categories` | string[] | subconjunto das 9 categorias — ausente = pesquisa tudo |

Categorias válidas: `Motor e Transmissão`, `Rodas e Pneus`, `Conectividade e Multimídia`,
`Conforto, Ar-condicionado e Acabamento`, `Segurança`, `ADAS e Assistência ao Motorista`,
`Iluminação`, `4x4 e Off-road`, `Utilidade e Garantia`.

```bash
TOKEN=$(curl -s -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ford.com","password":"suaSenhaForte"}' | jq -r .accessToken)

# a) por marca/modelo (usa ficha curada da Raptor)
curl -X POST http://localhost:3333/api/extract \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"brand":"Ford","model":"Ranger","version":"Raptor","yearModel":2026}'

# b) por PDF, sem informar o veículo (identificação automática)
#    dica no Windows: escreva o JSON num arquivo UTF-8 e use --data-binary @arquivo.json
curl -X POST http://localhost:3333/api/extract \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data-binary @payload.json     # { "pdfBase64": "...", "pdfFileName": "ficha.pdf" }
```

Resposta (recorte — o schema real tem ~140 campos em `spec`):

```json
{
  "vehicle": { "id": "uuid", "brand": "Ford", "model": "Ranger", "version": "Raptor", "yearModel": 2026 },
  "spec": {
    "potenciaCv": 397,
    "torqueNm": 583,
    "cilindradaL": 3,
    "qtdMarchas": 10,
    "transmissaoAutomatica": 1,
    "motorDiesel": 0,
    "tracao4x4HighLow": 1,
    "airbagsQtd": 7,
    "anosGarantia": 5,
    "precoBaseBrl": 499000,
    "source": "pdf_oficial"
  },
  "source": "pdf_oficial",
  "provenance": { "potencia_cv": "deterministic", "torque_nm": "deterministic", "aeb": "ai" },
  "aiEnabled": true
}
```

---

## Catálogo (10 veículos, todos com fonte real)

| Veículo | Ano | Fonte |
|---|---|---|
| Ford Ranger Raptor | 2026 | pdf_oficial |
| Toyota Hilux SRX | 2025 | pdf_oficial |
| Volkswagen Amarok Highline V6 | 2020 | pdf_oficial |
| Volkswagen Amarok Extreme | 2020 | pdf_oficial |
| Volkswagen Amarok Comfortline | 2020 | pdf_oficial |
| Chevrolet S10 High Country | 2025 | web_scraping |
| Mitsubishi L200 Triton Katana | 2026 | pdf_oficial |
| Nissan Frontier PRO-4X | 2025 | pdf_oficial |
| Fiat Titano Ranch | 2026 | pdf_oficial |
| BYD Shark GS | 2026 | pdf_oficial |

As fichas curadas ficam versionadas em `apps/api/pdfs/`. Uploads de usuário vão pra
`apps/api/pdfs/uploads/` (git-ignorado); o cache de transcrição, pra `apps/api/pdfs/.cache/`
(git-ignorado).

---

## Banco de dados

Oracle com TypeORM em modo **code first** — as tabelas (`segments`, `vehicles`, `vehicle_specs`,
`users`, `audit_logs`) são geradas a partir das entidades em `packages/database/src/`.

`synchronize` (auto-DDL no boot) **só roda fora de `production`**, ou em produção com `DB_SYNC=true`
ligado por um boot só, pra aplicar mudança de schema com segurança contra o Oracle compartilhado da
FIAP.

> **Atenção:** o `DB_USER` da FIAP é o login do time inteiro. Não rode a API local ao mesmo tempo
> que um colega ou uma instância deployada — o Oracle tem limite de conexão por usuário e a
> disputa causa falhas intermitentes difíceis de diagnosticar.

---

## Segurança

Escrita protegida por **JWT Bearer + `requireRole('admin')`** — sem assinatura HMAC (a versão
anterior tinha, mas o segredo ia no bundle do cliente, então não protegia nada). Detalhes,
incluindo a exposição histórica de credencial FIAP no commit inicial e o plano de remediação, em
[`SECURITY.md`](./SECURITY.md).

Outros controles: rate-limit (30/min global, 5/min em `/auth/*`), lockout de conta após 5 logins
falhos, audit log com payload criptografado (AES-256-GCM), `@fastify/helmet`, CORS por allowlist.

---

## Validação do desafio

```bash
pnpm dev:api

TOKEN=$(curl -s -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ford.com","password":"suaSenhaForte"}' | jq -r .accessToken)

# Extrai a Ranger Raptor e confere contra a ficha real (397 cv / 583 Nm / 3.0 V6 / 10 marchas)
curl -X POST http://localhost:3333/api/extract \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"brand":"Ford","model":"Ranger","version":"Raptor","yearModel":2026}'

# Lista o catálogo padronizado
curl http://localhost:3333/api/vehicles -H "Authorization: Bearer $TOKEN"
```

Critérios atendidos: entrada livre (marca+modelo+versão **ou** PDF), saída sempre no mesmo formato,
campos ausentes como `null` explícito, dados comparáveis, e a Raptor batendo com a ficha oficial.

---

## Time

Arthur Bueno (RM558396) · João Carotta · Victor Magdaleno — FIAP, desafio Ford de Inteligência
Competitiva Automotiva.
