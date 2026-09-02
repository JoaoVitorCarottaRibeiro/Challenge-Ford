import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm'
import { Segment } from './Segment'
import { VehicleSpec } from './VehicleSpec'

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Segment, segment => segment.vehicles)
  @JoinColumn({ name: 'segment_id' })
  segment!: Segment

  @Column({ type: 'varchar2', length: 100 })
  brand!: string

  @Column({ type: 'varchar2', length: 100 })
  model!: string

  @Column({ type: 'varchar2', length: 100 })
  version!: string

  @Column({ name: 'year_model', type: 'number', nullable: true })
  yearModel!: number

  @Column({ name: 'year_model_end', type: 'number', nullable: true })
  yearModelEnd!: number

  @Column({ name: 'is_midyear', type: 'number', width: 1, default: 0 })
  isMidyear!: boolean

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @OneToOne(() => VehicleSpec, spec => spec.vehicle)
  spec!: VehicleSpec
}