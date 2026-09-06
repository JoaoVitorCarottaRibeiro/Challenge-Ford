import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'
import axios from 'axios'
import { config } from '../config/env'
import { normalizeText, parseHeadlineSpecs } from './specParser'

const MODEL = 'claude-haiku-4-5'

// Client construído sob demanda — com ANTHROPIC_API_KEY vazia, o SDK lança no
// primeiro uso (não no import), e a gente simplesmente nunca chama getClient()
// nesse caso (ver `config.aiEnabled` abaixo).
let _anthropic: Anthropic | null = null
function getClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: config.anthropicApiKey })
  return _anthropic
}

const OFFICIAL_URLS: Record<string, string[]> = {
  'toyota':     ['https://www.toyota.com.br/modelos/hilux-cabine-dupla'],
  'mitsubishi': ['https://www.mitsubishimotors.com.br/veiculos/triton'],
  'ford':       ['https://www.ford.com.br/picapes/ranger/', 'https://www.ford.com.br/picapes/ranger-raptor/'],
  'volkswagen': ['https://www.vw.com.br/pt/modelos/amarok.html'],
  'chevrolet':  ['https://www.chevrolet.com.br/caminhonetes/s10'],
}

const INDEPENDENT_URLS: Record<string, string[]> = {
  'toyota':     ['https://www.icarros.com.br/toyota/hilux/versoes/14571'],
  'mitsubishi': ['https://www.icarros.com.br/mitsubishi/l200+triton/versoes/9791'],
  'ford':       ['https://www.icarros.com.br/ford/ranger/versoes/14091'],
  'volkswagen': ['https://www.icarros.com.br/volkswagen/amarok/versoes/9203'],
  'chevrolet':  ['https://www.icarros.com.br/chevrolet/s10/versoes/9074'],
  // Sem página "/versoes/<id>" própria confirmada pra essas três — o path
  // curto abaixo redireciona (o axios segue, maxRedirects já configurado) pro
  // catálogo real da versão mais indexada da marca.
  'nissan':     ['https://www.icarros.com.br/nissan/frontier'],
  'fiat':       ['https://www.icarros.com.br/fiat/titano'],
  'byd':        ['https://www.icarros.com.br/byd/shark'],
}

interface SpecCategory {
  name: string
  schema: string
}

/**
 * Uma chamada por categoria em vez de um único JSON com 150+ campos:
 * reduz o risco de truncamento e mantém cada resposta pequena e confiável.
 */
