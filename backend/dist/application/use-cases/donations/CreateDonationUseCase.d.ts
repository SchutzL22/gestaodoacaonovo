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
            matricula: string | null;
            id: string;
            isActive: boolean;
        };
        campaign: {
            status: import("@prisma/client").$Enums.CampaignStatus;
            title: string;
            id: string;
        } | null;
        receivedBy: {
            name: string;
            email: string;
            id: string;
        } | null;
    } & {
        status: import("@prisma/client").$Enums.DonationStatus;
        donorName: string | null;
        donorCpf: string | null;
        evidenceUrl: string | null;
        campaignId: string | null;
        receivedById: string | null;
        observation: string | null;
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
