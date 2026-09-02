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
exports.Vehicle = void 0;
const typeorm_1 = require("typeorm");
const Segment_1 = require("./Segment");
const VehicleSpec_1 = require("./VehicleSpec");
let Vehicle = class Vehicle {
    id;
    segment;
    brand;
    model;
    version;
    yearModel;
    yearModelEnd;
    isMidyear;
    createdAt;
    spec;
};
exports.Vehicle = Vehicle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Vehicle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Segment_1.Segment, segment => segment.vehicles),
    (0, typeorm_1.JoinColumn)({ name: 'segment_id' }),
    __metadata("design:type", Segment_1.Segment)
], Vehicle.prototype, "segment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 100 }),
    __metadata("design:type", String)
], Vehicle.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 100 }),
    __metadata("design:type", String)
], Vehicle.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 100 }),
    __metadata("design:type", String)
], Vehicle.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'year_model', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], Vehicle.prototype, "yearModel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'year_model_end', type: 'number', nullable: true }),
    __metadata("design:type", Number)
], Vehicle.prototype, "yearModelEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_midyear', type: 'number', width: 1, default: 0 }),
    __metadata("design:type", Boolean)
], Vehicle.prototype, "isMidyear", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Vehicle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => VehicleSpec_1.VehicleSpec, spec => spec.vehicle),
    __metadata("design:type", VehicleSpec_1.VehicleSpec)
], Vehicle.prototype, "spec", void 0);
exports.Vehicle = Vehicle = __decorate([
    (0, typeorm_1.Entity)('vehicles')
], Vehicle);
