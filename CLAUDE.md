# Ford Pickup Intel — Contexto do Projeto

> Este arquivo existe para que qualquer sessão futura (ou pessoa) entenda rapidamente o estado do projeto, as regras de negócio já decididas e as pegadinhas já descobertas — sem precisar re-percorrer tudo que já foi discutido.

## O que é o projeto

Solução de Inteligência Competitiva Automotiva (desafio FIAP + Ford). Recebe marca/modelo/versão (entrada simples) e devolve uma lista padronizada de especificações técnicas, sempre no mesmo formato, comparável entre veículos. Validação oficial do desafio: **a solução precisa entregar corretamente as specs da Ford Ranger Raptor**, batendo com a ficha técnica real dela.

## Escopo do segmento — regra de negócio importante

O produto é sobre **picapes médias 4x4 de chassi em escada** (a mesma classe da Ranger Raptor) — não é um comparador de carros em geral. Antes de adicionar qualquer veículo novo ao catálogo, perguntar: *"essa marca vende algo do mesmo tipo de veículo que a Raptor no Brasil?"*

- **Dentro do segmento** (chassi em escada, 4x4 de verdade): Ford Ranger, Toyota Hilux, Volkswagen Amarok, Chevrolet S10, Mitsubishi Triton/L200, Nissan Frontier, Fiat Titano, BYD Shark (PHEV, mesmo segmento).
- **Fora do segmento — não adicionar como concorrente da Raptor**: picapes compactas/unibody (Fiat Strada/Toro, VW Saveiro, Chevrolet Montana, Renault Oroch, Ford Maverick, RAM Rampage — todos monobloco, plataforma tipo "Small Wide 4x4"), picapes de porte grande (Chevrolet Silverado, concorre com F-150/RAM 1500), e marcas que simplesmente não vendem picape/SUV 4x4 sério no Brasil (Honda, BMW, Mercedes-Benz, Audi, Hyundai, Kia, Porsche, Ferrari, Lamborghini, Volvo, Tesla).
- **RAM Rampage já foi removido do catálogo** por esse motivo (confirmado: é unibody, plataforma compartilhada com Fiat Toro/Jeep Compass).
- Padrão de comparação: **um trim flagship por marca** (o topo de linha, mais equipado), não múltiplas versões da mesma marca — mantém o comparativo "topo contra topo", igual a como a Raptor é o topo da Ford.

## Hierarquia de confiabilidade da fonte

`spec.source` tem 4 valores possíveis, nessa ordem de confiança:
1. **`pdf_oficial`** — PDF curado pela equipe, mapeado em `PDF_MAP` (apps/api/src/routes/vehicles.ts). Fonte mais confiável.
2. **`pdf_upload`** — PDF enviado pelo usuário via `/extract` (campo `pdfBase64`), mesma confiança de conteúdo, rótulo diferente só porque veio de upload manual em vez do mapa curado.
3. **`web_scraping`** — scraping de site oficial/iCarros, ou (novidade) dado compilado manualmente a partir de pesquisa web cruzada quando não há PDF disponível e o site oficial bloqueia scraping automático.
4. **`ia_generated`** — Claude "chutando" pelo conhecimento geral, sem fonte real. **Menor confiança — meta do projeto é chegar a zero disso no catálogo principal.**

O dashboard (`/` — Visão Geral) mostra a distribuição real dessas fontes ("Confiabilidade das fontes"). Hoje (após a sessão de correção) **o catálogo principal está em 9 `pdf_oficial` + 1 `web_scraping`, zero `ia_generated`.**

## Regra de ouro: nunca confiar num PDF/fonte só pelo nome do arquivo

Descobertas nesta sessão que motivam essa regra:
- `fichaS10.pdf` (que já estava mapeado desde antes) **não era uma ficha técnica** — era uma tabela de homologação de ruído/emissões (PROCONVE/CONTRAN). Foi removido do `PDF_MAP` e do disco.
- `fichaAmarok.pdf` estava mapeado para `'volkswagen-amarok-highline v6'`, mas é na verdade a ficha de um motor **2.0 TDI 4-cilindros**, não do V6. O próprio documento diz "nas versões Comfortline e Highline" — serve pra Comfortline, não pra "Highline V6".
- Corrigido: baixamos o press kit oficial VW do motor V6 de verdade (`fichaAmarokV6.pdf`, 3.0 TDI V6, 258cv/580Nm), que o próprio documento confirma servir tanto para "Highline" quanto "Extreme".