const SPEC_CATEGORIES: SpecCategory[] = [
  {
    name: 'Motor e Transmissão',
    schema: `{
      "peso_ordem_marcha_kg": number | null,
      "cilindrada_l": number | null,
      "potencia_cv": number | null,
      "torque_nm": number | null,
      "economia_combustivel_kmpl": number | null,
      "transmissao_automatica": 0 | 1 | null,
      "motor_flex": 0 | 1 | null,
      "tecnologia_turbo": 0 | 1 | null,
      "qtd_marchas": number | null,
      "fhev": 0 | 1 | null,
      "phev": 0 | 1 | null,
      "bev": 0 | 1 | null,
      "motor_diesel": 0 | 1 | null,
      "paddle_shift": 0 | 1 | null,
      "e_shifter": 0 | 1 | null,
      "tecnologia_biturbo": 0 | 1 | null,
      "motor_eletrico": 0 | 1 | null,
      "e_autonomy_km": number | null
    }`
  },
  {
    name: 'Rodas e Pneus',
    schema: `{
      "rodas_liga_leve": 0 | 1 | null,
      "rodas_polegadas": number | null,
      "pneus_atr": 0 | 1 | null,
      "pneus_runflat": 0 | 1 | null,
      "pneus_atr_plus": 0 | 1 | null,
      "pneus_auto_vedantes": 0 | 1 | null,
      "estepe_full_size": 0 | 1 | null,
      "estepe_temporario": 0 | 1 | null
    }`
  },
  {
    name: 'Conectividade e Multimídia',
    schema: `{
      "loja_aplicativos": 0 | 1 | null,
      "assistente_digital": 0 | 1 | null,
      "trava_destrava_remoto": 0 | 1 | null,
      "ignicao_remota": 0 | 1 | null,
      "localizacao_veiculo": 0 | 1 | null,
      "vehicle_health_alerts": 0 | 1 | null,
      "send_poi_navigation": 0 | 1 | null,
      "geofencing_guard_mode": 0 | 1 | null,
      "vehicle_recovery": 0 | 1 | null,
      "ubi": 0 | 1 | null,
      "wifi_hotspot": 0 | 1 | null,
      "atualizacao_ota": 0 | 1 | null,
      "bluetooth": 0 | 1 | null,
      "camera_traseira": 0 | 1 | null,
      "camera_180_graus": 0 | 1 | null,
      "navegador_gps": 0 | 1 | null,
      "navegador_gps_atualizavel": 0 | 1 | null,
      "comando_voz": 0 | 1 | null,
      "alto_falantes_qtd": number | null,
      "head_up_display": 0 | 1 | null,
      "sistema_som_premium": 0 | 1 | null,
      "espelhamento_android_apple_cabo": 0 | 1 | null,
      "multimidia_polegadas": number | null,
      "assistencia_emergencia": 0 | 1 | null,
      "carregamento_wireless": 0 | 1 | null,
      "camera_360": 0 | 1 | null,
      "android_apple_wireless": 0 | 1 | null,
      "painel_instrumento_colorido_pol": number | null,
      "usb_qtd": number | null
    }`
  },
  {
    name: 'Conforto, Ar-condicionado e Acabamento',
    schema: `{
      "ar_cond_saida_2a_fileira": 0 | 1 | null,
      "ar_cond_automatico_digital": 0 | 1 | null,
      "ar_cond_duas_zonas": 0 | 1 | null,
      "alarme_volumetrico": 0 | 1 | null,
      "global_opening": 0 | 1 | null,
      "trava_eletrica_portas": 0 | 1 | null,
      "vidro_eletrico_traseiro": 0 | 1 | null,
      "global_closing": 0 | 1 | null,
      "bancos_couro": 0 | 1 | null,
      "manopla_cambio_couro": 0 | 1 | null,
      "volante_couro": 0 | 1 | null,
      "painel_soft_touch": 0 | 1 | null,
      "teto_solar_eletrico": 0 | 1 | null,
      "teto_solar_panoramico": 0 | 1 | null,
      "banco_traseiro_aquecido": 0 | 1 | null,
      "bancos_aquecimento_frontal": 0 | 1 | null,
      "bancos_refrigerados_frontal": 0 | 1 | null,
      "banco_posicoes_eletrico": number | null
    }`
  },
  {
    name: 'Segurança',
    schema: `{
      "controle_anti_capotamento": 0 | 1 | null,
      "freio_automatico_parado": 0 | 1 | null,
      "tpms": 0 | 1 | null,
      "controle_descida": 0 | 1 | null,
      "controle_adaptativo_carga": 0 | 1 | null,
      "controle_reboque": 0 | 1 | null,
      "trail_control": 0 | 1 | null,
      "freio_automatico_apos_impacto": 0 | 1 | null,
      "assistencia_direcao_defensiva": 0 | 1 | null,
      "airbags_qtd": number | null
    }`
  },
  {
    name: 'ADAS e Assistência ao Motorista',
    schema: `{
      "piloto_automatico": 0 | 1 | null,
      "limitador_velocidade": 0 | 1 | null,
      "piloto_automatico_adaptativo": 0 | 1 | null,
      "sistema_permanencia_faixa": 0 | 1 | null,
      "sensor_estac_traseiro": 0 | 1 | null,
      "sensor_estac_dianteiro": 0 | 1 | null,
      "sensor_chuva": 0 | 1 | null,
      "retrovisor_eletrocromico": 0 | 1 | null,
      "sensor_crepuscular": 0 | 1 | null,
      "detector_fadiga": 0 | 1 | null,
      "freio_mao_eletronico": 0 | 1 | null,
      "retrovisor_eletrico": 0 | 1 | null,
      "blis": 0 | 1 | null,
      "reconhecimento_sinais_transito": 0 | 1 | null,
      "aeb": 0 | 1 | null,
      "retrovisor_rebatimento_eletrico": 0 | 1 | null,
      "alerta_colisao_frontal": 0 | 1 | null,
      "sistema_centralizacao_faixa": 0 | 1 | null,
      "acc_stop_and_go": 0 | 1 | null,
      "blis_alerta_trafego_cruzado": 0 | 1 | null,
      "reverse_aeb": 0 | 1 | null,
      "keyless_entry_peps": 0 | 1 | null
    }`
  },
  {
    name: 'Iluminação',
    schema: `{
      "farois_full_led": 0 | 1 | null,
      "drl_signature": 0 | 1 | null,
      "farol_alto_automatico": 0 | 1 | null,
      "lanternas_led_parcial": 0 | 1 | null,
      "lanternas_full_led": 0 | 1 | null,
      "farois_neblina_led": 0 | 1 | null,
      "farois_matrix_led": 0 | 1 | null,
      "iluminacao_cacamba": 0 | 1 | null
    }`
  },
  {
    name: '4x4 e Off-road',
    schema: `{
      "tracao_4x4_high_low": 0 | 1 | null,
      "diferencial_traseiro_blocante": 0 | 1 | null,
      "santo_antonio": 0 | 1 | null,
      "estribo_lateral_plataforma": 0 | 1 | null,
      "protetor_cacamba": 0 | 1 | null,
      "terrain_management_system": 0 | 1 | null,
      "tracao_awd": 0 | 1 | null,
      "suspensao_fox_live_valve": 0 | 1 | null
    }`
  },
  {
    name: 'Utilidade e Garantia',
    schema: `{
      "anos_garantia": number | null,
      "apoio_braco_traseiro": 0 | 1 | null,
      "cabine_dupla": 0 | 1 | null,
      "degrau_acesso_cacamba": 0 | 1 | null,
      "assistente_tampa_cacamba": 0 | 1 | null,
      "travamento_eletrico_cacamba": 0 | 1 | null,
      "engate_reboque_3500kg": 0 | 1 | null,
      "bussola_inclinometro": 0 | 1 | null,
      "console_apoio_braco_dianteiro": 0 | 1 | null,
      "disco_freio_traseiro": 0 | 1 | null,
      "ganchos_reboque_qtd": number | null,
      "protetor_carter": 0 | 1 | null,
      "protetor_tanque": 0 | 1 | null,
      "tapete_borracha": 0 | 1 | null,
      "iluminacao_ambiente": 0 | 1 | null,
      "tomada_12v": 0 | 1 | null,
      "bagageiro_teto_long": 0 | 1 | null,
      "preco_base_brl": number | null
    }`
  }
]

