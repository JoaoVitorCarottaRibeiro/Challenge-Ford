export type SpecFieldType = 'bool' | 'number' | 'currency'

export interface SpecField {
  key: string
  label: string
  type: SpecFieldType
  unit?: string
}

export interface SpecCategoryDef {
  name: string
  fields: SpecField[]
}

/**
 * Espelha os campos de VehicleSpec (packages/database/src/VehicleSpec.ts),
 * agrupados pelas mesmas categorias usadas na extração (apps/api/src/services/extractor.ts).
 */
export const SPEC_CATEGORIES: SpecCategoryDef[] = [
  {
    name: 'Motor e Transmissão',
    fields: [
      { key: 'pesoOrdemMarchaKg',       label: 'Peso em ordem de marcha', type: 'number', unit: 'kg'   },
      { key: 'cilindradaL',             label: 'Cilindrada',              type: 'number', unit: 'L'    },
      { key: 'potenciaCv',              label: 'Potência',                type: 'number', unit: 'cv'   },
      { key: 'torqueNm',                label: 'Torque',                  type: 'number', unit: 'Nm'   },
      { key: 'economiaCombustivelKmpl', label: 'Consumo',                 type: 'number', unit: 'km/l' },
      { key: 'qtdMarchas',              label: 'Marchas',                 type: 'number'               },
      { key: 'eAutonomyKm',             label: 'Autonomia elétrica',      type: 'number', unit: 'km'   },
      { key: 'transmissaoAutomatica',   label: 'Câmbio automático',       type: 'bool'                 },
      { key: 'motorFlex',               label: 'Motor flex',              type: 'bool'                 },
      { key: 'motorDiesel',             label: 'Motor diesel',            type: 'bool'                 },
      { key: 'motorEletrico',           label: 'Motor elétrico',          type: 'bool'                 },
      { key: 'tecnologiaTurbo',         label: 'Turbo',                   type: 'bool'                 },
      { key: 'tecnologiaBiturbo',       label: 'Biturbo',                 type: 'bool'                 },
      { key: 'paddleShift',             label: 'Paddle shift',            type: 'bool'                 },
      { key: 'eShifter',                label: 'e-Shifter',               type: 'bool'                 },
      { key: 'fhev',                    label: 'Híbrido leve (FHEV)',     type: 'bool'                 },
      { key: 'phev',                    label: 'Híbrido plug-in (PHEV)',  type: 'bool'                 },
      { key: 'bev',                     label: '100% elétrico (BEV)',     type: 'bool'                 },
    ]
  },
  {
    name: 'Rodas e Pneus',
    fields: [
      { key: 'rodasPolegadas',    label: 'Aro das rodas',          type: 'number', unit: '"' },
      { key: 'rodasLigaLeve',     label: 'Rodas de liga leve',     type: 'bool' },
      { key: 'pneusAtr',          label: 'Pneus A/T',              type: 'bool' },
      { key: 'pneusAtrPlus',      label: 'Pneus A/T Plus',         type: 'bool' },
      { key: 'pneusRunflat',      label: 'Pneus run-flat',         type: 'bool' },
      { key: 'pneusAutoVedantes', label: 'Pneus auto-vedantes',    type: 'bool' },
      { key: 'estepeFullSize',    label: 'Estepe full-size',       type: 'bool' },
      { key: 'estepeTemporario',  label: 'Estepe temporário',      type: 'bool' },
    ]
  },
  {
    name: 'Conectividade e Multimídia',
    fields: [
      { key: 'multimidiaPolegadas',          label: 'Tela multimídia',            type: 'number', unit: '"' },
      { key: 'painelInstrumentoColoridoPol', label: 'Painel digital',             type: 'number', unit: '"' },
      { key: 'altoFalantesQtd',              label: 'Alto-falantes',              type: 'number'            },
      { key: 'usbQtd',                       label: 'Portas USB',                 type: 'number'            },
      { key: 'bluetooth',                    label: 'Bluetooth',                  type: 'bool' },
      { key: 'wifiHotspot',                  label: 'Wi-Fi hotspot',              type: 'bool' },
      { key: 'navegadorGps',                 label: 'GPS integrado',              type: 'bool' },
      { key: 'navegadorGpsAtualizavel',      label: 'GPS atualizável',            type: 'bool' },
      { key: 'comandoVoz',                   label: 'Comando de voz',             type: 'bool' },
      { key: 'assistenteDigital',            label: 'Assistente digital',         type: 'bool' },
      { key: 'espelhamentoAndroidAppleCabo', label: 'Android Auto/CarPlay (cabo)',type: 'bool' },
      { key: 'androidAppleWireless',         label: 'Android Auto/CarPlay sem fio', type: 'bool' },
      { key: 'carregamentoWireless',         label: 'Carregamento por indução',   type: 'bool' },
      { key: 'headUpDisplay',                label: 'Head-up display',            type: 'bool' },
      { key: 'sistemaSomPremium',            label: 'Som premium',                type: 'bool' },
      { key: 'cameraTraseira',               label: 'Câmera de ré',               type: 'bool' },
      { key: 'camera180Graus',               label: 'Câmera 180°',                type: 'bool' },
      { key: 'camera360',                    label: 'Câmera 360°',                type: 'bool' },
      { key: 'lojaAplicativos',              label: 'Loja de aplicativos',        type: 'bool' },
      { key: 'travaDestravaRemoto',          label: 'Trava/destrava remoto (app)',type: 'bool' },
      { key: 'ignicaoRemota',                label: 'Ignição remota',             type: 'bool' },
      { key: 'localizacaoVeiculo',           label: 'Localização do veículo',     type: 'bool' },
      { key: 'vehicleHealthAlerts',          label: 'Alertas de saúde do veículo',type: 'bool' },
      { key: 'sendPoiNavigation',            label: 'Enviar destino ao carro',    type: 'bool' },
      { key: 'geofencingGuardMode',          label: 'Geofencing / modo guarda',   type: 'bool' },
      { key: 'vehicleRecovery',              label: 'Recuperação do veículo',     type: 'bool' },
      { key: 'ubi',                          label: 'Telemetria (UBI)',           type: 'bool' },
      { key: 'atualizacaoOta',               label: 'Atualização OTA',            type: 'bool' },
      { key: 'assistenciaEmergencia',        label: 'Assistência de emergência',  type: 'bool' },
    ]
  },
  {
    name: 'Conforto, Ar-condicionado e Acabamento',
    fields: [
      { key: 'bancoPosicoesEletrico',      label: 'Ajustes elétricos do banco', type: 'number'            },
      { key: 'arCondAutomaticoDigital',    label: 'Ar-condicionado digital',    type: 'bool' },
      { key: 'arCondDuasZonas',            label: 'Ar-condicionado duas zonas', type: 'bool' },
      { key: 'arCondSaida2aFileira',       label: 'Saída de ar 2ª fileira',     type: 'bool' },
      { key: 'bancosCouro',                label: 'Bancos em couro',            type: 'bool' },
      { key: 'volanteCouro',               label: 'Volante em couro',           type: 'bool' },
      { key: 'manoplaCambioCouro',         label: 'Manopla de câmbio em couro', type: 'bool' },
      { key: 'painelSoftTouch',            label: 'Painel soft-touch',          type: 'bool' },
      { key: 'bancoTraseiroAquecido',      label: 'Banco traseiro aquecido',    type: 'bool' },
      { key: 'bancosAquecimentoFrontal',   label: 'Bancos dianteiros aquecidos',type: 'bool' },
      { key: 'bancosRefrigeradosFrontal',  label: 'Bancos dianteiros ventilados', type: 'bool' },
      { key: 'tetoSolarEletrico',          label: 'Teto solar elétrico',        type: 'bool' },
      { key: 'tetoSolarPanoramico',        label: 'Teto solar panorâmico',      type: 'bool' },
      { key: 'travaEletricaPortas',        label: 'Trava elétrica das portas',  type: 'bool' },
      { key: 'vidroEletricoTraseiro',      label: 'Vidro elétrico traseiro',    type: 'bool' },
      { key: 'globalOpening',              label: 'Abertura global',            type: 'bool' },
      { key: 'globalClosing',              label: 'Fechamento global',          type: 'bool' },
      { key: 'alarmeVolumetrico',          label: 'Alarme volumétrico',         type: 'bool' },
    ]
  },
  {
    name: 'Segurança',
    fields: [
      { key: 'airbagsQtd',                  label: 'Airbags',                       type: 'number' },
      { key: 'controleAntiCapotamento',     label: 'Controle anticapotamento',      type: 'bool' },
      { key: 'freioAutomaticoParado',       label: 'Freio automático (parado)',     type: 'bool' },
      { key: 'freioAutomaticoAposImpacto',  label: 'Freio automático pós-impacto',  type: 'bool' },
      { key: 'tpms',                        label: 'Sensor de pressão dos pneus',   type: 'bool' },
      { key: 'controleDescida',             label: 'Controle de descida',           type: 'bool' },
      { key: 'controleAdaptativoCarga',     label: 'Controle adaptativo de carga',  type: 'bool' },
      { key: 'controleReboque',             label: 'Controle de reboque',           type: 'bool' },
      { key: 'trailControl',                label: 'Trail Control',                 type: 'bool' },
      { key: 'assistenciaDirecaoDefensiva', label: 'Assistência de direção defensiva', type: 'bool' },
    ]
  },
  {
    name: 'ADAS e Assistência ao Motorista',
    fields: [
      { key: 'pilotoAutomatico',              label: 'Piloto automático',              type: 'bool' },
      { key: 'pilotoAutomaticoAdaptativo',    label: 'Piloto automático adaptativo (ACC)', type: 'bool' },
      { key: 'accStopAndGo',                  label: 'ACC Stop & Go',                  type: 'bool' },
      { key: 'limitadorVelocidade',           label: 'Limitador de velocidade',        type: 'bool' },
      { key: 'sistemaPermanenciaFaixa',       label: 'Assistente de permanência em faixa', type: 'bool' },
      { key: 'sistemaCentralizacaoFaixa',     label: 'Centralização de faixa',         type: 'bool' },
      { key: 'reconhecimentoSinaisTransito',  label: 'Reconhecimento de sinais',       type: 'bool' },
      { key: 'aeb',                           label: 'Frenagem autônoma de emergência (AEB)', type: 'bool' },
      { key: 'reverseAeb',                    label: 'AEB em ré',                      type: 'bool' },
      { key: 'alertaColisaoFrontal',          label: 'Alerta de colisão frontal',      type: 'bool' },
      { key: 'blis',                          label: 'Alerta de ponto cego (BLIS)',    type: 'bool' },
      { key: 'blisAlertaTrafegoCruzado',      label: 'Alerta de tráfego cruzado',      type: 'bool' },
      { key: 'sensorEstacDianteiro',          label: 'Sensor de estacionamento dianteiro', type: 'bool' },
      { key: 'sensorEstacTraseiro',           label: 'Sensor de estacionamento traseiro',  type: 'bool' },
      { key: 'sensorChuva',                   label: 'Sensor de chuva',                type: 'bool' },
      { key: 'sensorCrepuscular',             label: 'Sensor crepuscular',             type: 'bool' },
      { key: 'detectorFadiga',                label: 'Detector de fadiga',             type: 'bool' },
      { key: 'retroVisorEletrico',            label: 'Retrovisor elétrico',            type: 'bool' },
      { key: 'retroVisorEletrocromico',       label: 'Retrovisor eletrocrômico',       type: 'bool' },
      { key: 'retroVisorRebatimentoEletrico', label: 'Retrovisor rebatimento elétrico',type: 'bool' },
      { key: 'freioMaoEletronico',            label: 'Freio de mão eletrônico',        type: 'bool' },
      { key: 'keylessEntryPeps',              label: 'Entrada e partida sem chave',    type: 'bool' },
    ]
  },
  {
    name: 'Iluminação',
    fields: [
      { key: 'faroisFullLed',      label: 'Faróis Full LED',          type: 'bool' },
      { key: 'faroisMatrixLed',    label: 'Faróis Matrix LED',        type: 'bool' },
      { key: 'faroisNeblinaLed',   label: 'Faróis de neblina em LED', type: 'bool' },
      { key: 'farolAltoAutomatico',label: 'Farol alto automático',    type: 'bool' },
      { key: 'drlSignature',       label: 'Assinatura de luz diurna', type: 'bool' },
      { key: 'lanternasFullLed',   label: 'Lanternas Full LED',       type: 'bool' },
      { key: 'lanternasLedParcial',label: 'Lanternas em LED (parcial)', type: 'bool' },
      { key: 'iluminacaoCacamba',  label: 'Iluminação da caçamba',    type: 'bool' },
    ]
  },
  {
    name: '4x4 e Off-road',
    fields: [
      { key: 'tracao4x4HighLow',            label: 'Tração 4x4 High/Low',        type: 'bool' },
      { key: 'tracaoAwd',                   label: 'Tração AWD',                 type: 'bool' },
      { key: 'diferencialTraseiroBlocante', label: 'Diferencial traseiro blocante', type: 'bool' },
      { key: 'terrainManagementSystem',     label: 'Seleção de terrenos',        type: 'bool' },
      { key: 'suspensaoFoxLiveValve',       label: 'Suspensão FOX Live Valve',   type: 'bool' },
      { key: 'santoAntonio',                label: 'Santo antônio',              type: 'bool' },
      { key: 'estribuLateralPlataforma',    label: 'Estribo lateral plataforma', type: 'bool' },
      { key: 'protetorCacamba',             label: 'Protetor de caçamba',        type: 'bool' },
    ]
  },
  {
    name: 'Utilidade e Garantia',
    fields: [
      { key: 'anosGarantia',                label: 'Garantia',                    type: 'number', unit: 'anos' },
      { key: 'ganchosReboqueQtd',           label: 'Ganchos de reboque',          type: 'number'               },
      { key: 'cabineDupla',                 label: 'Cabine dupla',                type: 'bool' },
      { key: 'engateReboque3500kg',         label: 'Engate de reboque até 3.500kg', type: 'bool' },
      { key: 'degrauAcessoCacamba',         label: 'Degrau de acesso à caçamba',  type: 'bool' },
      { key: 'assistenteTampaCacamba',      label: 'Assistente da tampa da caçamba', type: 'bool' },
      { key: 'travamentoEletricoCacamba',   label: 'Travamento elétrico da caçamba', type: 'bool' },
      { key: 'protetorCarter',              label: 'Protetor de cárter',          type: 'bool' },
      { key: 'protetorTanque',              label: 'Protetor de tanque',          type: 'bool' },
      { key: 'discoFreioTraseiro',          label: 'Freio a disco traseiro',      type: 'bool' },
      { key: 'apoioBracoTraseiro',          label: 'Apoio de braço traseiro',     type: 'bool' },
      { key: 'consoleApoioBracoDianteiro',  label: 'Console apoio de braço dianteiro', type: 'bool' },
      { key: 'bussolaInclinometro',         label: 'Bússola e inclinômetro',      type: 'bool' },
      { key: 'tapeteBorracha',              label: 'Tapete de borracha',          type: 'bool' },
      { key: 'iluminacaoAmbiente',          label: 'Iluminação ambiente',         type: 'bool' },
      { key: 'tomada12v',                   label: 'Tomada 12V',                  type: 'bool' },
      { key: 'bagageiroTetoLong',           label: 'Bagageiro de teto',           type: 'bool' },
    ]
  },
]

