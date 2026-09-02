import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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
}

export const SPEC_CATEGORY_NAMES: string[] = SPEC_CATEGORIES.map(c => c.name)

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FordPickupIntel/1.0)' },
      timeout: 15000,
      maxRedirects: 5
    })
    return String(res.data)
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000)
  } catch {
    return ''
  }
}

async function collectWebSources(brand: string): Promise<{ contents: string[]; urls: string[] }> {
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

async function readPdfText(pdfPath: string): Promise<string> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const base64 = pdfBuffer.toString('base64')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
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

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

async function extractCategory(
  category: SpecCategory,
  vehicleLabel: string,
  sourcesText: string,
  hasOfficialSource: boolean
): Promise<Record<string, unknown>> {
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
Retorne APENAS JSON válido, sem texto antes ou depois, sem markdown.
Para campos booleanos: 1 se o equipamento está presente/confirmado, 0 se confirmadamente ausente, null se não foi possível confirmar.
Torque em Nm. Potência em cv. Preço em reais (BRL), somente o valor numérico, sem símbolos.

Veículo: ${vehicleLabel}

Fontes:
${sourcesText}

Retorne APENAS este JSON preenchido, com exatamente estas chaves:
${category.schema}`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  const clean = text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()

  try {
    return JSON.parse(clean)
  } catch {
    return {}
  }
}

/**
 * Extrai as especificações de um veículo, combinando (em ordem de confiança):
 * 1. Ficha técnica oficial em PDF (quando `pdfPath` é informado) — tratada como fonte autoritativa.
 * 2. Scraping de páginas oficiais e independentes.
 * 3. Conhecimento geral do modelo, apenas quando nenhuma das fontes acima retorna conteúdo.
 */
export async function extractVehicleSpecs(
  brand: string,
  modelName: string,
  version: string,
  yearModel: number,
  pdfPath?: string | null,
  pdfSourceType: 'oficial' | 'upload' = 'oficial',
  pdfDisplayName?: string | null,
  selectedCategories?: string[]
): Promise<ExtractionResult> {
  const vehicleLabel = `${brand} ${modelName} ${version} ${yearModel}`

  // Usuário define livremente quais categorias/atributos técnicos quer pesquisar.
  // Sem seleção (ou seleção vazia/inválida) mantém o comportamento padrão: pesquisa tudo.
  const categoriesToRun = selectedCategories && selectedCategories.length > 0
    ? SPEC_CATEGORIES.filter(c => selectedCategories.includes(c.name))
    : SPEC_CATEGORIES
  const activeCategories = categoriesToRun.length > 0 ? categoriesToRun : SPEC_CATEGORIES

  let pdfText = ''
  if (pdfPath) {
    try {
      pdfText = await readPdfText(pdfPath)
    } catch (err) {
      console.error('[EXTRACT] Falha ao ler PDF oficial', pdfPath, err)
    }
  }

  const { contents: webContents, urls: webUrls } = await collectWebSources(brand)

  const sourceBlocks: string[] = []
  if (pdfText) sourceBlocks.push(`=== FONTE OFICIAL (ficha técnica em PDF) ===\n${pdfText}`)
  sourceBlocks.push(...webContents)

  const source: ExtractionResult['source'] = pdfText
    ? (pdfSourceType === 'upload' ? 'pdf_upload' : 'pdf_oficial')
    : webContents.length > 0
      ? 'web_scraping'
      : 'ia_generated'

  const sourcesText = sourceBlocks.length > 0
    ? sourceBlocks.join('\n\n').substring(0, 24000)
    : `Nenhuma fonte externa disponível. Use seu conhecimento geral sobre o mercado automotivo brasileiro para estimar as especificações de: ${vehicleLabel}. Se não tiver certeza de um dado, retorne null.`

  const categoryResults = await Promise.all(
    activeCategories.map(category => extractCategory(category, vehicleLabel, sourcesText, !!pdfText))
  )

  const specs: Record<string, unknown> = Object.assign({}, ...categoryResults)

  const pdfSourceFile = pdfText && pdfPath ? (pdfDisplayName ?? path.basename(pdfPath)) : null
  specs.source_urls = pdfSourceFile ? [pdfSourceFile, ...webUrls] : (webUrls.length ? webUrls : ['claude_knowledge'])
  specs.search_queries = webUrls.map(u => `fetch: ${u}`)

  return { specs, source, pdfSourceFile, categoriesSearched: activeCategories.map(c => c.name) }
}
