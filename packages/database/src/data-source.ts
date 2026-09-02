import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Segment } from './Segment'
import { Vehicle } from './Vehicle'
import { VehicleSpec } from './VehicleSpec'
import { AuditLog } from './AuditLog'
import { User } from './User'

export const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1521,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  sid: process.env.DB_SERVICE,
  synchronize: true,
  logging: ['error'],
  entities: [Segment, Vehicle, VehicleSpec, AuditLog, User],
})