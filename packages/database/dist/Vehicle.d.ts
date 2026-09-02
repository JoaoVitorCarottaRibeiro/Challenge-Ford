import { Segment } from './Segment';
import { VehicleSpec } from './VehicleSpec';
export declare class Vehicle {
    id: string;
    segment: Segment;
    brand: string;
    model: string;
    version: string;
    yearModel: number;
    yearModelEnd: number;
    isMidyear: boolean;
    createdAt: Date;
    spec: VehicleSpec;
}