export const HERO_FIELDS: SpecField[] = [
  { key: 'precoBaseBrl', label: 'Preço', type: 'currency' },
  { key: 'potenciaCv',   label: 'Potência', type: 'number', unit: 'cv' },
  { key: 'torqueNm',     label: 'Torque',   type: 'number', unit: 'Nm' },
  { key: 'anosGarantia', label: 'Garantia', type: 'number', unit: 'anos' },
]

export const SOURCE_LABEL: Record<string, { text: string; color: string }> = {
  db_cache:      { text: 'Retornado do banco',              color: '#10b981' },
  pdf_oficial:   { text: 'Ficha técnica oficial (PDF)',     color: '#3b82f6' },
  pdf_upload:    { text: 'PDF enviado por você',            color: '#0ea5e9' },
  web_scraping:  { text: 'Fontes públicas na web',          color: '#f59e0b' },
  ia_generated:  { text: 'Estimado pelo agente de IA (sem fonte verificada)', color: '#8b5cf6' },
}

export function formatSpecValue(value: unknown, field: SpecField): string {
  if (value === null || value === undefined) return '—'
  if (field.type === 'bool') return value === 1 || value === true ? 'Sim' : 'Não'
  if (field.type === 'currency') {
    const num = Number(value)
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  }
  return `${value}${field.unit ? ` ${field.unit}` : ''}`
}