export interface ExtractionResult {
  specs: Record<string, unknown>
  source: 'pdf_oficial' | 'pdf_upload' | 'web_scraping' | 'ia_generated'
  pdfSourceFile: string | null
  categoriesSearched: string[]
  /** `{ "<campo>": "deterministic" | "ai" }` — de onde veio cada valor preenchido. */
  provenance: Record<string, 'deterministic' | 'ai'>
  /** false quando ANTHROPIC_API_KEY não está configurada — resultado é só o parser determinístico. */
  aiEnabled: boolean
}

export const SPEC_CATEGORY_NAMES: string[] = SPEC_CATEGORIES.map(c => c.name)

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FordPickupIntel/1.0)' },
      timeout: 15000,
      maxRedirects: 5
    })
    const raw = String(res.data)

    // Em muitos sites de catálogo (iCarros etc.) o corpo é renderizado por JS —
    // a resposta bruta do servidor é só menu/nav genérico dentro do corte de
    // 6000 chars abaixo. O <title>, por outro lado, costuma vir server-side e
    // já carrega o dado denso que interessa (ex.: "BYD Shark 1.5T PHEV GS 4WD
    // Auto 2027" — trim, tração, câmbio e ano numa linha só). Captura separado
    // pra nunca ser cortado pelo limite do corpo.
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : ''

    const body = raw
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000)

    return title ? `${title}\n${body}` : body
  } catch {
    return ''
  }
}

