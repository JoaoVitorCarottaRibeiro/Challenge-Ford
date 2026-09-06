import { FastifyInstance } from 'fastify'
import { DeepPartial } from 'typeorm'
import { AppDataSource } from '@ford-intel/database'
import { Vehicle } from '@ford-intel/database'
import { VehicleSpec } from '@ford-intel/database'
import { extractVehicleSpecs, transcribePdf, identifyVehicleFromText, collectWebSources } from '../services/extractor'
import { logAudit } from '../services/audit'
import { normalizeVehicleIdentity } from '../services/normalize'
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/rbac'
import * as path from 'path'
import * as fs from 'fs'
import { randomUUID } from 'crypto'

const MAX_PDF_BYTES = 15 * 1024 * 1024
const UPLOAD_DIR = path.join(process.cwd(), 'pdfs', 'uploads')

function sanitizeFileName(name: string | undefined): string {
  if (!name) return 'ficha.pdf'
  const base = path.basename(name).replace(/[^a-zA-Z0-9._\- ]/g, '_').trim()
  return base.slice(0, 150) || 'ficha.pdf'
}

/**
 * Salva um PDF arbitrário enviado pelo usuário (base64, no corpo da requisição
 * autenticada como admin) em disco, fora da pasta curada `pdfs/`, com nome
 * gerado aleatoriamente para evitar path traversal e colisão de arquivos.
 */
function saveUploadedPdf(pdfBase64: string, originalName?: string): { path: string; displayName: string } {
  const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',').pop()! : pdfBase64
  const buffer = Buffer.from(cleanBase64, 'base64')

  if (buffer.length === 0) {
    throw new Error('Arquivo PDF vazio ou inválido')
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error(`Arquivo excede o limite de ${MAX_PDF_BYTES / (1024 * 1024)}MB`)
  }
  if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('O arquivo enviado não é um PDF válido')
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const fullPath = path.join(UPLOAD_DIR, `${randomUUID()}.pdf`)
  fs.writeFileSync(fullPath, buffer)

  return { path: fullPath, displayName: sanitizeFileName(originalName) }
}

const PDF_MAP: Record<string, string> = {
  'ford-ranger-raptor':            'fichaRaptor.pdf',
  'toyota-hilux-srx':              'fichaHilux.pdf',
  'toyota-hilux-srx plus':         'fichaHilux.pdf',
  'toyota-hilux-gr sport':         'fichaHiluxGRSport.pdf',
  'mitsubishi-triton-katana':      'fichaTritonMitsubish.pdf',
  'mitsubishi-l200 triton-katana': 'fichaTritonMitsubish.pdf',
  // fichaAmarok.pdf (Out/2020) é do motor 2.0 TDI 4-cilindros — documento cita
  // explicitamente "Comfortline e Highline Cabine Dupla" como aplicáveis.
  'volkswagen-amarok-comfortline': 'fichaAmarok.pdf',
  // fichaAmarokV6.pdf (Out/2020, press kit oficial VW) é do motor 3.0 TDI V6 —
  // documento cita explicitamente "Highline e Extreme Cabine Dupla" como aplicáveis.
  'volkswagen-amarok-highline v6': 'fichaAmarokV6.pdf',
  'volkswagen-amarok-extreme':     'fichaAmarokV6.pdf',
  // Fichas oficiais baixadas direto do domínio do fabricante (nissan-cdn.net, fiat.com.br, byd.com)
  'nissan-frontier-pro-4x':        'fichaFrontier.pdf',
  'fiat-titano-ranch':             'fichaTitano.pdf',
  'byd-shark-gs':                  'fichaShark.pdf',
}