**Sempre**: baixar → ler o conteúdo (pypdf/pdfplumber ou o próprio multimodal do Claude) → confirmar que motor/versão/ano batem com o que o registro promete → só então cadastrar.

## Bug de extração já corrigido: mistura de dados entre versões num mesmo PDF

Quando um PDF tem uma página inteira por versão (ex.: básica, intermediária, topo — como o Fiat Titano: Endurance/Volcano/Ranch, cada um numa página quase idêntica visualmente), a extração por categoria pode "vazar" dado da versão errada (ex.: pegou o torque da Endurance para um pedido de "Ranch"). Duas correções já aplicadas em `apps/api/src/services/extractor.ts`:
1. `readPdfText()`: `max_tokens` subiu de 2048 para 8192 — o limite baixo cortava a transcrição antes de chegar nas últimas páginas/versões do documento.
2. Prompt de `extractCategory()`: instrução explícita pra isolar a versão pedida e nunca misturar dados de outra versão, preferindo `null` a adivinhar.

Isso é uma correção de pipeline, não um remendo pontual — vale para qualquer PDF multi-versão processado daqui pra frente.

## Extração: camada determinística antes da IA (refatorado nesta sessão)

A extração deixou de depender só de IA para os campos objetivos. Fluxo atual em
`apps/api/src/services/extractor.ts` + `apps/api/src/services/specParser.ts`:

1. **Transcrição do PDF cacheada** (`transcribePdf`) — a chamada multimodal ao Claude que
   transforma o PDF em texto roda **no máximo uma vez por arquivo**, cacheada em disco por hash
   do conteúdo em `apps/api/pdfs/.cache/<sha256>.txt` (gitignored). Reextrações do mesmo PDF, ou
   de outra versão/trim que usa o mesmo arquivo, reusam o texto sem nova chamada de IA.
2. **Parser determinístico** (`parseHeadlineSpecs`, sem IA) — regex sobre o texto transcrito
   extrai ~13 campos objetivos (potência, torque com conversão kgf·m→Nm, cilindrada, marchas,
   câmbio automático/manual, diesel/flex, turbo/biturbo, 4x4 com reduzida, garantia, preço,
   airbags, peso em ordem de marcha, aro, consumo). Regras propositalmente conservadoras — na
   dúvida, não preenche (fica pra IA cobrir).
3. **IA só no que sobrou nulo**, por categoria, alimentada com o texto já cacheado (não faz nova
   chamada multimodal). Sem `ANTHROPIC_API_KEY` configurada, esse passo é pulado inteiro — a
   extração roda 100% determinística e a resposta do `/extract` vem com `aiEnabled:false` +
   `aiDisabled:true` (o web mostra um aviso "IA desabilitada — só specs-base" ao lado do badge de fonte).
4. **Proveniência por campo** — nova coluna `field_provenance` (CLOB JSON, `VehicleSpec`) grava
   `"deterministic"` ou `"ai"` por campo preenchido. Exposta na resposta do `/extract` e no
   tooltip do `SourceBadge`.

## Extração via PDF sem marca/modelo/versão — identificação automática

A tela `/extract` tem duas abas independentes: "Buscar via IA/Web" (dropdown do catálogo do
segmento) e "Enviar ficha em PDF" (só o arquivo é obrigatório — marca/modelo/versão/ano ficam
opcionais). Quando vem PDF sem esses campos, `apps/api/src/routes/vehicles.ts` chama:

1. `transcribePdf` (cacheada) pra ter o texto da ficha.
2. `identifyVehicleFromText` (nova, em `extractor.ts`) — pede à IA marca/modelo/versão/ano a
   partir do texto. Marca+modelo bastam pra aceitar; sem versão nomeada na fonte (comum em
   lançamento de configuração única), o sistema rotula como `"Padrão"` em vez de rejeitar.
3. Se versão/ano ainda faltarem, busca fontes web da marca (`collectWebSources`) e tenta
   identificar de novo com o texto combinado **web primeiro, ficha depois** — importante porque a
   ficha sozinha já pode passar de milhares de caracteres, e um corte de tamanho no prompt que
   colocasse o texto web depois dela descartaria o dado que faltava antes da IA nem ver.