export async function collectWebSources(brand: string): Promise<{ contents: string[]; urls: string[] }> {
  const brandKey = brand.toLowerCase()
  const allUrls = [
    ...(OFFICIAL_URLS[brandKey] || []),
    ...(INDEPENDENT_URLS[brandKey] || [])
  ]

  const results = await Promise.allSettled(allUrls.map(url => fetchPage(url)))
  const contents: string[] = []
  const successUrls: string[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 100) {
      contents.push(`=== Fonte secundária: ${allUrls[i]} ===\n${result.value}`)
      successUrls.push(allUrls[i])
    }
  })

  return { contents, urls: successUrls }
}

const PDF_CACHE_DIR = path.join(process.cwd(), 'pdfs', '.cache')

/**
 * Transcreve um PDF pra texto, cacheado em disco por hash do conteúdo — a
 * transcrição via IA roda no máximo uma vez por PDF, nunca de novo a cada
 * `/extract`. Sem cache e sem ANTHROPIC_API_KEY, não há como transcrever
 * (nenhum extrator de texto local embutido ainda) — volta string vazia e o
 * chamador segue em modo determinístico/web.
 */
export async function transcribePdf(pdfPath: string): Promise<string> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const hash = createHash('sha256').update(pdfBuffer).digest('hex')
  const cacheFile = path.join(PDF_CACHE_DIR, `${hash}.txt`)

  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, 'utf8')
  }

  if (!config.aiEnabled) return ''

  const base64 = pdfBuffer.toString('base64')

  const message = await getClient().messages.create({
    model: MODEL,
    // Fichas com uma página inteira por versão (ex.: básica/intermediária/topo) podem passar
    // de 2048 tokens facilmente — um limite baixo aqui corta o conteúdo antes da última versão
    // documentada, fazendo a extração por categoria cair de volta nos dados de uma versão errada.
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: 'Extraia todo o texto técnico deste documento, incluindo tabelas de especificações, equipamentos e preços, se houver. Se o documento tiver mais de uma versão/trim do veículo (ex: básica, intermediária, topo de linha), transcreva TODAS elas por completo, identificando claramente qual bloco de texto pertence a qual versão — não pare no meio.' }
      ]
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  if (text) {
    fs.mkdirSync(PDF_CACHE_DIR, { recursive: true })
    fs.writeFileSync(cacheFile, text, 'utf8')
  }

  return text
}

export interface IdentifiedVehicle {
  brand: string | null
  model: string | null
  version: string | null
  yearModel: number | null
}

const EMPTY_IDENTITY: IdentifiedVehicle = { brand: null, model: null, version: null, yearModel: null }

/**
 * Descobre marca/modelo/versão/ano a partir do texto já transcrito de uma
 * ficha — pra quando o usuário manda só o PDF, sem preencher a identidade do
 * veículo manualmente. Diferente do parser de specs (regex, sem IA), "qual
 * veículo é este documento" é uma tarefa de linguagem natural — não há regra
 * determinística de propósito geral confiável pra isso, então usa IA direto
 * (só quando habilitada; sem chave, o chamador cai no caminho de preencher
 * manualmente).
 */
