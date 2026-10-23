import { CreateDonationInput } from '../../dtos/donation.dto.js';
export declare class CreateDonationUseCase {
    execute(userId: string, data: CreateDonationInput): Promise<{
        items: {
            description: string;
            category: string;
            quantity: number;
            unit: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            donationId: string;
        }[];
        user: {
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            id: string;
        };
    } & {
        status: import("@prisma/client").$Enums.DonationStatus;
        evidenceUrl: string | null;
        hoursEarned: number;
        rejectionReason: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        validatedByUserId: string | null;
        authHash: string;
    }>;
}
