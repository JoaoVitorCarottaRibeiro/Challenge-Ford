import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar2', length: 100, unique: true })
  email!: string

  @Column({ name: 'password_hash', type: 'varchar2', length: 255 })
  passwordHash!: string

  @Column({ type: 'varchar2', length: 20, default: 'analyst' })
  role!: string

  @Column({ name: 'is_active', type: 'number', width: 1, default: 1 })
  isActive!: boolean

  @Column({ name: 'failed_attempts', type: 'number', default: 0 })
  failedAttempts!: number

  @Column({ name: 'locked_until', type: 'timestamp with time zone', nullable: true })
  lockedUntil!: Date

  @Column({ name: 'last_login', type: 'timestamp with time zone', nullable: true })
  lastLogin!: Date

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}