export async function identifyVehicleFromText(text: string): Promise<IdentifiedVehicle> {
  if (!config.aiEnabled || !text) return EMPTY_IDENTITY

  const prompt = `O texto abaixo pode conter mais de uma fonte concatenada: a transcrição de uma ficha
técnica automotiva (pode descrever mais de uma versão/trim do mesmo veículo) e, possivelmente depois
dela, um trecho de página web sobre o mesmo veículo (ex.: título de página de catálogo/anúncio — esse
tipo de título costuma vir bem denso, tipo "Marca Modelo motor TRIM tração câmbio ano", tudo numa linha).

Identifique o VEÍCULO: marca (montadora), modelo, nome da versão/trim principal (a mais completa/topo
de linha, se houver mais de uma) e o ano-modelo.

PASSO 1 — leia com atenção TODO o texto fornecido (a ficha inteira E o trecho web, se houver) procurando
esses quatro dados escritos explicitamente, inclusive em títulos curtos e densos como os de catálogo.
Marca e modelo normalmente estão na capa/cabeçalho da ficha. Versão/trim e ano, quando a ficha não
nomeia, costumam aparecer no título da página web (é exatamente pra isso que ela foi incluída aqui) —
não ignore essa parte do texto.

PASSO 2 — só se o PASSO 1 não encontrar versão/ano em lugar nenhum do texto, e marca+modelo já
estiverem claros, você pode preencher com conhecimento confiável e específico sobre ESSE veículo exato
no mercado brasileiro. Se nem isso, retorne null em vez de adivinhar.

"version" deve ser só o NOME da versão/trim (ex.: "GS", "Highline V6", "SRX", "PRO-4X") — nunca a
string inteira de um título de catálogo (que costuma misturar motor+trim+tração+câmbio+ano numa linha
só). Se o título for algo como "Marca Modelo 1.5T PHEV GS 4WD Auto 2027", o nome da versão ali é "GS".

Retorne APENAS JSON válido, sem texto antes ou depois, sem markdown, com exatamente estas chaves:
{ "brand": string | null, "model": string | null, "version": string | null, "yearModel": number | null }

Texto:
${text.substring(0, 12000)}`

  try {
    const message = await getClient().messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim()
    const parsed = JSON.parse(clean)
    const year = typeof parsed.yearModel === 'number' ? parsed.yearModel : Number(parsed.yearModel)
    return {
      brand: typeof parsed.brand === 'string' && parsed.brand.trim() ? parsed.brand.trim() : null,
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : null,
      version: typeof parsed.version === 'string' && parsed.version.trim() ? parsed.version.trim() : null,
      yearModel: Number.isFinite(year) && year >= 1990 && year <= 2030 ? year : null,
    }
  } catch (err) {
    console.error('[EXTRACT] Falha ao identificar veículo a partir do PDF', err)
    return EMPTY_IDENTITY
  }
}

/** Nomes de campo declarados no schema de uma categoria (as chaves `"campo":`). */
function categoryFieldNames(schema: string): string[] {
  const names: string[] = []
  const re = /"([a-z0-9_]+)"\s*:/g
  let m: RegExpExecArray | null
  while ((m = re.exec(schema))) names.push(m[1])
  return names
}

/**
 * Uma chamada de IA por categoria. Nunca lança — qualquer falha (rede, SDK,
 * JSON truncado) vira `{}` depois de logar, pra não derrubar as outras
 * categorias (o chamador usa `Promise.allSettled`, mas isso é uma segunda
 * camada de proteção). Um retry específico quando o JSON vem truncado —
 * `max_tokens` já é dimensionado pelo tamanho da categoria, então na prática
 * cobre uma resposta ruim pontual, não um truncamento sistemático.
 */