function findPdfPath(brand: string, model: string, version: string): string | null {
  const key = `${brand}-${model}-${version}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  const filename = PDF_MAP[key]
  if (!filename) return null
  const fullPath = path.join(process.cwd(), 'pdfs', filename)
  return fs.existsSync(fullPath) ? fullPath : null
}

function mapSpecsToEntity(s: Record<string, unknown>) {
  const b = (v: unknown): number | undefined => (v === null || v === undefined) ? undefined : Number(v)
  const n = (v: unknown): number | undefined => (v === null || v === undefined) ? undefined : Number(v)

  return {
    sourceUrls:                     s['source_urls']       != null ? JSON.stringify(s['source_urls'])       : undefined,
    searchQueries:                  s['search_queries']    != null ? JSON.stringify(s['search_queries'])    : undefined,
    fieldProvenance:                s['field_provenance']  != null ? JSON.stringify(s['field_provenance'])  : undefined,
    pesoOrdemMarchaKg:              n(s['peso_ordem_marcha_kg']),
    cilindradaL:                    n(s['cilindrada_l']),
    potenciaCv:                     n(s['potencia_cv']),
    torqueNm:                       n(s['torque_nm']),
    economiaCombustivelKmpl:        n(s['economia_combustivel_kmpl']),
    transmissaoAutomatica:          b(s['transmissao_automatica']),
    motorFlex:                      b(s['motor_flex']),
    tecnologiaTurbo:                b(s['tecnologia_turbo']),
    qtdMarchas:                     n(s['qtd_marchas']),
    fhev:                           b(s['fhev']),
    phev:                           b(s['phev']),
    bev:                            b(s['bev']),
    motorDiesel:                    b(s['motor_diesel']),
    paddleShift:                    b(s['paddle_shift']),
    eShifter:                       b(s['e_shifter']),
    tecnologiaBiturbo:              b(s['tecnologia_biturbo']),
    motorEletrico:                  b(s['motor_eletrico']),
    eAutonomyKm:                    n(s['e_autonomy_km']),
    rodasLigaLeve:                  b(s['rodas_liga_leve']),
    rodasPolegadas:                 n(s['rodas_polegadas']),
    pneusAtr:                       b(s['pneus_atr']),
    pneusRunflat:                   b(s['pneus_runflat']),
    pneusAtrPlus:                   b(s['pneus_atr_plus']),
    pneusAutoVedantes:              b(s['pneus_auto_vedantes']),
    estepeFullSize:                 b(s['estepe_full_size']),
    estepeTemporario:               b(s['estepe_temporario']),
    lojaAplicativos:                b(s['loja_aplicativos']),
    assistenteDigital:              b(s['assistente_digital']),
    travaDestravaRemoto:            b(s['trava_destrava_remoto']),
    ignicaoRemota:                  b(s['ignicao_remota']),
    localizacaoVeiculo:             b(s['localizacao_veiculo']),
    vehicleHealthAlerts:            b(s['vehicle_health_alerts']),
    sendPoiNavigation:              b(s['send_poi_navigation']),
    geofencingGuardMode:            b(s['geofencing_guard_mode']),
    vehicleRecovery:                b(s['vehicle_recovery']),
    ubi:                            b(s['ubi']),
    wifiHotspot:                    b(s['wifi_hotspot']),
    atualizacaoOta:                 b(s['atualizacao_ota']),
    bluetooth:                      b(s['bluetooth']),
    cameraTraseira:                 b(s['camera_traseira']),
    camera180Graus:                 b(s['camera_180_graus']),
    navegadorGps:                   b(s['navegador_gps']),
    navegadorGpsAtualizavel:        b(s['navegador_gps_atualizavel']),
    comandoVoz:                     b(s['comando_voz']),
    altoFalantesQtd:                n(s['alto_falantes_qtd']),
    headUpDisplay:                  b(s['head_up_display']),
    sistemaSomPremium:              b(s['sistema_som_premium']),
    espelhamentoAndroidAppleCabo:   b(s['espelhamento_android_apple_cabo']),
    multimidiaPolegadas:            n(s['multimidia_polegadas']),
    assistenciaEmergencia:          b(s['assistencia_emergencia']),
    carregamentoWireless:           b(s['carregamento_wireless']),
    camera360:                      b(s['camera_360']),
    androidAppleWireless:           b(s['android_apple_wireless']),
    painelInstrumentoColoridoPol:   n(s['painel_instrumento_colorido_pol']),
    usbQtd:                         n(s['usb_qtd']),
    arCondSaida2aFileira:           b(s['ar_cond_saida_2a_fileira']),
    arCondAutomaticoDigital:        b(s['ar_cond_automatico_digital']),
    arCondDuasZonas:                b(s['ar_cond_duas_zonas']),
    controleAntiCapotamento:        b(s['controle_anti_capotamento']),
    freioAutomaticoParado:          b(s['freio_automatico_parado']),
    tpms:                           b(s['tpms']),
    controleDescida:                b(s['controle_descida']),
    controleAdaptativoCarga:        b(s['controle_adaptativo_carga']),
    controleReboque:                b(s['controle_reboque']),
    trailControl:                   b(s['trail_control']),
    freioAutomaticoAposImpacto:     b(s['freio_automatico_apos_impacto']),
    assistenciaDirecaoDefensiva:    b(s['assistencia_direcao_defensiva']),
    airbagsQtd:                     n(s['airbags_qtd']),
    pilotoAutomatico:               b(s['piloto_automatico']),
    limitadorVelocidade:            b(s['limitador_velocidade']),
    pilotoAutomaticoAdaptativo:     b(s['piloto_automatico_adaptativo']),
    sistemaPermanenciaFaixa:        b(s['sistema_permanencia_faixa']),
    sensorEstacTraseiro:            b(s['sensor_estac_traseiro']),
    sensorEstacDianteiro:           b(s['sensor_estac_dianteiro']),
    sensorChuva:                    b(s['sensor_chuva']),
    retroVisorEletrocromico:        b(s['retrovisor_eletrocromico']),
    sensorCrepuscular:              b(s['sensor_crepuscular']),
    detectorFadiga:                 b(s['detector_fadiga']),
    freioMaoEletronico:             b(s['freio_mao_eletronico']),
    retroVisorEletrico:             b(s['retrovisor_eletrico']),
    blis:                           b(s['blis']),
    reconhecimentoSinaisTransito:   b(s['reconhecimento_sinais_transito']),
    aeb:                            b(s['aeb']),
    retroVisorRebatimentoEletrico:  b(s['retrovisor_rebatimento_eletrico']),
    alertaColisaoFrontal:           b(s['alerta_colisao_frontal']),
    sistemaCentralizacaoFaixa:      b(s['sistema_centralizacao_faixa']),
    accStopAndGo:                   b(s['acc_stop_and_go']),
    blisAlertaTrafegoCruzado:       b(s['blis_alerta_trafego_cruzado']),
    reverseAeb:                     b(s['reverse_aeb']),
    keylessEntryPeps:               b(s['keyless_entry_peps']),
    alarmeVolumetrico:              b(s['alarme_volumetrico']),
    globalOpening:                  b(s['global_opening']),
    travaEletricaPortas:            b(s['trava_eletrica_portas']),
    vidroEletricoTraseiro:          b(s['vidro_eletrico_traseiro']),
    globalClosing:                  b(s['global_closing']),
    bancosCouro:                    b(s['bancos_couro']),
    manoplaCambioCouro:             b(s['manopla_cambio_couro']),
    volanteCouro:                   b(s['volante_couro']),
    painelSoftTouch:                b(s['painel_soft_touch']),
    tetoSolarEletrico:              b(s['teto_solar_eletrico']),
    tetoSolarPanoramico:            b(s['teto_solar_panoramico']),
    bancoTraseiroAquecido:          b(s['banco_traseiro_aquecido']),
    bancosAquecimentoFrontal:       b(s['bancos_aquecimento_frontal']),
    bancosRefrigeradosFrontal:      b(s['bancos_refrigerados_frontal']),
    bancoPosicoesEletrico:          n(s['banco_posicoes_eletrico']),
    faroisFullLed:                  b(s['farois_full_led']),
    drlSignature:                   b(s['drl_signature']),
    farolAltoAutomatico:            b(s['farol_alto_automatico']),
    lanternasLedParcial:            b(s['lanternas_led_parcial']),
    lanternasFullLed:               b(s['lanternas_full_led']),
    faroisNeblinaLed:               b(s['farois_neblina_led']),
    faroisMatrixLed:                b(s['farois_matrix_led']),
    iluminacaoCacamba:              b(s['iluminacao_cacamba']),
    tracao4x4HighLow:               b(s['tracao_4x4_high_low']),
    diferencialTraseiroBlocante:    b(s['diferencial_traseiro_blocante']),
    santoAntonio:                   b(s['santo_antonio']),
    estribuLateralPlataforma:       b(s['estribo_lateral_plataforma']),
    protetorCacamba:                b(s['protetor_cacamba']),
    terrainManagementSystem:        b(s['terrain_management_system']),
    tracaoAwd:                      b(s['tracao_awd']),
    suspensaoFoxLiveValve:          b(s['suspensao_fox_live_valve']),
    anosGarantia:                   n(s['anos_garantia']),
    precoBaseBrl:                   n(s['preco_base_brl']),
    apoioBracoTraseiro:             b(s['apoio_braco_traseiro']),
    cabineDupla:                    b(s['cabine_dupla']),
    degrauAcessoCacamba:            b(s['degrau_acesso_cacamba']),
    assistenteTampaCacamba:         b(s['assistente_tampa_cacamba']),
    travamentoEletricoCacamba:      b(s['travamento_eletrico_cacamba']),
    engateReboque3500kg:            b(s['engate_reboque_3500kg']),
    bussolaInclinometro:            b(s['bussola_inclinometro']),
    consoleApoioBracoDianteiro:     b(s['console_apoio_braco_dianteiro']),
    discoFreioTraseiro:             b(s['disco_freio_traseiro']),
    ganchosReboqueQtd:              n(s['ganchos_reboque_qtd']),
    protetorCarter:                 b(s['protetor_carter']),
    protetorTanque:                 b(s['protetor_tanque']),
    tapeteBorracha:                 b(s['tapete_borracha']),
    iluminacaoAmbiente:             b(s['iluminacao_ambiente']),
    tomada12v:                      b(s['tomada_12v']),
    bagageiroTetoLong:              b(s['bagageiro_teto_long']),
  }
}

export async function vehicleRoutes(app: FastifyInstance) {
  const vehicleRepo = AppDataSource.getRepository(Vehicle)
  const specRepo    = AppDataSource.getRepository(VehicleSpec)

  app.get('/vehicles', {
    preHandler: [authenticate]
  }, async (req: AuthenticatedRequest, reply) => {
    await logAudit('list_vehicles', req, 'success')
    const all = await vehicleRepo.find({ relations: ['spec', 'segment'] })
    const withSpecs = all.filter(v => v.spec !== null && v.spec.potenciaCv !== null)
    const seen = new Set<string>()
    const unique = withSpecs.filter(v => {
      const key = `${v.brand.toLowerCase()}-${v.model.toLowerCase()}-${v.version.toLowerCase()}-${v.yearModel}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return unique
  })

  app.get('/vehicles/:id', {
    preHandler: [authenticate]
  }, async (req: AuthenticatedRequest, reply) => {
    const { id } = req.params as { id: string }
    const vehicle = await vehicleRepo.findOne({ where: { id }, relations: ['spec', 'segment'] })

    if (!vehicle) {
      await logAudit('get_vehicle', req, 'error', { id }, 'Veículo não encontrado')
      return reply.status(404).send({ error: 'Veículo não encontrado' })
    }

    await logAudit('get_vehicle', req, 'success', { id })
    return vehicle
  })

  app.delete('/vehicles/:id', {
    preHandler: [authenticate, requireRole('admin')]
  }, async (req: AuthenticatedRequest, reply) => {
    const { id } = req.params as { id: string }

    const vehicle = await vehicleRepo.findOne({ where: { id }, relations: ['spec'] })
    if (!vehicle) return reply.status(404).send({ error: 'Veículo não encontrado' })

    if (vehicle.spec) await specRepo.delete({ vehicle: { id } })
    await vehicleRepo.delete(id)

    await logAudit('delete_vehicle', req, 'success', { id })
    return reply.send({ message: 'Veículo removido com sucesso' })
  })

  app.post('/vehicles', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: {
        type: 'object',
        required: ['brand', 'model', 'version'],
        properties: {
          brand:        { type: 'string', minLength: 1, maxLength: 100 },
          model:        { type: 'string', minLength: 1, maxLength: 100 },
          version:      { type: 'string', minLength: 1, maxLength: 100 },
          yearModel:    { type: 'integer', minimum: 1990, maximum: 2030 },
          yearModelEnd: { type: 'integer', minimum: 1990, maximum: 2030 },
          isMidyear:    { type: 'boolean' }
        },
        additionalProperties: false
      }
    }
  }, async (req: AuthenticatedRequest, reply) => {
    const body = req.body as {
      brand: string; model: string; version: string
      yearModel?: number; yearModelEnd?: number; isMidyear?: boolean
    }
    const { brand, model, version } = normalizeVehicleIdentity(body)
    const { yearModel, yearModelEnd, isMidyear } = body

    const vehicle = vehicleRepo.create({ brand, model, version, yearModel, yearModelEnd, isMidyear })
    await vehicleRepo.save(vehicle)

    await logAudit('create_vehicle', req, 'success', { brand, model, version, yearModel })
    return reply.status(201).send(vehicle)
  })

  app.post('/extract', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: {
        type: 'object',
        // Nada é obrigatório no nível do schema — marca/modelo/versão/ano só são
        // exigidos de verdade quando NÃO vem PDF (checado no handler, já que o
        // JSON Schema puro não expressa "obrigatório a menos que X"). Com PDF e
        // sem esses campos, a identidade do veículo é descoberta a partir do
        // próprio documento.
        properties: {
          brand:        { type: 'string', minLength: 1, maxLength: 100 },
          model:        { type: 'string', minLength: 1, maxLength: 100 },
          version:      { type: 'string', minLength: 1, maxLength: 100 },
          yearModel:    { type: 'integer', minimum: 1990, maximum: 2030 },
          yearModelEnd: { type: 'integer', minimum: 1990, maximum: 2030 },
          isMidyear:    { type: 'boolean' },
          // Ficha técnica (de qualquer concorrente) enviada livremente pelo usuário,
          // em base64 — dispensa depender do PDF_MAP curado abaixo.
          pdfBase64:    { type: 'string' },
          pdfFileName:  { type: 'string', maxLength: 200 },
          // Lista livre de categorias/atributos técnicos que o usuário quer pesquisar.
          // Ausente ou vazia = pesquisa todas as categorias (comportamento padrão).
          categories:   { type: 'array', items: { type: 'string', maxLength: 100 }, maxItems: 20 }
        },
        additionalProperties: false
      }
    }
  }, async (req: AuthenticatedRequest, reply) => {
    const body = req.body as {
      brand?: string; model?: string; version?: string
      yearModel?: number; yearModelEnd?: number; isMidyear?: boolean
      pdfBase64?: string; pdfFileName?: string
      categories?: string[]
    }
    let { brand, model, version, yearModel } = body
    const { yearModelEnd, isMidyear, pdfBase64, pdfFileName, categories } = body

    if (!pdfBase64 && (!brand || !model || !version || !yearModel)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Informe marca, modelo, versão e ano, ou envie uma ficha em PDF para identificação automática.'
      })
    }

    let pdfPath: string | null = null
    let pdfSourceType: 'oficial' | 'upload' = 'oficial'
    let pdfDisplayName: string | undefined

    if (pdfBase64) {
      try {
        const saved = saveUploadedPdf(pdfBase64, pdfFileName)
        pdfPath = saved.path
        pdfSourceType = 'upload'
        pdfDisplayName = saved.displayName
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'PDF inválido'
        await logAudit('extract', req, 'error', { brand, model, version, yearModel }, msg)
        return reply.status(400).send({ error: 'Upload inválido', message: msg })
      }

      // PDF veio, mas o usuário não preencheu a identidade completa — descobre
      // a partir do próprio documento antes de seguir. `transcribePdf` é
      // cacheado por hash do arquivo, então a extração de specs mais abaixo
      // reusa esse mesmo texto sem transcrever de novo.
      if (!brand || !model || !version) {
        let transcription = ''
        try {
          transcription = await transcribePdf(pdfPath)
        } catch (err) {
          console.error('[EXTRACT] Falha ao transcrever PDF pra identificação', err)
        }
        const identified = await identifyVehicleFromText(transcription)
        brand = brand || identified.brand || undefined
        model = model || identified.model || undefined
        version = version || identified.version || undefined
        yearModel = yearModel || identified.yearModel || undefined

        // PDF sozinho pode não nomear versão/ano (ficha de configuração única,
        // por ex.). Com marca já sabida, busca fontes web da marca — inclusive
        // o <title> de páginas de catálogo, que costuma carregar justamente
        // trim/tração/câmbio/ano numa linha só — e tenta identificar de novo
        // com mais contexto antes de desistir.
        if (brand && (!version || !yearModel)) {
          try {
            const { contents: webContents } = await collectWebSources(brand)
            if (webContents.length > 0) {
              // Web primeiro: é curto e costuma ter o dado que falta (ex.: título
              // de página de catálogo) — se vier depois da ficha (que sozinha já
              // pode passar de milhares de caracteres), o corte de tamanho do
              // prompt descarta o texto web inteiro antes da IA nem ver.
              const combined = `${webContents.join('\n\n')}\n\n${transcription}`
              const reIdentified = await identifyVehicleFromText(combined)
              version = version || reIdentified.version || undefined
              yearModel = yearModel || reIdentified.yearModel || undefined
            }
          } catch (err) {
            console.error('[EXTRACT] Falha ao buscar fontes web pra identificação', err)
          }
        }

        // Marca+modelo são o mínimo pra saber QUAL veículo é. Versão/trim, nem
        // toda ficha nomeia (ex.: lançamento com configuração única) — nesse
        // caso não travamos a extração por causa disso, só rotulamos honesto.
        if (!brand || !model) {
          await logAudit('extract', req, 'error', {}, 'Não foi possível identificar o veículo a partir do PDF')
          return reply.status(422).send({
            error: 'Unprocessable Entity',
            message: 'Não conseguimos identificar marca/modelo a partir do PDF enviado. Preencha os campos manualmente e tente de novo.'
          })
        }
        if (!version) version = 'Padrão'
      }
    } else {
      pdfPath = findPdfPath(brand!, model!, version!)
    }

    // Daqui pra frente tudo num try só — inclusive a busca do veículo existente
    // no Oracle, que antes ficava fora de qualquer captura e podia virar um 500
    // silencioso (sem linha de erro na auditoria) se o banco tropeçasse.
    try {
      const normalized = normalizeVehicleIdentity({ brand: brand!, model: model!, version: version! })
      brand = normalized.brand
      model = normalized.model
      version = normalized.version

      const where: Record<string, unknown> = { brand, model, version }
      if (yearModel != null) where.yearModel = yearModel

      const existing = await vehicleRepo.findOne({ where, relations: ['spec'] })

      const hasCategoryFilter = !!categories && categories.length > 0

      // Um PDF enviado ou uma seleção de categorias mais restrita que o padrão
      // são pedidos explícitos de (re)extração — não retornam do cache.
      if (existing?.spec && !pdfBase64 && !hasCategoryFilter) {
        await logAudit('extract', req, 'success', { brand, model, version, yearModel, source: 'db_cache' })
        return reply.status(200).send({ vehicle: existing, spec: existing.spec, source: 'db_cache' })
      }

      const { specs, source, pdfSourceFile, categoriesSearched, provenance, aiEnabled } = await extractVehicleSpecs(
        brand, model, version, yearModel, pdfPath, pdfSourceType, pdfDisplayName, categories
      )

      const vehicle = existing ?? vehicleRepo.create({
        brand, model, version, yearModel, yearModelEnd,
        isMidyear: isMidyear ?? false
      })
      if (!existing) await vehicleRepo.save(vehicle)

      const mapped = mapSpecsToEntity(specs)
      let spec: VehicleSpec
      if (existing?.spec) {
        // Categorias fora da seleção não retornam dado nesta rodada (viram `undefined`
        // em mapSpecsToEntity) — não devem apagar valores já confirmados anteriormente.
        Object.entries(mapped).forEach(([key, value]) => {
          if (value !== undefined) (existing.spec as any)[key] = value
        })
        Object.assign(existing.spec, { source, pdfSourceFile, status: 'active' })
        spec = existing.spec
      } else {
        spec = specRepo.create({ vehicle, source, pdfSourceFile, status: 'active', ...mapped } as DeepPartial<VehicleSpec>)
      }
      await specRepo.save(spec)

      await logAudit('extract', req, 'success', {
        brand, model, version, yearModel, source, pdfUploaded: !!pdfBase64, categoriesSearched, aiEnabled
      })
      return reply.status(existing?.spec ? 200 : 201).send({
        vehicle, spec, source, categoriesSearched, provenance, aiEnabled,
        ...(aiEnabled ? {} : { aiDisabled: true, notice: 'IA desabilitada — só specs-base extraídas por regra, sem preenchimento por IA.' })
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('[EXTRACT ERROR]', err)
      await logAudit('extract', req, 'error', { brand, model, version, yearModel }, msg)
      return reply.status(500).send({ error: 'Falha na extração', message: msg })
    }
  })
}