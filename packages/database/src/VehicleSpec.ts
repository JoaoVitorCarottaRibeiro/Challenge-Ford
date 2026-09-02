import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { Vehicle } from './Vehicle'

@Entity('vehicle_specs')
export class VehicleSpec {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @OneToOne(() => Vehicle, vehicle => vehicle.spec)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle

  // Engine & Transmission
  @Column({ name: 'peso_ordem_marcha_kg', type: 'number', nullable: true })
  pesoOrdemMarchaKg!: number

  @Column({ name: 'cilindrada_l', type: 'number', nullable: true })
  cilindradaL!: number

  @Column({ name: 'potencia_cv', type: 'number', nullable: true })
  potenciaCv!: number

  @Column({ name: 'torque_nm', type: 'number', nullable: true })
  torqueNm!: number

  @Column({ name: 'economia_combustivel_kmpl', type: 'number', nullable: true })
  economiaCombustivelKmpl!: number

  @Column({ name: 'transmissao_automatica', type: 'number', width: 1, nullable: true })
  transmissaoAutomatica!: boolean

  @Column({ name: 'motor_flex', type: 'number', width: 1, nullable: true })
  motorFlex!: boolean

  @Column({ name: 'tecnologia_turbo', type: 'number', width: 1, nullable: true })
  tecnologiaTurbo!: boolean

  @Column({ name: 'qtd_marchas', type: 'number', nullable: true })
  qtdMarchas!: number

  @Column({ name: 'fhev', type: 'number', width: 1, nullable: true })
  fhev!: boolean

  @Column({ name: 'phev', type: 'number', width: 1, nullable: true })
  phev!: boolean

  @Column({ name: 'bev', type: 'number', width: 1, nullable: true })
  bev!: boolean

  @Column({ name: 'motor_diesel', type: 'number', width: 1, nullable: true })
  motorDiesel!: boolean

  @Column({ name: 'paddle_shift', type: 'number', width: 1, nullable: true })
  paddleShift!: boolean

  @Column({ name: 'e_shifter', type: 'number', width: 1, nullable: true })
  eShifter!: boolean

  @Column({ name: 'tecnologia_biturbo', type: 'number', width: 1, nullable: true })
  tecnologiaBiturbo!: boolean

  @Column({ name: 'motor_eletrico', type: 'number', width: 1, nullable: true })
  motorEletrico!: boolean

  @Column({ name: 'e_autonomy_km', type: 'number', nullable: true })
  eAutonomyKm!: number

  // Wheels
  @Column({ name: 'rodas_liga_leve', type: 'number', width: 1, nullable: true })
  rodasLigaLeve!: boolean

  @Column({ name: 'rodas_polegadas', type: 'number', nullable: true })
  rodasPolegadas!: number

  @Column({ name: 'pneus_atr', type: 'number', width: 1, nullable: true })
  pneusAtr!: boolean

  @Column({ name: 'pneus_runflat', type: 'number', width: 1, nullable: true })
  pneusRunflat!: boolean

  @Column({ name: 'pneus_atr_plus', type: 'number', width: 1, nullable: true })
  pneusAtrPlus!: boolean

  @Column({ name: 'pneus_auto_vedantes', type: 'number', width: 1, nullable: true })
  pneusAutoVedantes!: boolean

  @Column({ name: 'estepe_full_size', type: 'number', width: 1, nullable: true })
  estepeFullSize!: boolean

  @Column({ name: 'estepe_temporario', type: 'number', width: 1, nullable: true })
  estepeTemporario!: boolean

  // Connectivity
  @Column({ name: 'loja_aplicativos', type: 'number', width: 1, nullable: true })
  lojaAplicativos!: boolean

  @Column({ name: 'assistente_digital', type: 'number', width: 1, nullable: true })
  assistenteDigital!: boolean

  @Column({ name: 'trava_destrava_remoto', type: 'number', width: 1, nullable: true })
  travaDestravaRemoto!: boolean

