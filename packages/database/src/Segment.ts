import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Vehicle } from './Vehicle'

@Entity('segments')
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar2', length: 100, unique: true })
  name!: string

  @OneToMany(() => Vehicle, vehicle => vehicle.segment)
  vehicles!: Vehicle[]
}