4. `fetchPage` (mesmo arquivo) agora também captura o `<title>` de cada página **separado** do
   corpo, sem cortar — páginas de catálogo tipo iCarros costumam ser SPA (corpo raspado só traz
   menu genérico dentro do limite de 6000 chars), mas o `<title>` vem denso e útil de verdade
   (ex.: "BYD Shark 1.5T PHEV GS 4WD Auto 2027" = trim + tração + câmbio + ano numa linha só).
   `INDEPENDENT_URLS` ganhou entradas do iCarros pra `nissan`/`fiat`/`byd` por causa disso — as
   páginas oficiais dessas 3 marcas são SPA puro (corpo vazio via fetch server-side), não valeu a
   pena incluir.
5. O prompt de `extractCategory` também deixou de exigir confirmação **literal** da fonte pra
   campos booleanos — pode inferir com confiança quando o tipo de powertrain já deixa claro (ex.:
   veículo 100% PHEV descrito na fonte → câmbio automático, mesmo que a ficha não use essa
   palavra). Continua proibido misturar dado de outra versão/trim do mesmo documento.

Sem PDF nem marca/modelo/versão/ano nenhum → `400`. Com PDF mas nem marca nem modelo identificáveis
→ `422` pedindo preenchimento manual. Toda essa cadeia (da identificação até a extração) roda dentro
de um único try/catch na rota — antes a busca do veículo existente no Oracle ficava fora de
qualquer captura e um tropeço ali virava 500 sem nenhuma linha na auditoria.

Confiabilidade: `extractCategory` nunca lança — `Promise.allSettled` por categoria (uma falha não
derruba as outras), 1 retry em JSON malformado, `max_tokens` calculado pelo tamanho da categoria
(a truncar categorias grandes como "Conectividade e Multimídia" era a causa do bug antigo de
categoria inteira sumir em silêncio).

**Gotcha de teste**: se `/extract` voltar 500 rápido (sem log de erro na auditoria — `GET
/api/admin/audit-logs`) e o payload tiver acento (`"categories":["Iluminação"]` etc.), suspeite
primeiro de **encoding do shell**, não do código — `curl -d '...com acento...'` via Bash no
Windows corrompe o Content-Length e o Fastify recusa com `FST_ERR_CTP_INVALID_CONTENT_LENGTH`.
Escreva o JSON num arquivo UTF-8 e use `curl --data-binary @arquivo.json` em vez de `-d '...'` inline.

## O gatekeeper escondido do `GET /vehicles`

```ts
const withSpecs = all.filter(v => v.spec !== null && v.spec.potenciaCv !== null)
```
Um veículo só aparece nas listagens se **o campo potência especificamente** estiver preenchido — não documentado em nenhum lugar, é só uma linha de filtro. Se cadastrar algo manualmente e esquecer de preencher `potenciaCv`, o registro fica invisível (mas existe no banco).

## Catálogo atual (10 veículos, todos com fonte real)

| Veículo | Ano | Fonte | Campos preenchidos |
|---|---|---|---|
| Ford Ranger Raptor | 2026 | pdf_oficial | 93 |
| Toyota Hilux SRX | 2025 | pdf_oficial | 65 |
| Volkswagen Amarok Highline V6 | 2020 | pdf_oficial | 34 |
| Volkswagen Amarok Extreme | 2020 | pdf_oficial | 29 |
| Volkswagen Amarok Comfortline | 2020 | pdf_oficial | 29 |
| Chevrolet S10 High Country | 2025 | web_scraping | 27 |
| Mitsubishi L200 Triton Katana | 2026 | pdf_oficial | 108 |
| Nissan Frontier PRO-4X | 2025 | pdf_oficial | 82 |
| Fiat Titano Ranch | 2026 | pdf_oficial | 110 |
| BYD Shark GS | 2026 | pdf_oficial | 71 |

PDFs curados vivem em `apps/api/pdfs/` (git-ignorado o subdiretório `uploads/`, mas os PDFs oficiais curados estão versionados). Mapa completo em `PDF_MAP` dentro de `apps/api/src/routes/vehicles.ts`.

`brand`/`model`/`version` agora são normalizados na escrita (`apps/api/src/services/normalize.ts`) —
strings inteiras em CAIXA ALTA viram Title Case, siglas curtas/com dígito (BYD, GS, SRX, S10, PRO-4X)
não são tocadas. Motivo: o `WHERE` do Oracle é case-sensitive, então uma extração com marca digitada
diferente do que já estava salvo (ex.: "Ford" vs. "FORD") cria um veículo duplicado, só escondido pelo
dedup do `GET /vehicles` — não pelo banco. A Raptor já estava salva como `"FORD"/"RAPTOR"` (de antes
desta normalização existir); foi recriada via `/extract` como `"Ford"/"Raptor"` e a linha antiga foi
apagada. Se voltar a ver duplicata de um veículo, é esse o motivo mais provável.

