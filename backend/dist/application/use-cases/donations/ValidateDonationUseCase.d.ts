import { ValidateDonationInput } from '../../dtos/donation.dto.js';
export declare class ValidateDonationUseCase {
    execute(donationId: string, validatorId: string, data: ValidateDonationInput): Promise<{
        donation: {
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
                cpf: string;
                role: import("@prisma/client").$Enums.UserRole;
                matricula: string | null;
                id: string;
                isActive: boolean;
                totalHoursEarned: number;
            };
            validatedBy: {
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
        };
        certificate: {
            type: import("@prisma/client").$Enums.DocType;
            title: string;
            description: string | null;
            enrollmentId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            authHash: string;
            validationUrl: string;
            hours: number | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            issuedAt: Date;
            donationId: string | null;
        } | null;
    }>;
}
