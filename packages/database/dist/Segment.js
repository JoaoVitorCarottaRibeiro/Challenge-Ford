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
exports.Segment = void 0;
const typeorm_1 = require("typeorm");
const Vehicle_1 = require("./Vehicle");
let Segment = class Segment {
    id;
    name;
    vehicles;
};
exports.Segment = Segment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Segment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 100, unique: true }),
    __metadata("design:type", String)
], Segment.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Vehicle_1.Vehicle, vehicle => vehicle.segment),
    __metadata("design:type", Array)
], Segment.prototype, "vehicles", void 0);
exports.Segment = Segment = __decorate([
    (0, typeorm_1.Entity)('segments')
], Segment);