  @Column({ name: 'ignicao_remota', type: 'number', width: 1, nullable: true })
  ignicaoRemota!: boolean

  @Column({ name: 'localizacao_veiculo', type: 'number', width: 1, nullable: true })
  localizacaoVeiculo!: boolean

  @Column({ name: 'vehicle_health_alerts', type: 'number', width: 1, nullable: true })
  vehicleHealthAlerts!: boolean

  @Column({ name: 'send_poi_navigation', type: 'number', width: 1, nullable: true })
  sendPoiNavigation!: boolean

  @Column({ name: 'geofencing_guard_mode', type: 'number', width: 1, nullable: true })
  geofencingGuardMode!: boolean

  @Column({ name: 'vehicle_recovery', type: 'number', width: 1, nullable: true })
  vehicleRecovery!: boolean

  @Column({ name: 'ubi', type: 'number', width: 1, nullable: true })
  ubi!: boolean

  @Column({ name: 'wifi_hotspot', type: 'number', width: 1, nullable: true })
  wifiHotspot!: boolean

  @Column({ name: 'atualizacao_ota', type: 'number', width: 1, nullable: true })
  atualizacaoOta!: boolean

  // Multimídia
  @Column({ name: 'bluetooth', type: 'number', width: 1, nullable: true })
  bluetooth!: boolean

  @Column({ name: 'camera_traseira', type: 'number', width: 1, nullable: true })
  cameraTraseira!: boolean

  @Column({ name: 'camera_180_graus', type: 'number', width: 1, nullable: true })
  camera180Graus!: boolean

  @Column({ name: 'navegador_gps', type: 'number', width: 1, nullable: true })
  navegadorGps!: boolean

  @Column({ name: 'navegador_gps_atualizavel', type: 'number', width: 1, nullable: true })
  navegadorGpsAtualizavel!: boolean

  @Column({ name: 'comando_voz', type: 'number', width: 1, nullable: true })
  comandoVoz!: boolean

  @Column({ name: 'alto_falantes_qtd', type: 'number', nullable: true })
  altoFalantesQtd!: number

  @Column({ name: 'head_up_display', type: 'number', width: 1, nullable: true })
  headUpDisplay!: boolean

  @Column({ name: 'sistema_som_premium', type: 'number', width: 1, nullable: true })
  sistemaSomPremium!: boolean

  @Column({ name: 'espelhamento_android_apple_cabo', type: 'number', width: 1, nullable: true })
  espelhamentoAndroidAppleCabo!: boolean

  @Column({ name: 'multimidia_polegadas', type: 'number', nullable: true })
  multimidiaPolegadas!: number

  @Column({ name: 'assistencia_emergencia', type: 'number', width: 1, nullable: true })
  assistenciaEmergencia!: boolean

  @Column({ name: 'carregamento_wireless', type: 'number', width: 1, nullable: true })
  carregamentoWireless!: boolean

  @Column({ name: 'camera_360', type: 'number', width: 1, nullable: true })
  camera360!: boolean

  @Column({ name: 'android_apple_wireless', type: 'number', width: 1, nullable: true })
  androidAppleWireless!: boolean

  @Column({ name: 'painel_instrumento_colorido_pol', type: 'number', nullable: true })
  painelInstrumentoColoridoPol!: number

  @Column({ name: 'usb_qtd', type: 'number', nullable: true })
  usbQtd!: number

  // Air Conditioning
  @Column({ name: 'ar_cond_saida_2a_fileira', type: 'number', width: 1, nullable: true })
  arCondSaida2aFileira!: boolean

  @Column({ name: 'ar_cond_automatico_digital', type: 'number', width: 1, nullable: true })
  arCondAutomaticoDigital!: boolean

  @Column({ name: 'ar_cond_duas_zonas', type: 'number', width: 1, nullable: true })
  arCondDuasZonas!: boolean

  // Safety
  @Column({ name: 'controle_anti_capotamento', type: 'number', width: 1, nullable: true })
  controleAntiCapotamento!: boolean

