"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Segment_1 = require("./Segment");
const Vehicle_1 = require("./Vehicle");
const VehicleSpec_1 = require("./VehicleSpec");
const AuditLog_1 = require("./AuditLog");
const User_1 = require("./User");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'oracle',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 1521,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    sid: process.env.DB_SERVICE,
    synchronize: true,
    logging: ['error'],
    entities: [Segment_1.Segment, Vehicle_1.Vehicle, VehicleSpec_1.VehicleSpec, AuditLog_1.AuditLog, User_1.User],
});
