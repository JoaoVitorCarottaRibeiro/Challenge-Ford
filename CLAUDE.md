# Fordiq — Contexto do Projeto

> Este arquivo existe para que qualquer sessão futura (ou pessoa, ou máquina) entenda rapidamente o estado do projeto, as regras de negócio já decididas e as pegadinhas já descobertas — sem precisar re-percorrer tudo que já foi discutido. Mantenha atualizado conforme o projeto evolui.

## O que é o projeto

Solução de Inteligência Competitiva Automotiva (desafio FIAP + Ford), com nome comercial **Fordiq**. Recebe marca/modelo/versão (entrada simples) e devolve uma lista padronizada de especificações técnicas, sempre no mesmo formato, comparável entre veículos. Validação oficial do desafio: **a solução precisa entregar corretamente as specs da Ford Ranger Raptor**, batendo com a ficha técnica real dela.

O projeto é posicionado como um **produto vendido à Ford** (não uma ferramenta interna Ford) — daí o nome "Fordiq", pensado no mesmo estilo de "iai" (Itaú): relacionado ao cliente-alvo (Ford) sem ser uma marca própria da Ford. Nomes descartados: "Forvia" (é uma fornecedora automotiva real, Faurecia+Hella — colisão de marca), variações "Ford-algo" muito literais.

## Identidade visual (Fordiq)

- Logo em `apps/web/public/fordiq-logo.png` — fundo removido via flood-fill (não é um threshold de branco simples, que furava o texto interno do logo). Usado no sidebar (clicável, leva para `/`) e no painel decorativo da tela de login.
- Login (`apps/web/app/(auth)/login/page.tsx`): layout split-screen estilo B3 Investimentos — formulário claro à esquerda (sempre claro, independente do tema do app), painel escuro decorativo com a logo à direita. Título: só **"Bem-vindo(a)"** (sem "ao Fordiq").

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
3. **`web_scraping`** — scraping de site oficial/iCarros, ou dado compilado manualmente a partir de pesquisa web cruzada quando não há PDF disponível e o site oficial bloqueia scraping automático.
4. **`ia_generated`** — Claude "chutando" pelo conhecimento geral, sem fonte real. **Menor confiança — meta do projeto é chegar a zero disso no catálogo principal.**

**O card "Confiabilidade das fontes" foi removido do dashboard** (pedido do usuário, ver seção de features abaixo) — a distribuição de fontes ainda existe no banco/no badge de cada veículo (`SourceBadge`), só não tem mais um resumo agregado na tela inicial.

## Regra de ouro: nunca confiar num PDF/fonte só pelo nome do arquivo

Descobertas que motivam essa regra:
- `fichaS10.pdf` (que já estava mapeado desde antes) **não era uma ficha técnica** — era uma tabela de homologação de ruído/emissões (PROCONVE/CONTRAN). Foi removido do `PDF_MAP` e do disco.
- `fichaAmarok.pdf` estava mapeado para `'volkswagen-amarok-highline v6'`, mas é na verdade a ficha de um motor **2.0 TDI 4-cilindros**, não do V6. O próprio documento diz "nas versões Comfortline e Highline" — serve pra Comfortline, não pra "Highline V6".
- Corrigido: baixamos o press kit oficial VW do motor V6 de verdade (`fichaAmarokV6.pdf`, 3.0 TDI V6, 258cv/580Nm), que o próprio documento confirma servir tanto para "Highline" quanto "Extreme".
- BYD Shark: a extração inicial somou o torque dos 3 motores (2 elétricos + 1 combustão) e deu 910Nm — errado. O torque combinado real, confirmado no PDF oficial global da BYD, é **650Nm** (motores não somam torque linearmente).

**Sempre**: baixar → ler o conteúdo (pypdf/pdfplumber ou o próprio multimodal do Claude) → confirmar que motor/versão/ano batem com o que o registro promete → só então cadastrar.

## Bug de extração já corrigido: mistura de dados entre versões num mesmo PDF

Quando um PDF tem uma página inteira por versão (ex.: básica, intermediária, topo — como o Fiat Titano: Endurance/Volcano/Ranch, cada um numa página quase idêntica visualmente), a extração por categoria pode "vazar" dado da versão errada. Duas correções aplicadas em `apps/api/src/services/extractor.ts`:
1. `readPdfText()`: `max_tokens` subiu de 2048 para 8192 — o limite baixo cortava a transcrição antes de chegar nas últimas páginas/versões do documento.
2. Prompt de `extractCategory()`: instrução explícita pra isolar a versão pedida e nunca misturar dados de outra versão, preferindo `null` a adivinhar.

Isso é uma correção de pipeline, não um remendo pontual — vale para qualquer PDF multi-versão processado daqui pra frente.

## Gotcha: dedup do `/extract` é por string exata, não fuzzy