  @Column({ name: 'freio_automatico_parado', type: 'number', width: 1, nullable: true })
  freioAutomaticoParado!: boolean

  @Column({ name: 'tpms', type: 'number', width: 1, nullable: true })
  tpms!: boolean

  @Column({ name: 'controle_descida', type: 'number', width: 1, nullable: true })
  controleDescida!: boolean

  @Column({ name: 'controle_adaptativo_carga', type: 'number', width: 1, nullable: true })
  controleAdaptativoCarga!: boolean

  @Column({ name: 'controle_reboque', type: 'number', width: 1, nullable: true })
  controleReboque!: boolean

  @Column({ name: 'trail_control', type: 'number', width: 1, nullable: true })
  trailControl!: boolean

  @Column({ name: 'freio_automatico_apos_impacto', type: 'number', width: 1, nullable: true })
  freioAutomaticoAposImpacto!: boolean

  @Column({ name: 'assistencia_direcao_defensiva', type: 'number', width: 1, nullable: true })
  assistenciaDirecaoDefensiva!: boolean

  @Column({ name: 'airbags_qtd', type: 'number', nullable: true })
  airbagsQtd!: number

  // High Tech
  @Column({ name: 'piloto_automatico', type: 'number', width: 1, nullable: true })
  pilotoAutomatico!: boolean

  @Column({ name: 'limitador_velocidade', type: 'number', width: 1, nullable: true })
  limitadorVelocidade!: boolean

  @Column({ name: 'piloto_automatico_adaptativo', type: 'number', width: 1, nullable: true })
  pilotoAutomaticoAdaptativo!: boolean

  @Column({ name: 'sistema_permanencia_faixa', type: 'number', width: 1, nullable: true })
  sistemaPermanenciaFaixa!: boolean

  @Column({ name: 'sensor_estac_traseiro', type: 'number', width: 1, nullable: true })
  sensorEstacTraseiro!: boolean

  @Column({ name: 'sensor_estac_dianteiro', type: 'number', width: 1, nullable: true })
  sensorEstacDianteiro!: boolean

  @Column({ name: 'sensor_chuva', type: 'number', width: 1, nullable: true })
  sensorChuva!: boolean

  @Column({ name: 'retrovisor_eletrocromico', type: 'number', width: 1, nullable: true })
  retroVisorEletrocromico!: boolean

  @Column({ name: 'sensor_crepuscular', type: 'number', width: 1, nullable: true })
  sensorCrepuscular!: boolean

  @Column({ name: 'detector_fadiga', type: 'number', width: 1, nullable: true })
  detectorFadiga!: boolean

  @Column({ name: 'freio_mao_eletronico', type: 'number', width: 1, nullable: true })
  freioMaoEletronico!: boolean

  @Column({ name: 'retrovisor_eletrico', type: 'number', width: 1, nullable: true })
  retroVisorEletrico!: boolean

  @Column({ name: 'blis', type: 'number', width: 1, nullable: true })
  blis!: boolean

  @Column({ name: 'reconhecimento_sinais_transito', type: 'number', width: 1, nullable: true })
  reconhecimentoSinaisTransito!: boolean

  @Column({ name: 'aeb', type: 'number', width: 1, nullable: true })
  aeb!: boolean

  @Column({ name: 'retrovisor_rebatimento_eletrico', type: 'number', width: 1, nullable: true })
  retroVisorRebatimentoEletrico!: boolean

  @Column({ name: 'alerta_colisao_frontal', type: 'number', width: 1, nullable: true })
  alertaColisaoFrontal!: boolean

  @Column({ name: 'sistema_centralizacao_faixa', type: 'number', width: 1, nullable: true })
  sistemaCentralizacaoFaixa!: boolean

  @Column({ name: 'acc_stop_and_go', type: 'number', width: 1, nullable: true })
  accStopAndGo!: boolean

