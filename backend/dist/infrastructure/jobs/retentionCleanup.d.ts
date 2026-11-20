export interface RetentionResult {
    deletedCount: number;
    anonymizedCount: number;
    cutoffDate: Date;
    executedAt: Date;
    triggeredBy: string;
    executionTimeMs: number;
}
export declare function cleanupExpiredDonations(triggeredBy?: string): Promise<RetentionResult>;
export declare function scheduleRetentionJob(): void;