O `/extract` só reconhece um veículo já existente se `brand + model + version + yearModel` baterem **exatamente**. Uma pequena variação de nome/ano (ex.: "Shark" vs "Shark 6", 2026 vs 2027) cria um **veículo novo duplicado** em vez de atualizar o existente — foi o que aconteceu com um teste que criou "BYD Shark 6 GS 2027" ao lado do "BYD Shark GS 2026" original (specs idênticos). Removido via `DELETE /vehicles/:id`. Se o catálogo mostrar mais veículos do que o esperado, suspeitar disso primeiro — puxar `GET /vehicles` e comparar brand/model/version/yearModel manualmente.

## O gatekeeper escondido do `GET /vehicles`

```ts
const withSpecs = all.filter(v => v.spec !== null && v.spec.potenciaCv !== null)
```
Um veículo só aparece nas listagens se **o campo potência especificamente** estiver preenchido — não documentado em nenhum lugar, é só uma linha de filtro. Se cadastrar algo manualmente e esquecer de preencher `potenciaCv`, o registro fica invisível (mas existe no banco).

## Catálogo atual (10 veículos, todos com fonte real, sem duplicatas)

| Veículo | Ano | Fonte | Campos preenchidos |
|---|---|---|---|
| Ford Ranger Raptor | 2026 | pdf_oficial | 109 |
| Toyota Hilux SRX | 2025 | pdf_oficial | 68 |
| Volkswagen Amarok Highline V6 | 2020 | pdf_oficial | 37 |
| Volkswagen Amarok Extreme | 2020 | pdf_oficial | 32 |
| Volkswagen Amarok Comfortline | 2020 | pdf_oficial | 32 |
| Chevrolet S10 High Country | 2025 | web_scraping | 29 |
| Mitsubishi L200 Triton Katana | 2026 | pdf_oficial | 111 |
| Nissan Frontier PRO-4X | 2025 | pdf_oficial | 83 |
| Fiat Titano Ranch | 2026 | pdf_oficial | 113 |
| BYD Shark GS | 2026 | pdf_oficial | 74 |

PDFs curados vivem em `apps/api/pdfs/` (git-ignorado o subdiretório `uploads/`, mas os PDFs oficiais curados estão versionados). Mapa completo em `PDF_MAP` dentro de `apps/api/src/routes/vehicles.ts`.

## Preço FIPE — o que é e o que NÃO é

O dashboard tem um gráfico "Valor FIPE por ano-modelo" (`apps/web/components/PriceHistoryChart.tsx`, dados em `apps/web/constants/fipeHistory.ts`). **Isso não é histórico de preço de lançamento mês a mês** — é o valor de referência FIPE atual (consultado em set/2026) para cada ano-modelo já cadastrado na Tabela FIPE. A API pública da FIPE (`parallelum.com.br/fipe`) não expõe histórico mensal (recurso pago); só dá o valor de hoje por ano-modelo. Todos os valores foram verificados manualmente contra a API antes de entrar no catálogo — **nunca inventar/estimar esses números**. Gráfico com legenda em chips clicáveis (clicar isola uma linha, clicar de novo volta a mostrar todas) — usa `recharts`; atenção ao filtrar a lista de `<Line>` ANTES do `.map()` (nunca retornar `false` dentro do array de children do `<LineChart>`, quebra a introspecção interna do recharts).

## Features implementadas até agora

- **Upload de PDF arbitrário** no `/extract` (campo `pdfBase64`, base64 dentro do JSON já assinado por HMAC — sem precisar de multipart/dependência nova).
- **Seleção livre de categorias** (`categories: string[]` no `/extract`) — atende ao requisito literal do desafio de deixar o usuário definir quais atributos quer pesquisar; também usado para forçar reextração sem depender de upload.
- **Rebrand completo para Fordiq** — login, sidebar, favicon conceitual, tom de voz.
- **Dashboard (v2, minimalista)**: hero "Buscar Veículo" com 3 campos livres (marca/modelo/versão) que primeiro checa o catálogo existente e, se não achar, chama `/extract` na hora; 2 KPIs simples (veículos e marcas monitorados, sem ícones); gráfico de preço FIPE; atividade recente. Removidos: cards de "Confiabilidade das fontes", "Liderança em potência", destaque Ford Ranger Raptor, todos os ícones dos KPIs.
- **Tela de Veículos**: logos de marca reais via Simple Icons (`cdn.simpleicons.org/{slug}/{cor}`) para ford/toyota/mitsubishi/volkswagen/chevrolet/ram/fiat/nissan, com fallback pra letra se a imagem falhar. **BYD não existe no Simple Icons** (testado, 404 em várias variações de slug) — usa um asset local (`apps/web/public/byd-logo.png`, logo oficial baixado pelo usuário, já sem fundo) via `BRAND_LOCAL_LOGOS` em `BrandBadge.tsx`. Filtro de marcas em chips.
- **Tela de detalhe do veículo** (`vehicles/[id]/page.tsx`): cabeçalho mostra a logo da marca (`BrandBadge`); cores do cabeçalho usam tokens de tema dedicados `--hero-bg`/`--hero-fg`/`--hero-fg-muted` (definidos em `globals.css`) — no modo claro é azul-marinho com texto branco, no modo **escuro vira branco com texto preto** (pedido explícito do usuário, para não ficar "azul claro" genérico igual outros elementos que usam `--primary`).
- **Menu lateral**: perfil colapsado num único gatilho, abre popover com tema claro/escuro + sair. Logo Fordiq clicável leva para `/`. Sem ícones nos itens de navegação, só texto. **Destaque do item ativo usa `usePathname()` do `next/navigation`** (não `window.location.pathname` lido direto no render, que não é reativo a navegação client-side do Next e ficava com o destaque errado).
- **Tela de Comparativo**: botão "Limpar seleção" aparece no cabeçalho quando há algo selecionado (reseta os dois dropdowns); ícone de balança removido do estado vazio.
- Emojis removidos de toda a interface, substituídos por ícones lucide-react (ou removidos de vez, conforme pedido).

