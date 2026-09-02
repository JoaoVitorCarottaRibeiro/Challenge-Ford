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

## O gatekeeper escondido do `GET /vehicles`

```ts
const withSpecs = all.filter(v => v.spec !== null && v.spec.potenciaCv !== null)
```
Um veículo só aparece nas listagens se **o campo potência especificamente** estiver preenchido — não documentado em nenhum lugar, é só uma linha de filtro. Se cadastrar algo manualmente e esquecer de preencher `potenciaCv`, o registro fica invisível (mas existe no banco).

## Catálogo atual (10 veículos, todos com fonte real)

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

## Features implementadas nesta sessão

- **Upload de PDF arbitrário** no `/extract` (campo `pdfBase64`, base64 dentro do JSON já assinado por HMAC — sem precisar de multipart/dependência nova).
- **Seleção livre de categorias** (`categories: string[]` no `/extract`) — atende ao requisito literal do desafio de deixar o usuário definir quais atributos quer pesquisar; também usado para forçar reextração sem depender de upload.
- **Login redesenhado** estilo B3 (split-screen, sempre claro independente do tema do app).
- **Tela de Veículos**: logos de marca reais via Simple Icons (`cdn.simpleicons.org`, com fallback pra letra se a imagem falhar) + filtro de marcas em chips.
- **Dashboard** trocado de lista redundante com `/vehicles` para visão executiva: KPIs (cobertura de dados, confiabilidade de fontes), destaque Ford vs. concorrência, liderança em potência, atividade recente.
- **Menu lateral**: perfil colapsado num único gatilho, abre popover com tema claro/escuro + sair.
- Emojis removidos de toda a interface, substituídos por ícones lucide-react.

## Como rodar localmente

```bash
pnpm install          # na raiz
pnpm dev:api          # apps/api/.env precisa estar preenchido (DB_*, ANTHROPIC_API_KEY, HMAC_SECRET, JWT_SECRET, ENCRYPTION_KEY, API_KEY)
pnpm dev:web          # apps/web/.env.local precisa de NEXT_PUBLIC_API_URL e NEXT_PUBLIC_HMAC_SECRET (== HMAC_SECRET da API)
```
- `node-oracledb` roda em modo Thin — **não precisa instalar Oracle Instant Client**, ao contrário do que o README ainda sugere.
- Primeiro usuário: `POST /api/auth/register` com `adminKey` = valor de `API_KEY` no `.env`.
- `pnpm approve-builds --all` se o `pnpm install` travar em `ERR_PNPM_IGNORED_BUILDS`.

## Pendências / próximos passos discutidos (nada implementado ainda)

- Não existe tela de "adicionar veículo" nem de edição de spec — hoje a única porta de entrada é `/extract`, com marca/modelo/versão presos a um dropdown fixo (`VEHICLE_OPTIONS` no código), não texto livre.
- `POST /api/vehicles` existe na API mas é código morto — nenhuma tela chama.
- `GET /api/compare` está documentado no README mas não está implementado (o comparativo do web é 100% client-side).
- `apps/api/src/services/updater.ts` existe mas está vazio — pensado para reextração periódica.
- Ideia discutida (não implementada): usar a Tabela FIPE (API pública `parallelum.com.br/fipe`) como catálogo de identidade limpo (marca/modelo/ano) para alimentar autocomplete — não tem dado técnico, só serve pra evitar erro de digitação/duplicata.
- HMAC do web (`NEXT_PUBLIC_HMAC_SECRET`) fica embutido no bundle do cliente — funciona, mas enfraquece o propósito do HMAC (qualquer um pode extrair do JS). Não corrigido ainda.
