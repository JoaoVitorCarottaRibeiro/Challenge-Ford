export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    isActive: boolean;
    failedAttempts: number;
    lockedUntil: Date;
    lastLogin: Date;
    createdAt: Date;
}
