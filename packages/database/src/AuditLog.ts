import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar2', length: 100 })
  action!: string

  @Column({ type: 'varchar2', length: 50, nullable: true })
  ip!: string

  @Column({ name: 'user_agent', type: 'varchar2', length: 255, nullable: true })
  userAgent!: string

  @Column({ type: 'clob', nullable: true })
  payload!: string

  @Column({ type: 'varchar2', length: 20, default: 'success' })
  status!: string

  @Column({ name: 'error_message', type: 'varchar2', length: 500, nullable: true })
  errorMessage!: string

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}