## Features implementadas em sessões anteriores

- **Upload de PDF arbitrário** no `/extract` (campo `pdfBase64`, base64 dentro do JSON — sem precisar de multipart/dependência nova).
- **Seleção livre de categorias** (`categories: string[]` no `/extract`) — atende ao requisito literal do desafio de deixar o usuário definir quais atributos quer pesquisar; também usado para forçar reextração sem depender de upload.
- **Login redesenhado** estilo B3 (split-screen, sempre claro independente do tema do app).
- **Tela de Veículos**: logos de marca reais via Simple Icons (`cdn.simpleicons.org`, com fallback pra letra se a imagem falhar) + filtro de marcas em chips.
- **Dashboard** trocado de lista redundante com `/vehicles` para visão executiva: KPIs (cobertura de dados, confiabilidade de fontes), destaque Ford vs. concorrência, liderança em potência, atividade recente.
- **Menu lateral**: perfil colapsado num único gatilho, abre popover com tema claro/escuro + sair.
- Emojis removidos de toda a interface, substituídos por ícones lucide-react.

## Segurança — endurecida nesta sessão (minimalista, honesta)

O HMAC de escrita foi **removido por completo** (`middlewares/hmac.ts` deletado, sem `X-Signature`
em lugar nenhum do `apps/web`). Motivo: o segredo (`NEXT_PUBLIC_HMAC_SECRET`) ia embutido no bundle
do cliente — qualquer um extraía do JS e assinava requisições à vontade. Não protegia nada; só dava
a impressão de proteger. Escrita agora depende só do que de fato protege: **JWT Bearer +
`requireRole('admin')`**.

O que mudou:
- **`apps/api/src/config/env.ts`** — módulo único que lê e valida toda env no boot (`JWT_SECRET`
  ≥32 chars, `ENCRYPTION_KEY` decodifica pra 32 bytes exatos — hex 64 ou base64 44, `API_KEY`
  ≥16 chars, `DB_*` presentes). Falha = `process.exit(1)` com a lista de problemas, não um erro
  obscuro em runtime. Todo `process.env.X!` espalhado foi substituído por `config.*`.
- **Cookies de sessão** (`apps/web/lib/auth-cookies.ts`): `sameSite:'strict'` sempre, `secure` em
  produção. `httpOnly` continua impossível de setar via JS puro (sem cookie do `js-cookie`) — é o
  tradeoff aceito do caminho minimalista, sem BFF/proxy.
- **`data-source.ts`**: `synchronize` (auto-DDL) só roda fora de `production`, ou em produção com
  `DB_SYNC=true` ligado por um boot só.
- **Fastify**: `trustProxy:true` (rate-limit/lockout/audit ficavam com o IP do proxy sem isso, se um
  dia for atrás de Render/Vercel), rate-limit dedicado 5/min em `/auth/login` e `/auth/register`
  (achei e corrigi de quebra um bug real: o rate-limit excedido devolvia **500** em vez de 429 —
  o `errorResponseBuilder` custom não setava `statusCode`), `PUBLIC_ROUTES` com match exato de
  pathname em vez de `startsWith` (evitava bypass tipo `/api/auth/login-x`).
- **Lockout de login** (`services/auth.ts`): antes, ao bloquear a conta o contador de tentativas
  zerava — passada a janela de 15min, o atacante ganhava um lote novo de 5. Agora só zera em login
  bem-sucedido.
- **`.dockerignore`** novo na raiz — `.env` nunca mais entra na imagem Docker (o `Dockerfile` fazia
  `COPY apps/api ./apps/api` sem isso).
- `.env.example` (raiz e `apps/api/`) sem credenciais reais — só placeholders + instruções
  `openssl rand -hex N`.
- Dependências mortas removidas: `@google/generative-ai`, `@fastify/jwt` (nenhuma nunca foi importada).

**Atualização**: o HMAC do `apps/mobile/services/api.ts` (mesmo secret hardcoded
`ford-intel-hmac-secret-2025`) **já foi removido** também, na sessão da Sprint 3 de Cybersecurity —
mobile deixou de ser exceção. A senha do Oracle FIAP (`DB_USER=rm558396`/`DB_PASS=190305`) ficou
commitada no `.env.example` da raiz desde o commit inicial — já tirada dos arquivos atuais, mas
ainda existe no histórico do git; reescrever a história (ou não) é decisão do time, não foi feito
sozinho porque afeta o clone de quem mais estiver no repo.

