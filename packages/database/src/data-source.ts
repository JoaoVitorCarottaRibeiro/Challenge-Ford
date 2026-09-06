import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Segment } from './Segment'
import { Vehicle } from './Vehicle'
import { VehicleSpec } from './VehicleSpec'
import { AuditLog } from './AuditLog'
import { User } from './User'

// synchronize roda DDL (ALTER/CREATE) no boot. Em produção isso é perigoso contra
// o Oracle compartilhado da FIAP — só liga fora de produção, ou explicitamente com
// DB_SYNC=true por um boot quando há mudança de schema pra aplicar.
const shouldSync =
  process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true'

export const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1521,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  sid: process.env.DB_SERVICE,
  synchronize: shouldSync,
  logging: ['error'],
  entities: [Segment, Vehicle, VehicleSpec, AuditLog, User],
})