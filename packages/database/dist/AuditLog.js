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
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
let AuditLog = class AuditLog {
    id;
    action;
    ip;
    userAgent;
    payload;
    status;
    errorMessage;
    createdAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 100 }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 50, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'varchar2', length: 255, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'clob', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 20, default: 'success' }),
    __metadata("design:type", String)
], AuditLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'varchar2', length: 500, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs')
], AuditLog);
