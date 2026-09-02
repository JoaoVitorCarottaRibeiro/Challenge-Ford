"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleSpec = void 0;
const typeorm_1 = require("typeorm");
const Vehicle_1 = require("./Vehicle");
let VehicleSpec = class VehicleSpec {
    id;
    vehicle;
    // Engine & Transmission
    pesoOrdemMarchaKg;
    cilindradaL;
    potenciaCv;
    torqueNm;
    economiaCombustivelKmpl;
    transmissaoAutomatica;
    motorFlex;
    tecnologiaTurbo;
    qtdMarchas;
    fhev;
    phev;
    bev;
    motorDiesel;
    paddleShift;
    eShifter;
    tecnologiaBiturbo;
    motorEletrico;
    eAutonomyKm;
    // Wheels
    rodasLigaLeve;
    rodasPolegadas;
    pneusAtr;
    pneusRunflat;
    pneusAtrPlus;
    pneusAutoVedantes;
    estepeFullSize;
    estepeTemporario;
    // Connectivity
    lojaAplicativos;
    assistenteDigital;
    travaDestravaRemoto;
    ignicaoRemota;
    localizacaoVeiculo;
    vehicleHealthAlerts;
    sendPoiNavigation;
    geofencingGuardMode;
    vehicleRecovery;
    ubi;
    wifiHotspot;
    atualizacaoOta;
    // Multimídia
    bluetooth;
    cameraTraseira;
    camera180Graus;
    navegadorGps;
    navegadorGpsAtualizavel;
    comandoVoz;
    altoFalantesQtd;
    headUpDisplay;
    sistemaSomPremium;
    espelhamentoAndroidAppleCabo;
    multimidiaPolegadas;
    assistenciaEmergencia;
    carregamentoWireless;
    camera360;
    androidAppleWireless;
    painelInstrumentoColoridoPol;
    usbQtd;
    // Air Conditioning
    arCondSaida2aFileira;
    arCondAutomaticoDigital;
    arCondDuasZonas;
    // Safety
    controleAntiCapotamento;
    freioAutomaticoParado;
    tpms;
    controleDescida;
    controleAdaptativoCarga;
    controleReboque;
    trailControl;
    freioAutomaticoAposImpacto;
    assistenciaDirecaoDefensiva;
    airbagsQtd;
    // High Tech
    pilotoAutomatico;
    limitadorVelocidade;
    pilotoAutomaticoAdaptativo;
    sistemaPermanenciaFaixa;
    sensorEstacTraseiro;
    sensorEstacDianteiro;
    sensorChuva;
    retroVisorEletrocromico;
    sensorCrepuscular;
    detectorFadiga;
    freioMaoEletronico;
    retroVisorEletrico;
    blis;
    reconhecimentoSinaisTransito;
    aeb;
    retroVisorRebatimentoEletrico;
    alertaColisaoFrontal;
    sistemaCentralizacaoFaixa;
    accStopAndGo;
    blisAlertaTrafegoCruzado;
    reverseAeb;
    keylessEntryPeps;
    // Global Closing
    alarmeVolumetrico;
    globalOpening;
    travaEletricaPortas;
    vidroEletricoTraseiro;
    globalClosing;
    // Trim
    bancosCouro;
    manoplaCambioCouro;
    volanteCouro;
    painelSoftTouch;
    // SunRoof
    tetoSolarEletrico;
    tetoSolarPanoramico;
    // Seats
    bancoTraseiroAquecido;
    bancosAquecimentoFrontal;
    bancosRefrigeradosFrontal;
    bancoPosicoesEletrico;
    // Lights
    faroisFullLed;
    drlSignature;
    farolAltoAutomatico;
    lanternasLedParcial;
    lanternasFullLed;
    faroisNeblinaLed;
    faroisMatrixLed;
    iluminacaoCacamba;
    // 4x4
    tracao4x4HighLow;
    diferencialTraseiroBlocante;
    santoAntonio;
    estribuLateralPlataforma;
    protetorCacamba;
    terrainManagementSystem;
    tracaoAwd;
    suspensaoFoxLiveValve;
    // Comercial
    precoBaseBrl;
    // Others
    anosGarantia;
    apoioBracoTraseiro;
    cabineDupla;
    degrauAcessoCacamba;
    assistenteTampaCacamba;
    travamentoEletricoCacamba;
    engateReboque3500kg;
    bussolaInclinometro;
    consoleApoioBracoDianteiro;
    discoFreioTraseiro;
    ganchosReboqueQtd;
    protetorCarter;
    protetorTanque;
    tapeteBorracha;
    iluminacaoAmbiente;
    tomada12v;
    bagageiroTetoLong;
    // Rastreabilidade das fontes
    sourceUrls;
    searchQueries;
    // Metadados
    source;
    status;
    sourceUrl;
    pdfSourceFile;
    fetchedAt;
};
exports.VehicleSpec = VehicleSpec;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VehicleSpec.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Vehicle_1.Vehicle, vehicle => vehicle.spec),
    (0, typeorm_1.JoinColumn)({ name: 'vehicle_id' }),
    __metadata("design:type", Vehicle_1.Vehicle
    // Engine & Transmission
    )
], VehicleSpec.prototype, "vehicle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'peso_ordem_marcha_kg', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "pesoOrdemMarchaKg", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cilindrada_l', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "cilindradaL", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'potencia_cv', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "potenciaCv", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'torque_nm', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "torqueNm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'economia_combustivel_kmpl', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "economiaCombustivelKmpl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transmissao_automatica', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "transmissaoAutomatica", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motor_flex', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "motorFlex", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tecnologia_turbo', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tecnologiaTurbo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qtd_marchas', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "qtdMarchas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fhev', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "fhev", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phev', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "phev", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bev', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bev", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motor_diesel', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "motorDiesel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paddle_shift', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "paddleShift", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'e_shifter', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "eShifter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tecnologia_biturbo', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tecnologiaBiturbo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'motor_eletrico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "motorEletrico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'e_autonomy_km', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "eAutonomyKm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rodas_liga_leve', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "rodasLigaLeve", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rodas_polegadas', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "rodasPolegadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pneus_atr', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "pneusAtr", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pneus_runflat', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "pneusRunflat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pneus_atr_plus', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "pneusAtrPlus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pneus_auto_vedantes', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "pneusAutoVedantes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estepe_full_size', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "estepeFullSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estepe_temporario', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "estepeTemporario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'loja_aplicativos', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "lojaAplicativos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assistente_digital', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "assistenteDigital", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trava_destrava_remoto', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "travaDestravaRemoto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ignicao_remota', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "ignicaoRemota", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'localizacao_veiculo', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "localizacaoVeiculo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_health_alerts', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "vehicleHealthAlerts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'send_poi_navigation', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sendPoiNavigation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'geofencing_guard_mode', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "geofencingGuardMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_recovery', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "vehicleRecovery", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ubi', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "ubi", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wifi_hotspot', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "wifiHotspot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'atualizacao_ota', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "atualizacaoOta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bluetooth', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bluetooth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'camera_traseira', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "cameraTraseira", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'camera_180_graus', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "camera180Graus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'navegador_gps', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "navegadorGps", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'navegador_gps_atualizavel', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "navegadorGpsAtualizavel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comando_voz', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "comandoVoz", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alto_falantes_qtd', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "altoFalantesQtd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'head_up_display', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "headUpDisplay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sistema_som_premium', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sistemaSomPremium", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'espelhamento_android_apple_cabo', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "espelhamentoAndroidAppleCabo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'multimidia_polegadas', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "multimidiaPolegadas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assistencia_emergencia', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "assistenciaEmergencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'carregamento_wireless', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "carregamentoWireless", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'camera_360', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "camera360", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'android_apple_wireless', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "androidAppleWireless", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'painel_instrumento_colorido_pol', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "painelInstrumentoColoridoPol", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usb_qtd', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "usbQtd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ar_cond_saida_2a_fileira', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "arCondSaida2aFileira", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ar_cond_automatico_digital', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "arCondAutomaticoDigital", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ar_cond_duas_zonas', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "arCondDuasZonas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'controle_anti_capotamento', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "controleAntiCapotamento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'freio_automatico_parado', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "freioAutomaticoParado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tpms', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tpms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'controle_descida', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "controleDescida", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'controle_adaptativo_carga', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "controleAdaptativoCarga", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'controle_reboque', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "controleReboque", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trail_control', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "trailControl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'freio_automatico_apos_impacto', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "freioAutomaticoAposImpacto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assistencia_direcao_defensiva', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "assistenciaDirecaoDefensiva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'airbags_qtd', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "airbagsQtd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'piloto_automatico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "pilotoAutomatico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'limitador_velocidade', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "limitadorVelocidade", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'piloto_automatico_adaptativo', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "pilotoAutomaticoAdaptativo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sistema_permanencia_faixa', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sistemaPermanenciaFaixa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sensor_estac_traseiro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sensorEstacTraseiro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sensor_estac_dianteiro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sensorEstacDianteiro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sensor_chuva', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sensorChuva", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retrovisor_eletrocromico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "retroVisorEletrocromico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sensor_crepuscular', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sensorCrepuscular", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'detector_fadiga', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "detectorFadiga", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'freio_mao_eletronico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "freioMaoEletronico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retrovisor_eletrico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "retroVisorEletrico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blis', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "blis", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reconhecimento_sinais_transito', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "reconhecimentoSinaisTransito", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aeb', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "aeb", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retrovisor_rebatimento_eletrico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "retroVisorRebatimentoEletrico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alerta_colisao_frontal', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "alertaColisaoFrontal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sistema_centralizacao_faixa', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "sistemaCentralizacaoFaixa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'acc_stop_and_go', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "accStopAndGo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'blis_alerta_trafego_cruzado', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "blisAlertaTrafegoCruzado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reverse_aeb', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "reverseAeb", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'keyless_entry_peps', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "keylessEntryPeps", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alarme_volumetrico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "alarmeVolumetrico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'global_opening', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "globalOpening", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trava_eletrica_portas', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "travaEletricaPortas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vidro_eletrico_traseiro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "vidroEletricoTraseiro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'global_closing', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "globalClosing", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bancos_couro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bancosCouro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'manopla_cambio_couro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "manoplaCambioCouro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'volante_couro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "volanteCouro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'painel_soft_touch', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "painelSoftTouch", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teto_solar_eletrico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tetoSolarEletrico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teto_solar_panoramico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tetoSolarPanoramico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'banco_traseiro_aquecido', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bancoTraseiroAquecido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bancos_aquecimento_frontal', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bancosAquecimentoFrontal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bancos_refrigerados_frontal', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bancosRefrigeradosFrontal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'banco_posicoes_eletrico', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "bancoPosicoesEletrico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'farois_full_led', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "faroisFullLed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'drl_signature', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "drlSignature", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'farol_alto_automatico', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "farolAltoAutomatico", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lanternas_led_parcial', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "lanternasLedParcial", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lanternas_full_led', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "lanternasFullLed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'farois_neblina_led', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "faroisNeblinaLed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'farois_matrix_led', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "faroisMatrixLed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'iluminacao_cacamba', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "iluminacaoCacamba", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tracao_4x4_high_low', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tracao4x4HighLow", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'diferencial_traseiro_blocante', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "diferencialTraseiroBlocante", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'santo_antonio', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "santoAntonio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estribo_lateral_plataforma', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "estribuLateralPlataforma", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'protetor_cacamba', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "protetorCacamba", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'terrain_management_system', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "terrainManagementSystem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tracao_awd', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tracaoAwd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'suspensao_fox_live_valve', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "suspensaoFoxLiveValve", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preco_base_brl', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "precoBaseBrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'anos_garantia', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "anosGarantia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apoio_braco_traseiro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "apoioBracoTraseiro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cabine_dupla', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "cabineDupla", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'degrau_acesso_cacamba', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "degrauAcessoCacamba", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assistente_tampa_cacamba', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "assistenteTampaCacamba", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'travamento_eletrico_cacamba', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "travamentoEletricoCacamba", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engate_reboque_3500kg', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "engateReboque3500kg", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bussola_inclinometro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bussolaInclinometro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'console_apoio_braco_dianteiro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "consoleApoioBracoDianteiro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disco_freio_traseiro', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "discoFreioTraseiro", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ganchos_reboque_qtd', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], VehicleSpec.prototype, "ganchosReboqueQtd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'protetor_carter', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "protetorCarter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'protetor_tanque', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "protetorTanque", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tapete_borracha', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tapeteBorracha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'iluminacao_ambiente', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "iluminacaoAmbiente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tomada_12v', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "tomada12v", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bagageiro_teto_long', type: 'number', width: 1, nullable: true }),
    __metadata("design:type", Boolean)
], VehicleSpec.prototype, "bagageiroTetoLong", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_urls', type: 'clob', nullable: true }),
    __metadata("design:type", String)
], VehicleSpec.prototype, "sourceUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'search_queries', type: 'clob', nullable: true }),
    __metadata("design:type", String)
], VehicleSpec.prototype, "searchQueries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 50, default: 'ia_generated' }),
    __metadata("design:type", String)
], VehicleSpec.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 20, default: 'active' }),
    __metadata("design:type", String)
], VehicleSpec.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_url', type: 'varchar2', length: 500, nullable: true }),
    __metadata("design:type", String)
], VehicleSpec.prototype, "sourceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pdf_source_file', type: 'varchar2', length: 200, nullable: true }),
    __metadata("design:type", String)
], VehicleSpec.prototype, "pdfSourceFile", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fetched_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], VehicleSpec.prototype, "fetchedAt", void 0);
exports.VehicleSpec = VehicleSpec = __decorate([
    (0, typeorm_1.Entity)('vehicle_specs')
], VehicleSpec);