## Como rodar localmente

```bash
pnpm install          # na raiz
pnpm dev:api          # apps/api/.env precisa estar preenchido (DB_*, ANTHROPIC_API_KEY, HMAC_SECRET, JWT_SECRET, ENCRYPTION_KEY, API_KEY)
pnpm dev:web          # apps/web/.env.local precisa de NEXT_PUBLIC_API_URL e NEXT_PUBLIC_HMAC_SECRET (== HMAC_SECRET da API)
```
- `node-oracledb` roda em modo Thin — **não precisa instalar Oracle Instant Client**.
- Primeiro usuário: `POST /api/auth/register` com `adminKey` = valor de `API_KEY` no `.env`.
- `pnpm approve-builds --all` se o `pnpm install` travar em `ERR_PNPM_IGNORED_BUILDS`.
- O banco Oracle é **remoto e compartilhado** (`oracle.fiap.com.br`, servidor da FIAP) — qualquer máquina que rode o projeto precisa de rede até lá (rede/VPN da FIAP, se restrito). Como o banco é compartilhado entre todas as instâncias, **o `ENCRYPTION_KEY` do `apps/api/.env` precisa ser idêntico em todas as máquinas** (criptografa dados de auditoria já gravados nesse banco — trocar a chave torna registros antigos ilegíveis). Os arquivos `.env`/`.env.local` são git-ignorados — ao mover o projeto pra outra máquina, copiar esses arquivos manualmente (não vêm pelo git clone).
- Se rodar dois `pnpm dev:web` em paralelo (ex.: um seu, outro que uma sessão do Claude deixou aberta em background), o segundo recusa a porta 3000 e pode falhar — `taskkill //PID <pid> //F` no processo antigo resolve.

## Como trabalhamos (preferências já validadas nesta sessão)

- **Dados têm que ser reais e verificáveis** — nunca estimar/inventar um número técnico ou de preço. Se não der pra confirmar uma fonte real, avisar explicitamente em vez de preencher com "chute". Esse padrão vale pra specs de veículo e pra qualquer dado (ex.: preço FIPE).
- **Testar ao vivo no navegador antes de dizer que terminou** — sempre que a mudança for de frontend, subir os dois serviços (`pnpm dev:api` + `pnpm dev:web`), navegar e conferir visualmente (inclusive nos dois temas, claro/escuro, quando a mudança envolver cor).
- **Perguntar antes de apagar dados** (ex.: remover um veículo duplicado do banco) — mesmo sendo uma limpeza óbvia.
- Idioma de trabalho: **português**, mesmo o código/comentários ficando em inglês.
- Preferência por ajustes pontuais e minimalistas guiados por prints anotados (o usuário costuma anexar screenshot com marcações vermelhas indicando exatamente o que mudar) — seguir a anotação literalmente, não expandir escopo.

## Pendências / próximos passos discutidos (nada implementado ainda)

- Não existe tela de "adicionar veículo" nem de edição de spec — hoje a única porta de entrada é `/extract` (agora com campos livres de marca/modelo/versão no dashboard, mas ainda sem tela de edição pós-cadastro).
- `POST /api/vehicles` existe na API mas é código morto — nenhuma tela chama.
- `GET /api/compare` está documentado no README mas não está implementado (o comparativo do web é 100% client-side).
- `apps/api/src/services/updater.ts` existe mas está vazio — pensado para reextração periódica.
- HMAC do web (`NEXT_PUBLIC_HMAC_SECRET`) fica embutido no bundle do cliente — funciona, mas enfraquece o propósito do HMAC (qualquer um pode extrair do JS). Não corrigido ainda.
- Ideia discutida (não implementada): outros KPIs no dashboard — preço médio do segmento, posição de preço Ford vs. concorrência, "veículo mais completo" (score de equipamentos), alerta de dado mais antigo no catálogo (ligado a reviver o `updater.ts`).
