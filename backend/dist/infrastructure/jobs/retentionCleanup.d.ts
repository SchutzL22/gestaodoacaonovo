export declare function cleanupExpiredDonations(): Promise<{
    deletedCount: number;
    cutoffDate: Date;
}>;