## Sprint 3 — Cybersecurity (DevSecOps)

Documento completo em [`docs/SPRINT3-CYBERSECURITY.md`](../docs/SPRINT3-CYBERSECURITY.md) —
pipeline DevSecOps (desenho, sem workflow real ainda), evidências de hardening, observabilidade e
compliance (OWASP ASVS/API Top 10/Mobile Top 10, LGPD, STRIDE, plano de segurança contínua).

Duas coisas novas nessa sessão, além do documento:
- **`apps/web/app/(dashboard)/security/page.tsx`** — rota `/security`, admin-only (escondida do
  nav e redireciona `analyst` pra `/`), dashboard real (não mockup) sobre `GET
  /api/admin/audit-logs` e `GET /api/admin/suspicious` — eventos por tipo, IPs de alto risco,
  falhas recentes.
- **`Dockerfile`** hardenizado: `NODE_ENV=production` explícito (sem isso o guard de
  `synchronize` em `data-source.ts` não tinha efeito nenhum dentro do container), usuário
  não-root (`USER node`), `HEALTHCHECK` batendo em `/health`. Não testado com build real (Docker
  não instalado na máquina de dev usada).

Gaps identificados de propósito e **não** corrigidos nesta sessão (documentados no próprio
`docs/SPRINT3-CYBERSECURITY.md`, não escondidos): sem blacklist/revogação de refresh token antes da
expiração natural; prompt de `identifyVehicleFromText`/`extractCategory` não isola explicitamente
texto de PDF/web de terceiro como "dado, não instrução" (risco de prompt injection, impacto baixo
hoje); dashboard de `/security` é *pull*, não notifica sozinho.

## Como rodar localmente

```bash
pnpm install          # na raiz
pnpm dev:api          # apps/api/.env precisa estar preenchido — ver apps/api/.env.example
pnpm dev:web          # apps/web/.env.local precisa só de NEXT_PUBLIC_API_URL (HMAC saiu do web)
```
- `node-oracledb` roda em modo Thin — não precisa instalar Oracle Instant Client.
- Primeiro usuário: `POST /api/auth/register` com `adminKey` = valor de `API_KEY` no `.env`.
- `pnpm approve-builds --all` se o `pnpm install` travar em `ERR_PNPM_IGNORED_BUILDS`.
- A API agora **valida a env no boot** (`config/env.ts`) — se recusar a subir, a mensagem de erro
  já diz exatamente qual variável está faltando ou fraca demais.
- **Oracle FIAP é compartilhado pelo time** (mesmo `DB_USER`) — se `/extract` ou qualquer escrita
  começar a falhar sem padrão claro, confira antes se outra pessoa do time (ou uma instância
  deployada) está com a API local ligada ao mesmo tempo, disputando o limite de conexão.

## Pendências / próximos passos discutidos (nada implementado ainda)

- Não existe tela de "adicionar veículo" nem de edição de spec. `/extract` agora tem duas portas de entrada: a aba "Buscar via IA/Web" continua com marca/modelo/versão presos a um dropdown fixo (`VEHICLE_OPTIONS` no código, hoje com as 8 marcas do segmento), mas a aba "Enviar ficha em PDF" já é texto livre + identificação automática (ver seção acima) — cobre o requisito de entrada livre pra quem chega com um PDF.
- `POST /api/vehicles` existe na API mas é código morto — nenhuma tela chama.
- `GET /api/compare` está documentado no README mas não está implementado (o comparativo do web é 100% client-side).
- `apps/api/src/services/updater.ts` existe mas está vazio — pensado para reextração periódica.
- Ideia discutida (não implementada): usar a Tabela FIPE (API pública `parallelum.com.br/fipe`) como catálogo de identidade limpo (marca/modelo/ano) para alimentar autocomplete — não tem dado técnico, só serve pra evitar erro de digitação/duplicata.
- Precisão de dado (ex.: torque da Hilux SRX vindo com casa decimal quebrada tipo 498,82 Nm em vez de 500) foi identificada mas deixada **fora de escopo de propósito** na sessão de segurança/extração — próximo passo natural.
- Decisão pendente do time: reescrever ou não o histórico do git pra remover a credencial Oracle FIAP commitada no commit inicial (ver seção Segurança acima).
- Gaps de segurança identificados na Sprint 3 e ainda não corrigidos: revogação de refresh token, prompt injection na extração via IA, alerta automático pro dashboard de `/security` (hoje é *pull*). Ver `docs/SPRINT3-CYBERSECURITY.md`.
