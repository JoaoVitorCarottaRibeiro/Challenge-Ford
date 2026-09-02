# Ford Pickup Intel

Solução de Inteligência Competitiva Automotiva desenvolvida para o desafio da Ford, no contexto acadêmico da FIAP.

## Sobre o projeto

O Ford Pickup Intel é uma plataforma web e mobile que utiliza um agente de IA para extrair, padronizar e comparar especificações técnicas de pickups mid-size 4x4. O objetivo é permitir que a Ford compreenda como seus veículos se posicionam frente à concorrência em termos de equipamentos e preço.

Dado uma entrada simples de marca, modelo e versão, o agente retorna uma lista padronizada de especificações técnicas — sempre no mesmo formato, independentemente do veículo pesquisado.

## Desafio

> Compreender o valor percebido pelo cliente em relação à concorrência exige dados precisos e extremamente organizados. O mercado automotivo atual demanda a rápida compreensão de como os veículos concorrentes se posicionam em termos de preço e pacotes de equipamentos oferecidos.

**Entradas obrigatórias:** Marca, Modelo e Versão  
**Saída obrigatória:** Lista padronizada de especificações técnicas, com campos claros e comparáveis. Campos ausentes retornam `null`.

## Veículos cobertos

| Marca | Modelo | Versão |
|---|---|---|
| Ford | Ranger | Raptor / Storm |
| Volkswagen | Amarok | Highline V6 / Aventura |
| Toyota | Hilux | GR Sport / SRX |
| Chevrolet | S10 | High Country |
| Mitsubishi | L200 | Triton Absolute |

## Arquitetura

```
ford-pickup-intel/
├── apps/
│   ├── api/          # Backend — Node.js + TypeScript + Fastify
│   ├── web/          # Frontend web — Next.js + Tailwind
│   └── mobile/       # App mobile — React Native + Expo
├── packages/
│   ├── database/     # Entidades TypeORM + conexão Oracle
│   └── shared/       # Tipos e utilitários compartilhados
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Backend | Node.js + Fastify |
| Web | Next.js 14 + Tailwind CSS |
| Mobile | React Native + Expo |
| Banco de dados | Oracle Database (TypeORM, code first) |
| Agente de IA | Claude API (Anthropic) |
| Gerenciador de pacotes | pnpm (monorepo) |

## Pré-requisitos

- Node.js 20+
- pnpm
- Oracle Instant Client instalado
- Credenciais do Oracle Database (fornecidas pela FIAP)
- Chave da API da Anthropic

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ford-pickup-intel.git
cd ford-pickup-intel

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais
```

## Variáveis de ambiente

```env
DB_HOST=localhost
DB_PORT=1521
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_SERVICE=XEPDB1
ANTHROPIC_API_KEY=sk-ant-...
```

## Rodando o projeto

```bash
# API (porta 3333)
pnpm dev:api

# Web (porta 3000)
pnpm dev:web

# Mobile
pnpm dev:mobile
```

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/extract` | Extrai e salva specs de um veículo (opcionalmente a partir de um PDF enviado pelo usuário) |
| GET | `/api/vehicles` | Lista todos os veículos |
| GET | `/api/vehicles/:id` | Busca um veículo por ID |
| GET | `/api/compare` | Tabela comparativa por segmento |

### Exemplo de uso

```bash
curl -X POST http://localhost:3333/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Ford",
    "model": "Ranger",
    "version": "Raptor"
  }'
```

### Upload de ficha técnica em PDF (qualquer concorrente)

O `/api/extract` aceita, opcionalmente, um PDF arbitrário como fonte — não depende de o veículo estar no mapa de fichas curadas. O PDF vai em base64, dentro do próprio corpo JSON, cobrindo o requisito de "entrada simples" mantendo a assinatura HMAC sobre o conteúdo do arquivo:

```bash
curl -X POST http://localhost:3333/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "Hilux",
    "version": "GR Sport",
    "yearModel": 2025,
    "pdfBase64": "'"$(base64 -w0 ficha-concorrente.pdf)"'",
    "pdfFileName": "ficha-concorrente.pdf"
  }'
```

Regras: PDF até 15MB, validado por assinatura de arquivo (`%PDF-`), salvo fora da pasta curada em `apps/api/pdfs/uploads/` (ignorada pelo git). Um envio de PDF força uma nova extração mesmo se já existir spec em cache para aquele veículo/versão, e o `source` retornado vem como `pdf_upload` (distinto de `pdf_oficial`, reservado às fichas curadas pela equipe).

### Seleção livre de categorias/atributos técnicos

O `/api/extract` aceita um campo opcional `categories` (array de strings) com o subconjunto das categorias de especificações que devem ser pesquisadas — atende ao requisito do desafio de que o usuário defina livremente quais atributos técnicos quer pesquisar, em vez de sempre trazer as ~150 especificações fixas:

```bash
curl -X POST http://localhost:3333/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Ford",
    "model": "Ranger",
    "version": "Raptor",
    "yearModel": 2025,
    "categories": ["Segurança", "ADAS e Assistência ao Motorista", "Iluminação"]
  }'
```

Regras: nomes devem bater exatamente com as categorias de `SPEC_CATEGORIES` (ex.: "Motor e Transmissão", "Rodas e Pneus", "Conectividade e Multimídia", "Conforto, Ar-condicionado e Acabamento", "Segurança", "ADAS e Assistência ao Motorista", "Iluminação", "4x4 e Off-road", "Utilidade e Garantia"); ausente ou vazio pesquisa tudo (comportamento padrão, mantém cache); com categorias restritas, o Claude só é chamado para essas categorias (menor custo/tempo) e, se já existir spec salva, apenas os campos pesquisados nesta rodada são atualizados — o resto do dado já confirmado anteriormente é preservado.

### Exemplo de resposta

```json
{
  "vehicle": {
    "id": "uuid",
    "brand": "Ford",
    "model": "Ranger",
    "version": "Raptor"
  },
  "spec": {
    "engine_name": "2.0 EcoBlue Biturbo",
    "displacement_cc": 1996,
    "power_cv": 288,
    "torque_nm": 491,
    "fuel_type": "diesel",
    "gearbox": "automático 10 marchas",
    "drive": "4x4",
    "four_low": true,
    "towing_kg": 3500,
    "payload_kg": 900,
    "airbags": 7,
    "base_price_brl": 389990
  }
}
```

## Banco de dados

O projeto utiliza Oracle Database com TypeORM em modo **code first** — as tabelas são geradas automaticamente a partir das entidades TypeScript ao subir a aplicação (`synchronize: true` em desenvolvimento).

### Tabelas geradas

- `segments` — segmentos de mercado (ex: pickup_midsize_4x4)
- `vehicles` — cadastro de veículos (marca, modelo, versão)
- `vehicle_specs` — especificações técnicas padronizadas

## Validação do desafio

Para validar a solução conforme os critérios da Ford:

```bash
# 1. Suba a API
pnpm dev:api

# 2. Extraia a Ranger Raptor
curl -X POST http://localhost:3333/api/extract \
  -d '{"brand":"Ford","model":"Ranger","version":"Raptor"}'

# 3. Compare com os concorrentes
curl http://localhost:3333/api/compare?segment=pickup_midsize_4x4
```

Critérios atendidos:
- Entrada livre de marca + modelo + versão
- Saída sempre no mesmo formato padronizado
- Campos ausentes retornam `null` explicitamente
- Dados claros, organizados e comparáveis
- Validação com Ford Ranger Raptor

## Time

Desenvolvido por estudantes da FIAP como resposta ao desafio da Ford — Inteligência Competitiva Automotiva.