  @Column({ name: 'blis_alerta_trafego_cruzado', type: 'number', width: 1, nullable: true })
  blisAlertaTrafegoCruzado!: boolean

  @Column({ name: 'reverse_aeb', type: 'number', width: 1, nullable: true })
  reverseAeb!: boolean

  @Column({ name: 'keyless_entry_peps', type: 'number', width: 1, nullable: true })
  keylessEntryPeps!: boolean

  // Global Closing
  @Column({ name: 'alarme_volumetrico', type: 'number', width: 1, nullable: true })
  alarmeVolumetrico!: boolean

  @Column({ name: 'global_opening', type: 'number', width: 1, nullable: true })
  globalOpening!: boolean

  @Column({ name: 'trava_eletrica_portas', type: 'number', width: 1, nullable: true })
  travaEletricaPortas!: boolean

  @Column({ name: 'vidro_eletrico_traseiro', type: 'number', width: 1, nullable: true })
  vidroEletricoTraseiro!: boolean

  @Column({ name: 'global_closing', type: 'number', width: 1, nullable: true })
  globalClosing!: boolean

  // Trim
  @Column({ name: 'bancos_couro', type: 'number', width: 1, nullable: true })
  bancosCouro!: boolean

  @Column({ name: 'manopla_cambio_couro', type: 'number', width: 1, nullable: true })
  manoplaCambioCouro!: boolean

  @Column({ name: 'volante_couro', type: 'number', width: 1, nullable: true })
  volanteCouro!: boolean

  @Column({ name: 'painel_soft_touch', type: 'number', width: 1, nullable: true })
  painelSoftTouch!: boolean

  // SunRoof
  @Column({ name: 'teto_solar_eletrico', type: 'number', width: 1, nullable: true })
  tetoSolarEletrico!: boolean

  @Column({ name: 'teto_solar_panoramico', type: 'number', width: 1, nullable: true })
  tetoSolarPanoramico!: boolean

  // Seats
  @Column({ name: 'banco_traseiro_aquecido', type: 'number', width: 1, nullable: true })
  bancoTraseiroAquecido!: boolean

  @Column({ name: 'bancos_aquecimento_frontal', type: 'number', width: 1, nullable: true })
  bancosAquecimentoFrontal!: boolean

  @Column({ name: 'bancos_refrigerados_frontal', type: 'number', width: 1, nullable: true })
  bancosRefrigeradosFrontal!: boolean

  @Column({ name: 'banco_posicoes_eletrico', type: 'number', nullable: true })
  bancoPosicoesEletrico!: number

  // Lights
  @Column({ name: 'farois_full_led', type: 'number', width: 1, nullable: true })
  faroisFullLed!: boolean

  @Column({ name: 'drl_signature', type: 'number', width: 1, nullable: true })
  drlSignature!: boolean

  @Column({ name: 'farol_alto_automatico', type: 'number', width: 1, nullable: true })
  farolAltoAutomatico!: boolean

  @Column({ name: 'lanternas_led_parcial', type: 'number', width: 1, nullable: true })
  lanternasLedParcial!: boolean

  @Column({ name: 'lanternas_full_led', type: 'number', width: 1, nullable: true })
  lanternasFullLed!: boolean

  @Column({ name: 'farois_neblina_led', type: 'number', width: 1, nullable: true })
  faroisNeblinaLed!: boolean

  @Column({ name: 'farois_matrix_led', type: 'number', width: 1, nullable: true })
  faroisMatrixLed!: boolean

  @Column({ name: 'iluminacao_cacamba', type: 'number', width: 1, nullable: true })
  iluminacaoCacamba!: boolean

  // 4x4
  @Column({ name: 'tracao_4x4_high_low', type: 'number', width: 1, nullable: true })
  tracao4x4HighLow!: boolean

  @Column({ name: 'diferencial_traseiro_blocante', type: 'number', width: 1, nullable: true })
  diferencialTraseiroBlocante!: boolean

  @Column({ name: 'santo_antonio', type: 'number', width: 1, nullable: true })
  santoAntonio!: boolean