async function extractCategory(
  category: SpecCategory,
  vehicleLabel: string,
  sourcesText: string,
  hasOfficialSource: boolean
): Promise<Record<string, unknown>> {
  if (!config.aiEnabled) return {}

  const fieldCount = categoryFieldNames(category.schema).length || 10
  const maxTokens = Math.min(8192, Math.max(2048, fieldCount * 140))

  const prompt = `Você é um extrator de especificações técnicas automotivas.
Analise o conteúdo fornecido e extraia os dados do veículo solicitado, apenas para a categoria "${category.name}".
${hasOfficialSource ? 'Uma das fontes está marcada como "FONTE OFICIAL" — em caso de conflito entre fontes, sempre priorize os dados dela.' : ''}
ATENÇÃO — documentos de fabricante frequentemente descrevem VÁRIAS versões/trims do mesmo modelo
(ex: básica, intermediária, topo de linha), cada uma com sua própria seção de especificações e lista
de equipamentos, muitas vezes com aparência quase idêntica entre si. O veículo abaixo especifica uma
versão exata — use SOMENTE os dados da seção que corresponde EXATAMENTE a essa versão. Nunca misture
um valor (torque, câmbio, item de série, etc.) de uma versão diferente, mesmo que pareça mais completo
ou apareça mais cedo no texto. Se não conseguir identificar com segurança qual trecho pertence à versão
pedida, retorne null para esse campo em vez de adivinhar.
Se a fonte não mencionar um campo explicitamente, mas você souber com boa confiança — pelo tipo de
motorização/tração descrito na própria fonte, ou por conhecimento confiável e específico sobre ESTE
veículo exato (marca+modelo+versão) — pode preencher com base nisso em vez de ir direto pra null (ex.:
um powertrain 100% PHEV/BEV descrito na fonte não tem câmbio manual, então "câmbio automático" pode ser
1 mesmo sem a fonte usar essa palavra). Isso é diferente de adivinhar às cegas: só preencha assim quando
a inferência for praticamente certa; na dúvida real, null continua sendo a resposta certa.
Retorne APENAS JSON válido, sem texto antes ou depois, sem markdown.
Para campos booleanos: 1 se o equipamento está presente/confirmado, 0 se confirmadamente ausente, null se não foi possível confirmar com confiança.
Torque em Nm. Potência em cv. Preço em reais (BRL), somente o valor numérico, sem símbolos.

Veículo: ${vehicleLabel}

Fontes:
${sourcesText}

Retorne APENAS este JSON preenchido, com exatamente estas chaves:
${category.schema}`

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const message = await getClient().messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const clean = text
        .replace(/^```json\s*/m, '')
        .replace(/^```\s*/m, '')
        .replace(/```\s*$/m, '')
        .trim()

      return JSON.parse(clean)
    } catch (err) {
      if (attempt < 2) continue // 1 retry — cobre um JSON truncado/malformado pontual
      console.error(`[EXTRACT] categoria "${category.name}" falhou após retry:`, err)
      return {}
    }
  }
  return {}
}

/**
 * Extrai as especificações de um veículo, combinando (em ordem de confiança):
 * 1. Parser determinístico (regex) sobre o texto transcrito da ficha oficial em PDF
 *    (quando `pdfPath` é informado) — sem IA, cobre os campos objetivos.
 * 2. IA por categoria, só pras categorias que ainda sobraram com algum campo nulo
 *    depois do passo 1 — alimentada com o mesmo texto já transcrito (cacheado),
 *    sem nova chamada multimodal. Pulado inteiramente se ANTHROPIC_API_KEY não
 *    estiver configurada.
 * 3. Scraping de páginas oficiais e independentes, como fonte adicional pra IA.
 * 4. Conhecimento geral do modelo, só quando nenhuma fonte acima existe.
 */
export async function extractVehicleSpecs(
  brand: string,
  modelName: string,
  version: string,
  yearModel?: number | null,
  pdfPath?: string | null,
  pdfSourceType: 'oficial' | 'upload' = 'oficial',
  pdfDisplayName?: string | null,
  selectedCategories?: string[]
): Promise<ExtractionResult> {
  const vehicleLabel = `${brand} ${modelName} ${version}${yearModel ? ` ${yearModel}` : ''}`

  // Usuário define livremente quais categorias/atributos técnicos quer pesquisar.
  // Sem seleção (ou seleção vazia/inválida) mantém o comportamento padrão: pesquisa tudo.
  const categoriesToRun = selectedCategories && selectedCategories.length > 0
    ? SPEC_CATEGORIES.filter(c => selectedCategories.includes(c.name))
    : SPEC_CATEGORIES
  const activeCategories = categoriesToRun.length > 0 ? categoriesToRun : SPEC_CATEGORIES

  let transcription = ''
  if (pdfPath) {
    try {
      transcription = await transcribePdf(pdfPath)
    } catch (err) {
      console.error('[EXTRACT] Falha ao transcrever PDF oficial', pdfPath, err)
    }
  }

  // Passo 1 — determinístico, sem IA.
  const { specs: deterministicSpecs, provenance } = parseHeadlineSpecs(normalizeText(transcription))
  const specs: Record<string, unknown> = { ...deterministicSpecs }

  const { contents: webContents, urls: webUrls } = await collectWebSources(brand)

  const sourceBlocks: string[] = []
  if (transcription) sourceBlocks.push(`=== FONTE OFICIAL (ficha técnica em PDF) ===\n${transcription}`)
  sourceBlocks.push(...webContents)

  const source: ExtractionResult['source'] = transcription
    ? (pdfSourceType === 'upload' ? 'pdf_upload' : 'pdf_oficial')
    : webContents.length > 0
      ? 'web_scraping'
      : 'ia_generated'

  const sourcesText = sourceBlocks.length > 0
    ? sourceBlocks.join('\n\n').substring(0, 24000)
    : `Nenhuma fonte externa disponível. Use seu conhecimento geral sobre o mercado automotivo brasileiro para estimar as especificações de: ${vehicleLabel}. Se não tiver certeza de um dado, retorne null.`

  // Passo 2 — IA só nas categorias que ainda têm campo nulo, e só se houver
  // alguma fonte (PDF ou web) ou, na ausência de qualquer fonte, chute por
  // conhecimento geral (comportamento antigo, preservado).
  if (config.aiEnabled && (transcription || webContents.length > 0 || sourceBlocks.length === 0)) {
    const queued = activeCategories
      .map(category => {
        const missing = categoryFieldNames(category.schema)
          .filter(field => specs[field] === undefined || specs[field] === null)
        return { category, missing }
      })
      .filter(({ missing }) => missing.length > 0)

    const settled = await Promise.allSettled(
      queued.map(({ category }) => extractCategory(category, vehicleLabel, sourcesText, !!transcription))
    )

    settled.forEach((result, i) => {
      const { category } = queued[i]
      if (result.status === 'rejected') {
        console.error(`[EXTRACT] categoria "${category.name}" rejeitada`, result.reason)
        return
      }
      for (const [key, value] of Object.entries(result.value)) {
        if (value === null || value === undefined) continue
        if (specs[key] === undefined || specs[key] === null) {
          specs[key] = value
          provenance[key] = 'ai'
        }
      }
    })
  }

  const pdfSourceFile = transcription && pdfPath ? (pdfDisplayName ?? path.basename(pdfPath)) : null
  specs.source_urls = pdfSourceFile
    ? [pdfSourceFile, ...webUrls]
    : webUrls.length ? webUrls : config.aiEnabled ? ['claude_knowledge'] : []
  specs.search_queries = webUrls.map(u => `fetch: ${u}`)
  specs.field_provenance = provenance

  return {
    specs,
    source,
    pdfSourceFile,
    categoriesSearched: activeCategories.map(c => c.name),
    provenance,
    aiEnabled: config.aiEnabled
  }
}