  @Column({ name: 'estribo_lateral_plataforma', type: 'number', width: 1, nullable: true })
  estribuLateralPlataforma!: boolean

  @Column({ name: 'protetor_cacamba', type: 'number', width: 1, nullable: true })
  protetorCacamba!: boolean

  @Column({ name: 'terrain_management_system', type: 'number', width: 1, nullable: true })
  terrainManagementSystem!: boolean

  @Column({ name: 'tracao_awd', type: 'number', width: 1, nullable: true })
  tracaoAwd!: boolean

  @Column({ name: 'suspensao_fox_live_valve', type: 'number', width: 1, nullable: true })
  suspensaoFoxLiveValve!: boolean

  // Comercial
  @Column({ name: 'preco_base_brl', type: 'number', nullable: true })
  precoBaseBrl!: number

  // Others
  @Column({ name: 'anos_garantia', type: 'number', nullable: true })
  anosGarantia!: number

  @Column({ name: 'apoio_braco_traseiro', type: 'number', width: 1, nullable: true })
  apoioBracoTraseiro!: boolean

  @Column({ name: 'cabine_dupla', type: 'number', width: 1, nullable: true })
  cabineDupla!: boolean

  @Column({ name: 'degrau_acesso_cacamba', type: 'number', width: 1, nullable: true })
  degrauAcessoCacamba!: boolean

  @Column({ name: 'assistente_tampa_cacamba', type: 'number', width: 1, nullable: true })
  assistenteTampaCacamba!: boolean

  @Column({ name: 'travamento_eletrico_cacamba', type: 'number', width: 1, nullable: true })
  travamentoEletricoCacamba!: boolean

  @Column({ name: 'engate_reboque_3500kg', type: 'number', width: 1, nullable: true })
  engateReboque3500kg!: boolean

  @Column({ name: 'bussola_inclinometro', type: 'number', width: 1, nullable: true })
  bussolaInclinometro!: boolean

  @Column({ name: 'console_apoio_braco_dianteiro', type: 'number', width: 1, nullable: true })
  consoleApoioBracoDianteiro!: boolean

  @Column({ name: 'disco_freio_traseiro', type: 'number', width: 1, nullable: true })
  discoFreioTraseiro!: boolean

  @Column({ name: 'ganchos_reboque_qtd', type: 'number', nullable: true })
  ganchosReboqueQtd!: number

  @Column({ name: 'protetor_carter', type: 'number', width: 1, nullable: true })
  protetorCarter!: boolean

  @Column({ name: 'protetor_tanque', type: 'number', width: 1, nullable: true })
  protetorTanque!: boolean

  @Column({ name: 'tapete_borracha', type: 'number', width: 1, nullable: true })
  tapeteBorracha!: boolean

  @Column({ name: 'iluminacao_ambiente', type: 'number', width: 1, nullable: true })
  iluminacaoAmbiente!: boolean

  @Column({ name: 'tomada_12v', type: 'number', width: 1, nullable: true })
  tomada12v!: boolean

  @Column({ name: 'bagageiro_teto_long', type: 'number', width: 1, nullable: true })
  bagageiroTetoLong!: boolean

  // Rastreabilidade das fontes
  @Column({ name: 'source_urls', type: 'clob', nullable: true })
  sourceUrls!: string

  @Column({ name: 'search_queries', type: 'clob', nullable: true })
  searchQueries!: string

  // Metadados
  @Column({ type: 'varchar2', length: 50, default: 'ia_generated' })
  source!: string

  @Column({ type: 'varchar2', length: 20, default: 'active' })
  status!: string

  @Column({ name: 'source_url', type: 'varchar2', length: 500, nullable: true })
  sourceUrl!: string

  @Column({ name: 'pdf_source_file', type: 'varchar2', length: 200, nullable: true })
  pdfSourceFile!: string

  @Column({ name: 'fetched_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  fetchedAt!: Date
}